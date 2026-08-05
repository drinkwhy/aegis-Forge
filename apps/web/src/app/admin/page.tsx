'use client';
import useSWR from 'swr';
import { ShieldCheck, BarChart3, Users, Activity } from 'lucide-react';
import Link from 'next/link';

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID || 'd3b07384-d113-4a11-b541-ef81f212239e';
const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AdminOverview() {
  const { data: passports } = useSWR(`/api/v1/organizations/${ORG_ID}/security-passports`, fetcher);
  const list = Array.isArray(passports) ? passports : [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '4px' }}>Admin Overview</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Platform-wide visibility across all organizations.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <Link href="/admin/passports" style={{ textDecoration: 'none' }}>
          <div className="glass-card" style={{ padding: '22px', transition: 'border-color 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={16} color="#ef4444" />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Passport Registry</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#10b981' }}>{list.length}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>total passports issued</div>
          </div>
        </Link>
        <div className="glass-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} color="var(--primary)" />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Organizations</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--primary)' }}>1</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>active organizations</div>
        </div>
        <div className="glass-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={16} color="#10b981" />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Valid Passports</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#10b981' }}>
            {list.filter((p: Record<string, unknown>) => p.status === 'VALID').length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>currently accredited</div>
        </div>
      </div>
    </div>
  );
}
