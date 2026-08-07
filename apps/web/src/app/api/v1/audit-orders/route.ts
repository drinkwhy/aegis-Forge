import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { organizationId, assetId } = body;

  if (!organizationId || !assetId) {
    return NextResponse.json(
      { error: 'organizationId and assetId are required' },
      { status: 400 }
    );
  }

  const sql = getSql();

  // Verify org membership
  const [member] = await sql`
    SELECT 1 FROM organizations o
    LEFT JOIN organization_members m ON m.organization_id = o.id AND m.user_id = ${userId}
    WHERE o.id = ${organizationId} AND (o.owner_user_id = ${userId} OR m.user_id = ${userId})
  `;

  if (!member) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Verify asset belongs to this org
  const [asset] = await sql`
    SELECT id FROM assets WHERE id = ${assetId} AND organization_id = ${organizationId}
  `;

  if (!asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  const priceInCents = parseInt(process.env.LAUNCH_ASSESSMENT_PRICE_CENTS || '299900', 10);

  const [order] = await sql`
    INSERT INTO audit_orders
      (organization_id, purchaser_user_id, asset_id, product_code, status, amount, currency)
    VALUES
      (${organizationId}, ${userId}, ${assetId}, 'AEGIS_VERIFIED_LAUNCH_ASSESSMENT', 'DRAFT', ${priceInCents}, 'usd')
    RETURNING id, organization_id, purchaser_user_id, asset_id, product_code,
              status, amount, currency, created_at, updated_at
  `;

  // Log audit event
  await sql`
    INSERT INTO audit_events (organization_id, audit_order_id, event_type, actor_user_id, actor_type, payload)
    VALUES (${organizationId}, ${order.id}, 'ORDER_CREATED', ${userId}, 'user', '{}'::jsonb)
  `;

  return NextResponse.json(order, { status: 201 });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sql = getSql();

  const orders = await sql`
    SELECT o.id, o.organization_id, o.purchaser_user_id, o.asset_id,
           o.product_code, o.status, o.amount, o.currency,
           o.stripe_checkout_session_id, o.stripe_payment_intent_id,
           o.passport_id, o.paid_at, o.created_at, o.updated_at,
           a.name as asset_name, org.display_name as org_name
    FROM audit_orders o
    JOIN assets a ON a.id = o.asset_id
    JOIN organizations org ON org.id = o.organization_id
    WHERE o.purchaser_user_id = ${userId}
    ORDER BY o.created_at DESC
  `;

  return NextResponse.json({ orders });
}
