'use client';
import { use, useState } from 'react';
import useSWR from 'swr';
import {
  Shield, CheckCircle, XCircle, AlertTriangle, Clock,
  ChevronLeft, Loader2, Hash, FileText, User
} from 'lucide-react';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AdminAuditDetail({ params }: { params: Promise<{ auditId: string }> }) {
  const { auditId } = use(params);
  const { data, isLoading, mutate } = useSWR(`/api/v1/admin/audit-orders/${auditId}`, fetcher);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [issueLoading, setIssueLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Loader2 size={28} color="var(--primary)" className="animate-spin" /></div>;
  }

  if (!data?.order) {
    return <div style={{ padding: '40px', color: 'var(--text-secondary)' }}>Audit order not found or insufficient permissions.</div>;
  }

  const { order, target, rulesOfEngagement: roe, execution, testResults, reviews, events } = data;

  async function submitReview(decision: string) {
    setActionError(null);
    setReviewLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/audit-orders/${auditId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, notes: reviewNotes }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Review failed');
      }
      setReviewNotes('');
      mutate();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setReviewLoading(false);
    }
  }

  async function issuePassport() {
    setActionError(null);
    setIssueLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/audit-orders/${auditId}/issue-passport`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Passport issuance failed');
      }
      mutate();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIssueLoading(false);
    }
  }

  const canIssuePassport = ['COMPLETED', 'REVIEW_REQUIRED'].includes(order.status) && !order.passport_id;
  const canApprove = ['REVIEW_REQUIRED', 'COMPLETED'].includes(order.status);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/admin/audits" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '12px' }}>
          <ChevronLeft size={13} /> Back
        </Link>
        <h2 style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-display)' }}>{order.asset_name}</h2>
        <span style={{ fontSize: '11px', padding: '2px 10px', borderRadius: '99px', background: 'var(--primary-dim)', color: 'var(--primary)', fontWeight: 700 }}>{order.status}</span>
      </div>

      {actionError && (
        <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={14} /> {actionError}
        </div>
      )}

      {/* Overview Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Order Info */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-secondary)' }}>ORDER DETAILS</h3>
          <InfoRow label="Organization" value={order.org_name} />
          <InfoRow label="Product" value={order.product_code} />
          <InfoRow label="Amount" value={`$${((order.amount || 0) / 100).toFixed(2)} ${order.currency?.toUpperCase()}`} />
          <InfoRow label="Payment" value={order.paid_at ? `Paid ${new Date(order.paid_at).toLocaleString()}` : 'Not paid'} />
          <InfoRow label="Customer" value={order.purchaser_user_id} mono />
        </div>

        {/* Target Info */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-secondary)' }}>TARGET</h3>
          {target ? (
            <>
              <InfoRow label="Type" value={target.target_type} />
              <InfoRow label="Endpoint" value={target.endpoint} mono />
              <InfoRow label="Environment" value={target.environment} />
              <InfoRow label="Ownership" value={target.ownership_confirmed ? '✓ Confirmed' : '✗ Not confirmed'} />
            </>
          ) : <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No target registered</p>}
        </div>

        {/* RoE */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-secondary)' }}>RULES OF ENGAGEMENT</h3>
          {roe ? (
            <>
              <InfoRow label="Status" value={roe.status} />
              <InfoRow label="Signed" value={roe.signed_at ? new Date(roe.signed_at).toLocaleString() : 'Not signed'} />
              <InfoRow label="Tests" value={(roe.permitted_tests || []).join(', ') || 'None'} />
              <InfoRow label="Window Start" value={roe.testing_window_start ? new Date(roe.testing_window_start).toLocaleString() : 'Any time'} />
              <InfoRow label="Window End" value={roe.testing_window_end ? new Date(roe.testing_window_end).toLocaleString() : 'Any time'} />
            </>
          ) : <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No RoE signed</p>}
        </div>

        {/* Execution */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-secondary)' }}>ASSESSMENT EXECUTION</h3>
          {execution ? (
            <>
              <InfoRow label="Status" value={execution.status} />
              <InfoRow label="Progress" value={`${execution.completed_tests}/${execution.total_tests} tests`} />
              <InfoRow label="Findings" value={`${execution.failed_tests} detected`} />
              <InfoRow label="Started" value={execution.started_at ? new Date(execution.started_at).toLocaleString() : '—'} />
              <InfoRow label="Completed" value={execution.completed_at ? new Date(execution.completed_at).toLocaleString() : '—'} />
            </>
          ) : <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No execution yet</p>}
        </div>
      </div>

      {/* Test Results */}
      {testResults && testResults.length > 0 && (
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-secondary)' }}>TEST RESULTS ({testResults.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {testResults.map((r: Record<string, unknown>) => (
              <div key={String(r.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', border: `1px solid ${r.passed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.15)'}` }}>
                {r.passed ? <CheckCircle size={12} color="#10b981" /> : <XCircle size={12} color="#ef4444" />}
                <span style={{ fontSize: '12px', fontWeight: 600, flex: 1 }}>{String(r.test_definition_id)}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{String(r.test_category).replace(/_/g, ' ')}</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: r.severity === 'CRITICAL' ? '#ef4444' : r.severity === 'HIGH' ? '#f97316' : 'var(--text-muted)' }}>{String(r.severity)}</span>
                {r.evidence_hash && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }} title={String(r.evidence_hash)}>
                    <Hash size={9} />{String(r.evidence_hash).slice(0, 8)}&hellip;
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviewer Actions */}
      {canApprove && (
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-secondary)' }}>REVIEWER ACTIONS</h3>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>REVIEW NOTES (OPTIONAL)</label>
            <textarea
              value={reviewNotes}
              onChange={e => setReviewNotes(e.target.value)}
              placeholder="Add notes about this assessment review..."
              rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '12px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={() => submitReview('APPROVED')} disabled={reviewLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '9px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', cursor: reviewLoading ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600 }}>
              {reviewLoading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />} Approve Assessment
            </button>
            <button onClick={() => submitReview('REMEDIATION_REQUIRED')} disabled={reviewLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '9px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', cursor: reviewLoading ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600 }}>
              <AlertTriangle size={12} /> Request Remediation
            </button>
            <button onClick={() => submitReview('RETEST_REQUIRED')} disabled={reviewLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '9px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: reviewLoading ? 'not-allowed' : 'pointer', fontSize: '12px' }}>
              <Clock size={12} /> Request Retest
            </button>
          </div>
        </div>
      )}

      {/* Passport Issuance */}
      {canIssuePassport && (
        <div className="glass-card" style={{ padding: '20px', borderColor: 'rgba(16,185,129,0.3)' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#10b981' }}>PASSPORT ISSUANCE</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>This assessment is complete. All pre-issuance checks will be verified server-side before the passport is signed.</p>
          <button onClick={issuePassport} disabled={issueLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: 'var(--radius-sm)', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.4)', color: '#10b981', cursor: issueLoading ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 700 }}>
            {issueLoading ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
            Issue Security Passport
          </button>
        </div>
      )}

      {/* Passport Link */}
      {order.passport_id && (
        <div className="glass-card" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Shield size={18} color="#10b981" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 700 }}>Security Passport Issued</div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{order.passport_id}</div>
          </div>
          <Link href={`/verify/passport/${order.passport_id}`} target="_blank" style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none' }}>View &rarr;</Link>
        </div>
      )}

      {/* Reviews History */}
      {reviews && reviews.length > 0 && (
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-secondary)' }}>REVIEW HISTORY</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {reviews.map((r: Record<string, unknown>) => (
              <div key={String(r.id)} style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>{String(r.decision)}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(String(r.reviewed_at)).toLocaleString()}</span>
                </div>
                {r.notes && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>{String(r.notes)}</p>}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '10px', color: 'var(--text-muted)' }}>
                  <User size={9} /> {String(r.reviewer_user_id)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Log */}
      {events && events.length > 0 && (
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-secondary)' }}>AUDIT EVENT LOG</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {events.map((e: Record<string, unknown>) => (
              <div key={String(e.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                <Clock size={10} style={{ flexShrink: 0 }} />
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{String(e.event_type)}</span>
                <span style={{ color: 'var(--text-muted)' }}>{String(e.actor_type)}</span>
                <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>{new Date(String(e.occurred_at)).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', fontSize: '12px' }}>
      <span style={{ color: 'var(--text-muted)', minWidth: '90px', flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', fontFamily: mono ? 'var(--font-mono)' : undefined, wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}
