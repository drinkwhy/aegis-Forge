'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Shield, Loader2, ArrowRight, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order_id');
  const sessionId = searchParams.get('session_id');
  const [paymentStatus, setPaymentStatus] = useState<'checking' | 'paid' | 'error'>('checking');

  useEffect(() => {
    if (!orderId) {
      router.push('/security-audit');
      return;
    }

    // Poll for payment confirmation
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/v1/audit-orders/${orderId}/payment-status`);
        const data = await res.json();
        if (data.paid) {
          clearInterval(poll);
          setPaymentStatus('paid');
        } else if (attempts > 10) {
          clearInterval(poll);
          setPaymentStatus('error');
        }
      } catch {
        if (attempts > 10) {
          clearInterval(poll);
          setPaymentStatus('error');
        }
      }
    }, 2000);

    return () => clearInterval(poll);
  }, [orderId, router]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div className="glass-card" style={{ maxWidth: '540px', width: '100%', padding: '40px', textAlign: 'center' }}>
        {paymentStatus === 'checking' && (
          <>
            <Loader2 size={48} color="var(--primary)" className="animate-spin" style={{ margin: '0 auto 20px' }} />
            <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Confirming Payment...</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Verifying your payment with Stripe. This takes just a moment.</p>
          </>
        )}
        {paymentStatus === 'paid' && (
          <>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle size={36} color="#10b981" />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Payment Confirmed!</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px', lineHeight: 1.6 }}>
              Your Aegis Verified Launch Assessment has been initiated. Our team will review your intake and begin the assessment shortly.
            </p>
            <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Shield size={14} color="#10b981" />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>What happens next</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.7, textAlign: 'left' }}>
                <div>1. Aegis validates your Rules of Engagement</div>
                <div>2. Assessment worker executes authorized tests</div>
                <div>3. Our reviewer analyzes all findings</div>
                <div>4. You receive the signed Security Passport</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              {orderId && (
                <Link href={`/security-audit/status/${orderId}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '11px 20px', borderRadius: 'var(--radius-sm)', background: 'var(--primary)', color: 'white', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
                  <Clock size={13} /> Track Assessment <ArrowRight size={13} />
                </Link>
              )}
            </div>
          </>
        )}
        {paymentStatus === 'error' && (
          <>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>Payment confirmation is taking longer than expected.</p>
            {sessionId && <p style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>Session: {sessionId}</p>}
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '12px' }}>If you completed payment, your order has been received. Check your email for confirmation.</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} color="var(--primary)" className="animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
