'use client';
import useSWR from 'swr';
import Link from 'next/link';
import { ShieldCheck, AlertTriangle, PauseCircle, Ban, ExternalLink, Plus, RefreshCw, ChevronRight, Clock } from 'lucide-react';

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID || 'd3b07384-d113-4a11-b541-ef81f212239e';
const fetcher = (url: string) => fetch(url).then(r => r.json());

const STATUS_CFG: Record<string, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  VALID:     { color: '#10b981', bg: 'rgba(16,185,129,0.08)', icon: ShieldCheck,   label: 'Valid & Active' },
  DEGRADED:  { color: '#f97316', bg: 'rgba(249,115,22,0.08)', icon: AlertTriangle, label: 'Degraded' },
  SUSPENDED: { color: '#eab308', bg: 'rgba(234,179,8,0.08)',  icon: PauseCircle,   label: 'Suspended' },
  REVOKED:   { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  icon: Ban,           label: 'Revoked' },
};

function PassportCard({ passport }: { passport: Record<string, unknown> }) {
  const status = String(passport.status || 'VALID') as keyof typeof STATUS_CFG;
  const cfg = STATUS_CFG[status] || STATUS_CFG.VALID;
  const StatusIcon = cfg.icon;
  const score = Math.round((Number(passport.overallScore) || 0) * 100);
  const id = String(passport.passportId || '');
  const isExpiring = passport.validUntil && (new Date(passport.validUntil as string).getTime() - Date.now() < 30 * 86400000);

  return (
    <div className="glass-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', overflow: 'hidden' }}>
      {!!isExpiring && status === 'VALID' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(234,179,8,0.12)', borderBottom: '1px solid rgba(234,179,8,0.3)', padding: '5px 14px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: '#eab308', fontWeight: 600 }}>
          <Clock size={10} /> Expiring within 30 days
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: isExpiring ? '20px' : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '99px', background: cfg.bg, border: `1px solid ${cfg.color}40` }}>
          <StatusIcon size={11} color={cfg.color} />
          <span style={{ fontSize: '10px', fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-display)', color: score >= 85 ? '#10b981' : '#f97316' }}>
            {score}<span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/100</span>
          </div>
          <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assurance</div>
        </div>
      </div>
      <div>
        <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '3px' }}>{String(passport.systemDisplayName || 'Unnamed System')}</div>
        <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{id.slice(0, 24)}…</div>
      </div>
      <div style={{ height: '3px', borderRadius: '2px', background: 'var(--bg-elevated)' }}>
        <div style={{ height: '100%', width: `${score}%`, background: score >= 85 ? '#10b981' : '#f97316', borderRadius: '2px' }} />
      </div>
      <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
        <Link href={`/portal/passports/${id}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '7px', borderRadius: 'var(--radius-sm)', background: 'var(--primary-dim)', color: 'var(--primary)', textDecoration: 'none', fontSize: '12px', fontWeight: 600 }}>
          <ChevronRight size={12} /> Manage
        </Link>
        <Link href={`/verify/passport/${id}`} target="_blank" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '11px' }}>
          <ExternalLink size={11} /> Verify
        </Link>
      </div>
    </div>
  );
}

export default function PortalPassports() {
  const { data, isLoading, mutate } = useSWR(`/api/v1/organizations/${ORG_ID}/security-passports`, fetcher, { refreshInterval: 30000 });
  const passports = Array.isArray(data) ? data : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', marginBottom: '4px' }}>My Security Passports</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Cryptographic attestations for your AI systems</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => mutate()} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}><RefreshCw size={12} /> Refresh</button>
          <Link href="/dashboard/passport" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}><Plus size={13} /> Issue New</Link>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '18px' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card" style={{ padding: '22px', height: '200px' }} />
          ))}
        </div>
      ) : passports.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 40px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary-dim)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <ShieldCheck size={28} color="var(--primary)" />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>No Passports Issued Yet</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '320px', margin: '0 auto 20px', lineHeight: 1.6 }}>Issue your first Security Passport to prove your AI system&apos;s trustworthiness to customers and partners.</p>
          <Link href="/dashboard/passport" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}><Plus size={14} /> Issue First Passport</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '18px' }}>
          {passports.map((p: Record<string, unknown>, i: number) => <PassportCard key={i} passport={p} />)}
        </div>
      )}
    </div>
  );
}
