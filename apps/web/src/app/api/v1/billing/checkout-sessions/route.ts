import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getSql } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { auditOrderId, organizationId } = body;

  if (!auditOrderId || !organizationId) {
    return NextResponse.json(
      { error: 'auditOrderId and organizationId are required' },
      { status: 400 }
    );
  }

  const sql = getSql();

  // Load and verify the order belongs to this user and is in DRAFT status
  const [order] = await sql`
    SELECT id, status, amount, currency, purchaser_user_id, organization_id
    FROM audit_orders
    WHERE id = ${auditOrderId}
      AND organization_id = ${organizationId}
      AND purchaser_user_id = ${userId}
  `;

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.status !== 'DRAFT' && order.status !== 'PAYMENT_PENDING') {
    return NextResponse.json(
      { error: `Order is in status ${order.status}, cannot create checkout session` },
      { status: 409 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  // ── Explicit dev payment bypass ───────────────────────────────────────────
  // Set AEGIS_SKIP_PAYMENT=true in .env to bypass Stripe in development.
  // This is NOT a silent fallback — it requires explicit opt-in.
  if (process.env.AEGIS_SKIP_PAYMENT === 'true') {
    console.log('[BILLING] AEGIS_SKIP_PAYMENT=true — marking order as PAID without Stripe.');

    await sql.begin(async (tx) => {
      await tx`
        UPDATE audit_orders
        SET status = 'PAID',
            paid_at = NOW(),
            updated_at = NOW()
        WHERE id = ${auditOrderId}
      `;

      await tx`
        INSERT INTO audit_events (
          organization_id, audit_order_id, event_type,
          actor_user_id, actor_type, payload
        ) VALUES (
          ${organizationId},
          ${auditOrderId},
          'PAYMENT_CONFIRMED',
          ${userId},
          'system',
          ${JSON.stringify({
            amountTotal: order.amount || 299900,
            currency: order.currency || 'usd',
            skipPayment: true,
          })}
        )
      `;
    });

    const successUrl = `${baseUrl}/security-audit/success?session_id=skip_payment_${Date.now()}&order_id=${auditOrderId}`;
    return NextResponse.json({ url: successUrl, sessionId: 'skip_payment' });
  }

  // ── Real Stripe checkout ──────────────────────────────────────────────────
  const priceId = process.env.STRIPE_PRICE_ID;
  const stripeSecret = process.env.STRIPE_SECRET_KEY;

  if (!priceId || !stripeSecret) {
    return NextResponse.json(
      { error: 'Stripe not configured. Set STRIPE_SECRET_KEY and STRIPE_PRICE_ID in .env, or set AEGIS_SKIP_PAYMENT=true to bypass.' },
      { status: 503 }
    );
  }

  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/security-audit/success?session_id={CHECKOUT_SESSION_ID}&order_id=${auditOrderId}`,
    cancel_url: `${baseUrl}/security-audit?step=payment&order_id=${auditOrderId}`,
    metadata: {
      auditOrderId,
      organizationId,
      userId,
    },
    client_reference_id: auditOrderId,
  });

  // Update order status to PAYMENT_PENDING and store session ID
  await sql`
    UPDATE audit_orders
    SET status = 'PAYMENT_PENDING',
        stripe_checkout_session_id = ${session.id},
        updated_at = NOW()
    WHERE id = ${auditOrderId}
  `;

  // Log audit event
  await sql`
    INSERT INTO audit_events (organization_id, audit_order_id, event_type, actor_user_id, actor_type, payload)
    VALUES (
      ${organizationId},
      ${auditOrderId},
      'CHECKOUT_SESSION_CREATED',
      ${userId},
      'user',
      ${JSON.stringify({ sessionId: session.id })}
    )
  `;

  return NextResponse.json({ url: session.url, sessionId: session.id });
}
