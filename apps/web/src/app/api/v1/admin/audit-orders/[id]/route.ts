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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await isReviewer(userId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const sql = getSql();

  const [order] = await sql`
    SELECT o.*, a.name AS asset_name, a.asset_type, org.display_name AS org_name
    FROM audit_orders o
    JOIN assets a ON a.id = o.asset_id
    JOIN organizations org ON org.id = o.organization_id
    WHERE o.id = ${id}
  `;

  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [target] = await sql`SELECT * FROM audit_targets WHERE audit_order_id = ${id} LIMIT 1`;
  const [roe] = await sql`SELECT * FROM rules_of_engagement WHERE audit_order_id = ${id} LIMIT 1`;
  const [execution] = await sql`
    SELECT * FROM assessment_executions WHERE audit_order_id = ${id}
    ORDER BY created_at DESC LIMIT 1
  `;

  const results = execution ? await sql`
    SELECT * FROM assessment_test_results WHERE execution_id = ${execution.id}
    ORDER BY executed_at ASC
  ` : [];

  const findings = await sql`
    SELECT id, title, severity, status, created_at FROM findings
    WHERE campaign_id IN (
      SELECT id FROM campaigns WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE tenant_id = ${order.organization_id}
      )
    )
    ORDER BY created_at DESC
    LIMIT 50
  `;

  const reviews = await sql`
    SELECT * FROM audit_reviews WHERE audit_order_id = ${id}
    ORDER BY reviewed_at DESC
  `;

  const events = await sql`
    SELECT * FROM audit_events WHERE audit_order_id = ${id}
    ORDER BY occurred_at DESC LIMIT 50
  `;

  return NextResponse.json({
    order,
    target: target ?? null,
    rulesOfEngagement: roe ?? null,
    execution: execution ?? null,
    testResults: results,
    findings,
    reviews,
    events,
  });
}
