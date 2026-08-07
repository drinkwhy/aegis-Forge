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
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await isReviewer(userId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { decision, notes } = body;

  const validDecisions = ['APPROVED', 'REJECTED', 'REMEDIATION_REQUIRED', 'RETEST_REQUIRED'];
  if (!validDecisions.includes(decision)) {
    return NextResponse.json({ error: `decision must be one of: ${validDecisions.join(', ')}` }, { status: 400 });
  }

  const sql = getSql();

  const [order] = await sql`SELECT id, organization_id, status FROM audit_orders WHERE id = ${id}`;
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [review] = await sql`
    INSERT INTO audit_reviews (organization_id, audit_order_id, reviewer_user_id, decision, notes)
    VALUES (${order.organization_id}, ${id}, ${userId}, ${decision}, ${notes ?? null})
    RETURNING id, decision, notes, reviewed_at
  `;

  // Update order status based on decision
  let newStatus = order.status;
  if (decision === 'APPROVED') newStatus = 'COMPLETED';
  else if (decision === 'REMEDIATION_REQUIRED') newStatus = 'REMEDIATION_REQUIRED';
  else if (decision === 'RETEST_REQUIRED') newStatus = 'READY';

  if (newStatus !== order.status) {
    await sql`
      UPDATE audit_orders SET status = ${newStatus}, updated_at = NOW() WHERE id = ${id}
    `;
  }

  await sql`
    INSERT INTO audit_events (organization_id, audit_order_id, event_type, actor_user_id, actor_type, payload)
    VALUES (${order.organization_id}, ${id}, 'REVIEW_SUBMITTED', ${userId}, 'user',
      ${JSON.stringify({ decision, notes })})
  `;

  return NextResponse.json({ review, newStatus });
}
