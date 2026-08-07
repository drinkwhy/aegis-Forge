import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

async function isReviewer(userId: string): Promise<boolean> {
  const sql = getSql();
  const [role] = await sql`SELECT role FROM user_roles WHERE clerk_user_id = ${userId}`;
  return role && ['reviewer', 'admin'].includes(role.role);
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!(await isReviewer(userId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const sql = getSql();

  const orders = await sql`
    SELECT
      o.id, o.status, o.amount, o.currency, o.paid_at, o.created_at, o.updated_at,
      o.purchaser_user_id, o.product_code,
      a.name AS asset_name, a.asset_type,
      org.display_name AS org_name, org.id AS org_id,
      t.endpoint, t.target_type, t.environment,
      e.id AS execution_id, e.status AS execution_status,
      e.total_tests, e.completed_tests, e.failed_tests
    FROM audit_orders o
    JOIN assets a ON a.id = o.asset_id
    JOIN organizations org ON org.id = o.organization_id
    LEFT JOIN audit_targets t ON t.audit_order_id = o.id
    LEFT JOIN LATERAL (
      SELECT id, status, total_tests, completed_tests, failed_tests
      FROM assessment_executions
      WHERE audit_order_id = o.id
      ORDER BY created_at DESC LIMIT 1
    ) e ON true
    ORDER BY o.created_at DESC
  `;

  return NextResponse.json({ orders });
}
