'use client';
import useSWR from 'swr';
import Link from 'next/link';
import { ChevronRight, Clock, CheckCircle, AlertTriangle, DollarSign, Loader2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const STATUS_COLOR: Record<string, string> = {
  DRAFT: '#6b7280',
  PAYMENT_PENDING: '#f59e0b',
  PAID: '#3b82f6',
  ASSESSMENT_RUNNING: '#a855f7',
  REVIEW_REQUIRED: '#f97316',
  REMEDIATION_REQUIRED: '#ef4444',
  COMPLETED: '#10b981',
  CANCELED: '#6b7280',
  REFUNDED: '#6b7280',
};

export default function AdminAuditsPage() {
  const { data, isLoading } = useSWR('/api/v1/admin/audit-orders', fetcher, { refreshInterval: 15000 });
  const orders = data?.orders ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '4px' }}>Audit Orders</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Review and manage all customer assessment orders.</p>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Loader2 size={24} color="var(--primary)" className="animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No audit orders yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {orders.map((order: Record<string, unknown>) => {
            const color = STATUS_COLOR[String(order.status)] ?? '#6b7280';
            return (
              <Link
                key={String(order.id)}
                href={`/admin/audits/${order.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div className="glass-card" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'border-color 0.15s' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700 }}>{String(order.asset_name ?? 'Unknown Asset')}</span>
                      <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '99px', background: `${color}15`, color, fontWeight: 700, border: `1px solid ${color}30` }}>{String(order.status)}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {String(order.org_name)} · {String(order.target_type ?? '—')} · ${((Number(order.amount) || 0) / 100).toFixed(2)}
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right' }}>
                    <div>{order.paid_at ? `Paid ${new Date(String(order.paid_at)).toLocaleDateString()}` : 'Unpaid'}</div>
                    {order.execution_status && <div style={{ marginTop: '2px', color }}>{String(order.execution_status)}</div>}
                  </div>
                  <ChevronRight size={16} color="var(--text-muted)" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
