import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const sql = getSql();

  const [order] = await sql`
    SELECT id, status, amount, currency, paid_at,
           stripe_checkout_session_id, stripe_payment_intent_id
    FROM audit_orders
    WHERE id = ${id} AND purchaser_user_id = ${userId}
  `;

  if (!order) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const paid = ['PAID','ASSESSMENT_RUNNING','REVIEW_REQUIRED','COMPLETED'].includes(order.status);

  return NextResponse.json({
    orderId: id,
    status: order.status,
    paid,
    amount: order.amount,
    currency: order.currency,
    paidAt: order.paid_at,
    stripeCheckoutSessionId: order.stripe_checkout_session_id,
    stripePaymentIntentId: order.stripe_payment_intent_id,
  });
}
