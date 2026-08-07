import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { enqueueAssessmentJob } from '@/lib/redis';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const sql = getSql();

  const [order] = await sql`
    SELECT o.id, o.organization_id, o.purchaser_user_id, o.asset_id,
           o.product_code, o.status, o.amount, o.currency,
           o.stripe_checkout_session_id, o.stripe_payment_intent_id,
           o.passport_id, o.paid_at, o.created_at, o.updated_at,
           a.name as asset_name, a.asset_type,
           org.display_name as org_name
    FROM audit_orders o
    JOIN assets a ON a.id = o.asset_id
    JOIN organizations org ON org.id = o.organization_id
    WHERE o.id = ${id} AND o.purchaser_user_id = ${userId}
  `;

  if (!order) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Also fetch the target if it exists
  const [target] = await sql`
    SELECT id, target_type, endpoint, environment, ownership_confirmed
    FROM audit_targets
    WHERE audit_order_id = ${id}
    LIMIT 1
  `;

  // And the RoE if it exists
  const [roe] = await sql`
    SELECT id, status, signed_at, testing_window_start, testing_window_end,
           permitted_tests, authorized_endpoints
    FROM rules_of_engagement
    WHERE audit_order_id = ${id}
    LIMIT 1
  `;

  // And execution status
  const [execution] = await sql`
    SELECT id, status, total_tests, completed_tests, failed_tests,
           started_at, completed_at, created_at, failure_reason
    FROM assessment_executions
    WHERE audit_order_id = ${id}
    ORDER BY created_at DESC
    LIMIT 1
  `;

  // If order is PAID and no execution exists, enqueue a real assessment job
  if (order.status === 'PAID' && !execution && target) {
    const [newExecution] = await sql`
      INSERT INTO assessment_executions (
        organization_id, audit_order_id, status, total_tests, completed_tests, failed_tests
      ) VALUES (
        ${order.organization_id}, ${id}, 'QUEUED', 0, 0, 0
      )
      RETURNING id, status, total_tests, completed_tests, failed_tests, started_at, completed_at, created_at
    `;

    // Update order status
    await sql`
      UPDATE audit_orders
      SET status = 'ASSESSMENT_QUEUED', updated_at = NOW()
      WHERE id = ${id}
    `;
    order.status = 'ASSESSMENT_QUEUED';

    // Enqueue job for the Go assessment-worker via Redis
    await enqueueAssessmentJob({
      executionId: newExecution.id,
      auditOrderId: id,
      organizationId: order.organization_id,
      targetId: target.id,
    });

    // Log audit event
    await sql`
      INSERT INTO audit_events (organization_id, audit_order_id, event_type, actor_user_id, actor_type, payload)
      VALUES (${order.organization_id}, ${id}, 'ASSESSMENT_QUEUED', ${userId}, 'system',
        ${JSON.stringify({ executionId: newExecution.id })}::jsonb)
    `;

    return NextResponse.json({
      ...order,
      target: target ?? null,
      rulesOfEngagement: roe ?? null,
      execution: newExecution,
    });
  }

  // Fetch test results if execution exists
  let testResults: Record<string, unknown>[] = [];
  if (execution) {
    testResults = await sql`
      SELECT id, test_definition_id, test_category, status, passed, severity,
             evidence_hash, duration_ms, request_summary, executed_at
      FROM assessment_test_results
      WHERE execution_id = ${execution.id}
      ORDER BY executed_at ASC
    `;
  }

  return NextResponse.json({
    ...order,
    target: target ?? null,
    rulesOfEngagement: roe ?? null,
    execution: execution ?? null,
    testResults,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const sql = getSql();

  // Verify ownership
  const [order] = await sql`
    SELECT id, organization_id, status, asset_id FROM audit_orders
    WHERE id = ${id} AND purchaser_user_id = ${userId}
  `;

  if (!order) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Only allow updating when in DRAFT or INTAKE_REQUIRED
  if (!['DRAFT', 'INTAKE_REQUIRED'].includes(order.status)) {
    return NextResponse.json(
      { error: `Cannot modify order in status ${order.status}` },
      { status: 409 }
    );
  }

  // Handle target registration
  if (body.target) {
    const { targetType, endpoint, authenticationReference, environment, ownershipConfirmed } = body.target;

    if (!targetType || !endpoint) {
      return NextResponse.json({ error: 'targetType and endpoint required' }, { status: 400 });
    }

    if (!['openai_compatible', 'mcp_server'].includes(targetType)) {
      return NextResponse.json({ error: 'Invalid targetType' }, { status: 400 });
    }

    // Upsert target
    const [existingTarget] = await sql`SELECT id FROM audit_targets WHERE audit_order_id = ${id}`;

    if (existingTarget) {
      await sql`
        UPDATE audit_targets
        SET target_type = ${targetType},
            endpoint = ${endpoint},
            authentication_reference = ${authenticationReference ?? null},
            environment = ${environment ?? 'production'},
            ownership_confirmed = ${ownershipConfirmed ?? false},
            updated_at = NOW()
        WHERE id = ${existingTarget.id}
      `;
    } else {
      await sql`
        INSERT INTO audit_targets
          (organization_id, audit_order_id, asset_id, target_type, endpoint,
           authentication_reference, environment, ownership_confirmed)
        VALUES
          (${order.organization_id}, ${id}, ${order.asset_id},
           ${targetType}, ${endpoint}, ${authenticationReference ?? null},
           ${environment ?? 'production'}, ${ownershipConfirmed ?? false})
      `;
    }
  }

  // Handle RoE signing
  if (body.roe) {
    const { permittedTests, prohibitedActions, testingWindowStart, testingWindowEnd,
            emergencyContact, authorizedEndpoints, rateLimit, signRoe } = body.roe;

    const [existingRoe] = await sql`SELECT id FROM rules_of_engagement WHERE audit_order_id = ${id}`;
    const [targetRow] = await sql`SELECT id FROM audit_targets WHERE audit_order_id = ${id} LIMIT 1`;

    if (!targetRow) {
      return NextResponse.json({ error: 'Register a target first' }, { status: 400 });
    }

    if (existingRoe) {
      await sql`
        UPDATE rules_of_engagement
        SET permitted_tests = ${permittedTests ?? []}::text[],
            prohibited_actions = ${prohibitedActions ?? []}::text[],
            testing_window_start = ${testingWindowStart ?? null},
            testing_window_end = ${testingWindowEnd ?? null},
            emergency_contact = ${emergencyContact ?? ''},
            authorized_endpoints = ${authorizedEndpoints ?? []}::text[],
            rate_limit = ${rateLimit ?? 10},
            signed_by_user_id = ${signRoe ? userId : null},
            signed_at = ${signRoe ? new Date().toISOString() : null},
            status = ${signRoe ? 'ACTIVE' : 'DRAFT'},
            expires_at = ${testingWindowEnd ?? null},
            updated_at = NOW()
        WHERE id = ${existingRoe.id}
      `;
    } else {
      await sql`
        INSERT INTO rules_of_engagement
          (organization_id, audit_order_id, target_id, permitted_tests, prohibited_actions,
           testing_window_start, testing_window_end, emergency_contact,
           authorized_endpoints, rate_limit,
           signed_by_user_id, signed_at, status, expires_at)
        VALUES
          (${order.organization_id}, ${id}, ${targetRow.id},
           ${permittedTests ?? []}::text[], ${prohibitedActions ?? []}::text[],
           ${testingWindowStart ?? null}, ${testingWindowEnd ?? null},
           ${emergencyContact ?? ''}, ${authorizedEndpoints ?? []}::text[],
           ${rateLimit ?? 10},
           ${signRoe ? userId : null},
           ${signRoe ? new Date().toISOString() : null},
           ${signRoe ? 'ACTIVE' : 'DRAFT'},
           ${testingWindowEnd ?? null})
      `;
    }

    // Log RoE signing
    if (signRoe) {
      await sql`
        INSERT INTO audit_events (organization_id, audit_order_id, event_type, actor_user_id, actor_type, payload)
        VALUES (${order.organization_id}, ${id}, 'ROE_SIGNED', ${userId}, 'user', '{}'::jsonb)
      `;
    }
  }

  // Return updated order
  const [updated] = await sql`
    SELECT id, status, amount, currency, updated_at FROM audit_orders WHERE id = ${id}
  `;

  return NextResponse.json(updated);
}
