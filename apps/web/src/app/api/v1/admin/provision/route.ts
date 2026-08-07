import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

/**
 * POST /api/v1/admin/provision
 * 
 * One-time admin provisioning endpoint. Inserts the calling user's Clerk ID
 * into user_roles with role='admin'. This is idempotent (ON CONFLICT DO NOTHING).
 * 
 * In production, this should be protected by a setup secret.
 * For now, it requires authentication and checks AEGIS_ADMIN_SETUP_SECRET.
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Optional: require a setup secret for production safety
  const setupSecret = process.env.AEGIS_ADMIN_SETUP_SECRET;
  if (setupSecret) {
    const body = await req.json().catch(() => ({}));
    if (body.secret !== setupSecret) {
      return NextResponse.json({ error: 'Invalid setup secret' }, { status: 403 });
    }
  }

  const sql = getSql();

  // Insert admin role (idempotent)
  await sql`
    INSERT INTO user_roles (clerk_user_id, role)
    VALUES (${userId}, 'admin')
    ON CONFLICT (clerk_user_id) DO UPDATE SET role = 'admin', updated_at = NOW()
  `;

  const [row] = await sql`
    SELECT id, clerk_user_id, role, created_at FROM user_roles WHERE clerk_user_id = ${userId}
  `;

  return NextResponse.json({ message: 'Admin role provisioned', user: row });
}
