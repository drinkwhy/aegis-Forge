'use client';
import useSWR from 'swr';
import Link from 'next/link';
import {
  ShieldCheck, ShieldAlert, AlertTriangle, TrendingUp,
  TrendingDown, Activity, CheckCircle, XCircle,
  Clock, RefreshCw, ChevronRight, Award, BarChart3,
  Users, Cpu,
} from 'lucide-react';

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID || 'd3b07384-d113-4a11-b541-ef81f212239e';
const fetcher = (url: string) => fetch(url).then(r => r.json());

interface TrustSummary {
  totalSystems: number;
  trustedSystems: number;
  needsAttention: number;
  criticalSystems: number;
  avgTrustScore: number;
  openCriticalFindings: number;
  openHighFindings: number;
  validPassports: number;
  totalPassports: number;
  violations24h: number;
  updatedAt: string;
}

interface AISystem {
  id: string;
  displayName: string;
  trustScore: number;
  trustTrend: string;
  riskLevel: string;
  modelProvider: string;
  lastEventAt: string | null;
}

function MetricCard({ label, value, sub, color, icon: Icon, href }: {
  label: string; value: string | number; sub?: string;
  color?: string; icon?: React.ElementType; href?: string;
}) {
  const content = (
    <div className="glass-card" style={{ padding: '22px 24px', display: 'flex', gap: '16px', alignItems: 'flex-start', transition: 'border-color 0.2s', cursor: href ? 'pointer' : 'default' }}>
      {Icon && (
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${color || 'var(--primary)'}18`, border: `1px solid ${color || 'var(--primary)'}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={18} color={color || 'var(--primary)'} />
        </div>
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>{label}</div>
        <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-display)', color: color || 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{sub}</div>}
      </div>
    </div>
  );
  return href ? <Link href={href} style={{ textDecoration: 'none' }}>{content}</Link> : content;
}

function TrustRing({ score, label }: { score: number; label: string }) {
  const color = score >= 85 ? '#10b981' : score >= 60 ? '#f97316' : '#ef4444';
  const circumference = 2 * Math.PI * 52;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <div style={{ position: 'relative', width: '120px', height: '120px' }}>
        <svg viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)', width: '120px', height: '120px' }}>
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--bg-elevated)" strokeWidth="8" />
          <circle cx="60" cy="60" r="52" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${(score / 100) * circumference} ${circumference}`}
            strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'var(--font-display)', color, lineHeight: 1 }}>{Math.round(score)}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>/ 100</div>
        </div>
      </div>
      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>{label}</div>
    </div>
  );
}

export default function TrustDashboard() {
  const { data: summary, isLoading: summaryLoading, mutate } = useSWR<TrustSummary>(
    `/api/v1/organizations/${ORG_ID}/trust-summary`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const { data: systemsData } = useSWR(
    `/api/v1/organizations/${ORG_ID}/systems`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const { data: findingsData } = useSWR('/api/v1/findings', fetcher);
  const { data: passportsData } = useSWR(
    `/api/v1/organizations/${ORG_ID}/security-passports`,
    fetcher
  );

  const systems: AISystem[] = Array.isArray(systemsData) ? systemsData : [];
  const findings = findingsData?.findings || [];
  const passports = Array.isArray(passportsData) ? passportsData : [];

  const atRisk = systems.filter(s => s.trustScore < 85).sort((a, b) => a.trustScore - b.trustScore).slice(0, 5);
  const recentFindings = findings.slice(0, 5);

  const avgScore = summary?.avgTrustScore ?? (systems.length
    ? systems.reduce((a: number, s: AISystem) => a + s.trustScore, 0) / systems.length
    : 0);

  const trustPct = summary?.totalSystems
    ? Math.round(((summary.trustedSystems || 0) / summary.totalSystems) * 100)
    : 0;

  const canProveIt = (passports.filter((p: Record<string, string>) => p.status === 'VALID').length > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Executive Trust Dashboard
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Can we trust our AI systems, and can we prove it?
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {summary?.updatedAt && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={11} /> {new Date(summary.updatedAt).toLocaleTimeString()}
            </span>
          )}
          <button onClick={() => mutate()} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Top metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <MetricCard
          label="AI Systems Total"
          value={summaryLoading ? '—' : summary?.totalSystems ?? systems.length}
          sub="registered & monitored"
          color="var(--primary)"
          icon={Cpu}
          href="/dashboard/systems"
        />
        <MetricCard
          label="Trusted Systems"
          value={summaryLoading ? '—' : `${summary?.trustedSystems ?? systems.filter(s => s.trustScore >= 85).length}`}
          sub={`${trustPct}% of your AI fleet`}
          color="#10b981"
          icon={ShieldCheck}
        />
        <MetricCard
          label="Critical Findings"
          value={summaryLoading ? '—' : summary?.openCriticalFindings ?? findings.filter((f: Record<string, string>) => f.severity === 'critical').length}
          sub="require immediate attention"
          color="#ef4444"
          icon={ShieldAlert}
          href="/dashboard/findings"
        />
        <MetricCard
          label="Valid Passports"
          value={summaryLoading ? '—' : summary?.validPassports ?? passports.filter((p: Record<string, string>) => p.status === 'VALID').length}
          sub={`of ${summary?.totalPassports ?? passports.length} total issued`}
          color="#10b981"
          icon={Award}
          href="/dashboard/passport"
        />
      </div>

      {/* Can we prove it? + Trust ring + Violations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px 1fr', gap: '20px' }}>

        {/* 8 Executive Questions */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={15} color="var(--primary)" /> Key Business Questions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { q: 'Which AI systems do we have?',            a: `${summary?.totalSystems ?? systems.length} systems registered`, ok: true },
              { q: 'Which are currently trusted?',            a: `${summary?.trustedSystems ?? 0} of ${summary?.totalSystems ?? systems.length}`, ok: (summary?.trustedSystems ?? 0) > 0 },
              { q: 'What changed today?',                     a: `${summary?.violations24h ?? 0} policy events in last 24h`, ok: (summary?.violations24h ?? 0) === 0 },
              { q: 'Which AI systems became more risky?',     a: atRisk.length > 0 ? `${atRisk.length} systems below 85 score` : 'None — all above threshold', ok: atRisk.length === 0 },
              { q: 'Are there open critical findings?',       a: `${summary?.openCriticalFindings ?? 0} critical, ${summary?.openHighFindings ?? 0} high`, ok: (summary?.openCriticalFindings ?? 0) === 0 },
              { q: 'Can we prove trust to customers?',        a: canProveIt ? 'Yes — valid passport(s) issued' : 'No — no valid passports', ok: canProveIt },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                {item.ok
                  ? <CheckCircle size={14} color="#10b981" style={{ flexShrink: 0, marginTop: '1px' }} />
                  : <XCircle size={14} color="#ef4444" style={{ flexShrink: 0, marginTop: '1px' }} />
                }
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '2px' }}>{item.q}</div>
                  <div style={{ fontSize: '11px', color: item.ok ? '#10b981' : '#ef4444' }}>{item.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust ring */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
          <TrustRing score={Math.round(avgScore)} label="Org Trust Score" />
          <div style={{ width: '100%' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', textAlign: 'center' }}>Fleet Status</div>
            {[
              { label: 'Trusted', count: summary?.trustedSystems ?? 0, color: '#10b981' },
              { label: 'Attention', count: summary?.needsAttention ?? 0, color: '#f97316' },
              { label: 'Critical', count: summary?.criticalSystems ?? 0, color: '#ef4444' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: '11px' }}>
                <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                <span style={{ fontWeight: 700, color: item.color }}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI systems at risk */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={14} color="#f97316" /> Systems Needing Attention
            </h3>
            <Link href="/dashboard/systems" style={{ fontSize: '11px', color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
              All <ChevronRight size={11} />
            </Link>
          </div>
          {atRisk.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
              <ShieldCheck size={28} color="#10b981" style={{ marginBottom: '8px' }} />
              <div>All systems above trust threshold</div>
            </div>
          ) : atRisk.map((sys, i) => {
            const scoreColor = sys.trustScore >= 85 ? '#10b981' : sys.trustScore >= 60 ? '#f97316' : '#ef4444';
            const TrendIcon = sys.trustTrend === 'improving' ? TrendingUp : sys.trustTrend === 'degrading' ? TrendingDown : Activity;
            return (
              <Link key={i} href={`/dashboard/systems/${sys.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', marginBottom: '6px', border: '1px solid var(--border)', transition: 'border-color 0.15s' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '2px' }}>{sys.displayName}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{sys.modelProvider}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <TrendIcon size={11} color={sys.trustTrend === 'degrading' ? '#ef4444' : 'var(--text-muted)'} />
                    <span style={{ fontSize: '14px', fontWeight: 800, color: scoreColor, fontFamily: 'var(--font-display)' }}>{Math.round(sys.trustScore)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom: Recent Findings + Passports */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Recent findings */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={14} color="#ef4444" /> Recent Findings
            </h3>
            <Link href="/dashboard/findings" style={{ fontSize: '11px', color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
              All <ChevronRight size={11} />
            </Link>
          </div>
          {recentFindings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>No findings recorded.</div>
          ) : recentFindings.map((f: Record<string, string>, i: number) => {
            const sevColors: Record<string, string> = { critical: '#dc2626', high: '#ef4444', medium: '#f97316', low: '#10b981' };
            const sevColor = sevColors[f.severity?.toLowerCase()] || '#6b7280';
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '2px' }}>{f.title}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{f.agentName}</div>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '99px', background: `${sevColor}15`, color: sevColor, border: `1px solid ${sevColor}30`, flexShrink: 0 }}>
                  {f.severity?.toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>

        {/* Passport health */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={14} color="#10b981" /> Security Passport Health
            </h3>
            <Link href="/dashboard/passport" style={{ fontSize: '11px', color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
              Manage <ChevronRight size={11} />
            </Link>
          </div>
          {passports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <Award size={28} color="var(--text-muted)" style={{ marginBottom: '8px', opacity: 0.4 }} />
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>No passports issued yet.</div>
              <Link href="/dashboard/passport" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                <Award size={12} /> Issue First Passport
              </Link>
            </div>
          ) : passports.slice(0, 5).map((p: Record<string, unknown>, i: number) => {
            const statusColors: Record<string, string> = { VALID: '#10b981', DEGRADED: '#f97316', SUSPENDED: '#eab308', REVOKED: '#ef4444' };
            const color = statusColors[p.status as string] || '#6b7280';
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '2px' }}>{String(p.systemDisplayName || 'System')}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{String(p.passportId || '').slice(0, 16)}…</div>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '99px', background: `${color}15`, color, border: `1px solid ${color}30` }}>
                  {String(p.status)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
