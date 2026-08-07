'use client';
import useSWR from 'swr';
import Link from 'next/link';
import { useState } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, PauseCircle, Ban, RefreshCw, Search, ChevronRight, ExternalLink, Filter, Loader2 } from 'lucide-react';

import { useActiveOrganization } from '@/context/OrganizationContext';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const STATUS_CFG: Record<string, { color: string; icon: React.ElementType }> = {
  VALID:     { color: '#10b981', icon: ShieldCheck },
  DEGRADED:  { color: '#f97316', icon: AlertTriangle },
  SUSPENDED: { color: '#eab308', icon: PauseCircle },
  REVOKED:   { color: '#ef4444', icon: Ban },
};

export default function AdminPassportsPage() {
  const { organizationId } = useActiveOrganization();
  const orgID = organizationId || '';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: passports, isLoading } = useSWR(
    orgID ? `/api/v1/organizations/${orgID}/security-passports?_k=${refreshKey}` : null,
    fetcher, { refreshInterval: 30000 }
  );

  const list = Array.isArray(passports) ? passports : [];
  const filtered = list.filter((p: Record<string, unknown>) => {
    const matchSearch = !search || String(p.systemDisplayName ?? '').toLowerCase().includes(search.toLowerCase()) || String(p.passportId ?? '').includes(search);
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    total: list.length,
    valid: list.filter((p: Record<string, unknown>) => p.status === 'VALID').length,
    degraded: list.filter((p: Record<string, unknown>) => p.status === 'DEGRADED').length,
    revoked: list.filter((p: Record<string, unknown>) => p.status === 'REVOKED').length,
  };
  const avgScore = list.length ? Math.round(list.reduce((a: number, p: Record<string, unknown>) => a + (Number(p.overallScore) || 0), 0) / list.length * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', marginBottom: '4px' }}>Passport Registry</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>All passports across all organizations · real-time</p>
        </div>
        <button onClick={() => setRefreshKey(k => k + 1)} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {[
          { label: 'Total Issued', value: counts.total, color: 'var(--primary)' },
          { label: 'Valid', value: counts.valid, color: '#10b981' },
          { label: 'Degraded', value: counts.degraded, color: '#f97316' },
          { label: 'Avg Score', value: `${avgScore}/100`, color: 'var(--text-primary)' },
        ].map(c => (
          <div key={c.label} className="glass-card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>{c.label}</div>
            <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-display)', color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="glass-card" style={{ padding: '14px 18px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input placeholder="Search passports…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '7px 10px 7px 30px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <Filter size={12} color="var(--text-muted)" />
          {['ALL', 'VALID', 'DEGRADED', 'SUSPENDED', 'REVOKED'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              style={{ padding: '4px 10px', borderRadius: '99px', fontSize: '10px', fontWeight: 600, border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
                borderColor: statusFilter === s ? 'var(--primary)' : 'var(--border)',
                background: statusFilter === s ? 'var(--primary-dim)' : 'transparent',
                color: statusFilter === s ? 'var(--primary)' : 'var(--text-muted)' }}>
              {s === 'ALL' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
              {['System', 'Status', 'Score', 'Org ID', 'Issued', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? Array.from({ length: 4 }).map((_, i) => (
              <tr key={i}><td colSpan={6} style={{ padding: '14px 14px' }}>
                <div style={{ height: '12px', borderRadius: '4px', background: 'var(--bg-elevated)', width: '100%' }} /></td></tr>
            )) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No passports found.</td></tr>
            ) : filtered.map((p: Record<string, unknown>, i: number) => {
              const status = String(p.status || 'VALID') as keyof typeof STATUS_CFG;
              const cfg = STATUS_CFG[status] || STATUS_CFG.VALID;
              const StatusIcon = cfg.icon;
              const score = Math.round((Number(p.overallScore) || 0) * 100);
              return (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{String(p.systemDisplayName || '—')}</div>
                    <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{String(p.passportId || '').slice(0, 20)}…</div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <StatusIcon size={12} color={cfg.color} />
                      <span style={{ fontSize: '11px', fontWeight: 700, color: cfg.color }}>{status}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ height: '4px', width: '60px', borderRadius: '2px', background: 'var(--bg-elevated)', marginBottom: '4px' }}>
                      <div style={{ height: '100%', width: `${score}%`, background: score >= 85 ? '#10b981' : score >= 60 ? '#f97316' : '#ef4444', borderRadius: '2px' }} />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: score >= 85 ? '#10b981' : '#f97316' }}>{score}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}><span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{String(p.organizationId || '').slice(0, 12)}…</span></td>
                  <td style={{ padding: '12px 14px' }}><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{p.issuedAt ? new Date(String(p.issuedAt)).toLocaleDateString() : '—'}</span></td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link href={`/admin/passports/${p.passportId}`} style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                        <ChevronRight size={11} /> View
                      </Link>
                      <Link href={`/verify/passport/${p.passportId}`} target="_blank" style={{ fontSize: '11px', color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <ExternalLink size={10} /> Seal
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length > 0 && (
          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-muted)' }}>
            Showing {filtered.length} of {list.length} passports
          </div>
        )}
      </div>
    </div>
  );
}
