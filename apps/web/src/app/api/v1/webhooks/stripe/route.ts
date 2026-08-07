import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getSql } from '@/lib/db';
import Stripe from 'stripe';

// CRITICAL: This route must use raw body for Stripe signature verification
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.text(); // Raw body required for signature verification
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('Stripe webhook signature verification failed:', msg);
    return NextResponse.json({ error: `Webhook signature verification failed: ${msg}` }, { status: 400 });
  }

  const sql = getSql();

  // Check idempotency — have we already processed this event?
  const [existing] = await sql`
    SELECT id FROM stripe_events WHERE stripe_event_id = ${event.id}
  `;

  if (existing) {
    // Already processed — return 200 to acknowledge
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      const auditOrderId = session.metadata?.auditOrderId;
      const organizationId = session.metadata?.organizationId;
      const userId = session.metadata?.userId;

      if (!auditOrderId || !organizationId) {
        console.error('Missing metadata in Stripe session:', session.id);
        // Still store the event to prevent retries
        await sql`
          INSERT INTO stripe_events (stripe_event_id, event_type)
          VALUES (${event.id}, ${event.type})
        `;
        return NextResponse.json({ received: true });
      }

      // Verify the expected price is in the line items
      const stripe = getStripe();
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      const expectedPriceId = process.env.STRIPE_PRICE_ID;
      const expectedAmount = parseInt(process.env.LAUNCH_ASSESSMENT_PRICE_CENTS || '0', 10);

      const validLineItem = lineItems.data.some(item =>
        item.price?.id === expectedPriceId &&
        (item.amount_total ?? 0) > 0
      );

      if (!validLineItem && expectedPriceId) {
        console.error('Unexpected line items in Stripe session:', session.id, lineItems.data);
      }

      // Verify amount matches if we know what it should be
      if (expectedAmount > 0 && session.amount_total !== expectedAmount) {
        console.warn(`Amount mismatch: expected ${expectedAmount}, got ${session.amount_total} for order ${auditOrderId}`);
      }

      // Transactional update: mark order as PAID
      await sql.begin(async (sql) => {
        // Insert idempotency record first
        await sql`
          INSERT INTO stripe_events (stripe_event_id, event_type)
          VALUES (${event.id}, ${event.type})
        `;

        // Update order
        await sql`
          UPDATE audit_orders
          SET status = 'PAID',
              stripe_payment_intent_id = ${session.payment_intent as string},
              paid_at = NOW(),
              updated_at = NOW()
          WHERE id = ${auditOrderId}
            AND status IN ('PAYMENT_PENDING', 'DRAFT')
        `;

        // Insert audit event
        await sql`
          INSERT INTO audit_events (
            organization_id, audit_order_id, event_type,
            actor_user_id, actor_type, payload
          ) VALUES (
            ${organizationId},
            ${auditOrderId},
            'PAYMENT_CONFIRMED',
            ${userId ?? 'stripe'},
            'stripe',
            ${JSON.stringify({
              stripeSessionId: session.id,
              stripePaymentIntentId: session.payment_intent,
              amountTotal: session.amount_total,
              currency: session.currency,
            })}
          )
        `;
      });
    }
  } catch (err) {
    console.error('Error processing Stripe webhook event', event.id, err);
    // Return 500 so Stripe will retry
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
