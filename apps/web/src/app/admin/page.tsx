'use client';
import useSWR from 'swr';
import { ShieldCheck, BarChart3, Users, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AdminOverview() {
  const { data, isLoading } = useSWR('/api/v1/admin/stats', fetcher, { refreshInterval: 30000 });

  const stat = (key: string) => isLoading ? '—' : String(data?.[key] ?? 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '4px' }}>Admin Overview</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Platform-wide visibility across all organizations.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
        {([
          { label: 'Organizations', icon: Users, color: 'var(--primary)', value: stat('total_organizations') },
          { label: 'Audit Orders', icon: BarChart3, color: '#a855f7', value: stat('total_orders') },
          { label: 'Valid Passports', icon: ShieldCheck, color: '#10b981', value: stat('valid_passports') },
          { label: 'Completed Assessments', icon: CheckCircle, color: '#f59e0b', value: stat('completed_orders') },
        ] as const).map(card => (
          <div key={card.label} className="glass-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${card.color}18`, border: `1px solid ${card.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <card.icon size={16} color={card.color} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>{card.label}</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'var(--font-display)', color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>
      <div className="glass-card" style={{ padding: '22px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link href="/admin/audits" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--primary-dim)', color: 'var(--primary)', textDecoration: 'none', fontSize: '12px', fontWeight: 600 }}>Review Audit Orders</Link>
          <Link href="/admin/passports" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '12px' }}>Passport Registry</Link>
        </div>
      </div>
    </div>
  );
}
