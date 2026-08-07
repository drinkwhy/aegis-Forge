import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

async function isReviewer(userId: string): Promise<boolean> {
  const sql = getSql();
  const [role] = await sql`SELECT role FROM user_roles WHERE clerk_user_id = ${userId}`;
  if (role && ['reviewer', 'admin'].includes(role.role)) return true;

  const reviewerEmails = (process.env.AEGIS_REVIEWER_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
  return reviewerEmails.length === 0; // If no list configured, allow any authenticated user (dev mode)
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await isReviewer(userId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const sql = getSql();

  // Pre-issuance checks (all server-side)
  const [order] = await sql`
    SELECT o.id, o.organization_id, o.status, o.asset_id, o.passport_id,
           a.name AS asset_name, a.asset_type
    FROM audit_orders o
    JOIN assets a ON a.id = o.asset_id
    WHERE o.id = ${id}
  `;

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (order.passport_id) return NextResponse.json({ error: 'Passport already issued' }, { status: 409 });

  // 1. Payment complete?
  if (!['COMPLETED', 'REVIEW_REQUIRED'].includes(order.status)) {
    return NextResponse.json({ error: `Order status ${order.status} does not allow passport issuance` }, { status: 422 });
  }

  // 2. Reviewer approved?
  const [review] = await sql`
    SELECT id FROM audit_reviews
    WHERE audit_order_id = ${id} AND decision = 'APPROVED'
    ORDER BY reviewed_at DESC LIMIT 1
  `;
  if (!review) {
    return NextResponse.json({ error: 'No approved review found. Submit an APPROVED review first.' }, { status: 422 });
  }

  // 3. Assessment complete with evidence hashes?
  const [execution] = await sql`
    SELECT id, status FROM assessment_executions
    WHERE audit_order_id = ${id} AND status = 'COMPLETE'
    ORDER BY created_at DESC LIMIT 1
  `;
  if (!execution) {
    return NextResponse.json({ error: 'Assessment not complete' }, { status: 422 });
  }

  const [hashCheck] = await sql`
    SELECT COUNT(*) AS total,
           COUNT(evidence_hash) AS with_hash
    FROM assessment_test_results
    WHERE execution_id = ${execution.id}
  `;
  if (!hashCheck || parseInt(hashCheck.total) === 0) {
    return NextResponse.json({ error: 'No test results found' }, { status: 422 });
  }
  if (parseInt(hashCheck.with_hash) === 0) {
    return NextResponse.json({ error: 'No evidence hashes found — test results may be incomplete' }, { status: 422 });
  }

  // ── Call control-plane for real Ed25519 signing ────────────────────────────
  const controlPlaneUrl = process.env.NEXT_PUBLIC_CONTROL_PLANE_URL || 'http://localhost:8080';
  const apiSecret = process.env.CONTROL_PLANE_API_SECRET;

  try {
    const response = await fetch(
      `${controlPlaneUrl}/api/v1/admin/issue-passport`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiSecret ? { 'X-Api-Secret': apiSecret } : {}),
        },
        body: JSON.stringify({
          auditOrderId: id,
          organizationId: order.organization_id,
          reviewerUserId: userId,
          assetName: order.asset_name,
          executionId: execution.id,
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errBody.error || `Control plane returned ${response.status}` },
        { status: response.status }
      );
    }

    const result = await response.json();

    // Log audit event
    await sql`
      INSERT INTO audit_events (organization_id, audit_order_id, event_type, actor_user_id, actor_type, payload)
      VALUES (
        ${order.organization_id}, ${id}, 'PASSPORT_ISSUED', ${userId}, 'user',
        ${JSON.stringify({ passportId: result.passportId, reviewerUserId: userId })}
      )
    `;

    return NextResponse.json(result);
  } catch (err) {
    console.error('Error calling control-plane for passport issuance:', err);
    return NextResponse.json(
      { error: 'Control plane unavailable. Ensure the control-plane service is running on ' + controlPlaneUrl },
      { status: 503 }
    );
  }
}
