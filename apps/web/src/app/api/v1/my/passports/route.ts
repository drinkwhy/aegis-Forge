import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sql = getSql();

  // Get all audit orders for this user that have passports
  const orders = await sql`
    SELECT o.passport_id, o.id AS audit_order_id, a.name AS asset_name
    FROM audit_orders o
    JOIN assets a ON a.id = o.asset_id
    WHERE o.purchaser_user_id = ${userId}
      AND o.passport_id IS NOT NULL
  `;

  if (orders.length === 0) {
    return NextResponse.json([]);
  }

  const passportIds = orders.map((o: Record<string, string>) => o.passport_id);

  // Fetch actual passport records
  const passports = await sql`
    SELECT p.*, e.token AS verification_token
    FROM security_passports p
    LEFT JOIN external_verification_tokens e ON e.passport_id = p.passport_id
    WHERE p.passport_id = ANY(${passportIds}::uuid[])
    ORDER BY p.issued_at DESC
  `;

  return NextResponse.json(passports);
}
