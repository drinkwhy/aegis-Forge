import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

async function isReviewer(userId: string): Promise<boolean> {
  const sql = getSql();
  const [role] = await sql`
    SELECT role FROM user_roles WHERE clerk_user_id = ${userId}
  `;
  if (role && ['reviewer', 'admin'].includes(role.role)) return true;

  // Also check env-based reviewer list
  const reviewerEmails = (process.env.AEGIS_REVIEWER_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
  return reviewerEmails.length === 0; // If no list configured, allow any authenticated user (dev mode)
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!(await isReviewer(userId))) {
    return NextResponse.json({ error: 'Forbidden: reviewer role required' }, { status: 403 });
  }

  const sql = getSql();

  const [stats] = await sql`
    SELECT
      (SELECT COUNT(*) FROM organizations)::int AS total_organizations,
      (SELECT COUNT(*) FROM audit_orders)::int AS total_orders,
      (SELECT COUNT(*) FROM audit_orders WHERE status = 'PAID')::int AS paid_orders,
      (SELECT COUNT(*) FROM audit_orders WHERE status = 'COMPLETED')::int AS completed_orders,
      (SELECT COUNT(*) FROM security_passports WHERE status = 'VALID')::int AS valid_passports,
      (SELECT COUNT(*) FROM security_passports)::int AS total_passports
  `;

  return NextResponse.json(stats);
}
