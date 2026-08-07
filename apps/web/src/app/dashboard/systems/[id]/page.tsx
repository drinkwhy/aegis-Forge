'use client';
import { use, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import {
  ChevronLeft, ShieldCheck, AlertTriangle, Server, Database,
  Globe, Lock, Activity, ExternalLink, RefreshCw,
  TrendingUp, TrendingDown, Minus, CheckCircle, XCircle,
  AlertOctagon, Cpu, Loader2, Clock, Shield,
} from 'lucide-react';

import { useActiveOrganization } from '@/context/OrganizationContext';

const fetcher = (url: string) => fetch(url).then(r => { if (!r.ok) throw new Error('Not found'); return r.json(); });

interface PageProps { params: Promise<{ id: string }> }

const EVENT_CONFIG: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  tool_call:               { color: '#3b82f6', icon: Server,       label: 'Tool Call' },
  api_call:                { color: '#06b6d4', icon: Globe,        label: 'API Call' },
  db_query:                { color: '#8b5cf6', icon: Database,     label: 'DB Query' },
  policy_violation:        { color: '#ef4444', icon: AlertOctagon, label: 'Policy Violation' },
  drift_detected:          { color: '#f97316', icon: AlertTriangle,label: 'Drift Detected' },
  sensitive_data_access:   { color: '#eab308', icon: Lock,         label: 'Sensitive Data Access' },
  human_approval:          { color: '#10b981', icon: CheckCircle,  label: 'Human Approval' },
  prompt_injection_attempt:{ color: '#dc2626', icon: Shield,       label: 'Prompt Injection' },
};

const OUTCOME_CFG: Record<string, { color: string; label: string }> = {
  allowed:   { color: '#10b981', label: 'ALLOWED' },
  blocked:   { color: '#ef4444', label: 'BLOCKED' },
  flagged:   { color: '#f97316', label: 'FLAGGED' },
  escalated: { color: '#eab308', label: 'ESCALATED' },
};

const SEV_CFG: Record<string, string> = {
  info: '#6b7280', low: '#10b981', medium: '#f97316', high: '#ef4444', critical: '#dc2626',
};

export default function SystemProfile({ params }: PageProps) {
  const { id } = use(params);
  const { organizationId } = useActiveOrganization();
  const orgID = organizationId || '';
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'passport'>('overview');

  const { data: system, isLoading, error, mutate } = useSWR(
    orgID ? `/api/v1/organizations/${orgID}/systems/${id}` : null,
    fetcher
  );

  const { data: events } = useSWR(
    system && orgID ? `/api/v1/organizations/${orgID}/systems/${id}/events` : null,
    fetcher,
    { refreshInterval: 10000 }
  );

  const { data: passport } = useSWR(
    system?.passportId ? `/api/v1/verify/passports/${system.passportId}` : null,
    fetcher
  );

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '12px' }}>
      <Loader2 size={24} className="animate-spin" color="var(--primary)" />
      <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading system profile…</span>
    </div>
  );

  if (error || !system) return (
    <div className="glass-card" style={{ padding: '40px', textAlign: 'center', maxWidth: '420px', margin: '60px auto' }}>
      <AlertTriangle size={32} color="#f97316" style={{ marginBottom: '16px' }} />
      <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>System Not Found</h3>
      <Link href="/dashboard/systems" className="btn btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
        <ChevronLeft size={13} /> Back to Registry
      </Link>
    </div>
  );

  const score = Math.round(system.trustScore || 0);
  const scoreColor = score >= 85 ? '#10b981' : score >= 60 ? '#f97316' : '#ef4444';
  const TrendIcon = system.trustTrend === 'improving' ? TrendingUp : system.trustTrend === 'degrading' ? TrendingDown : Minus;
  const trendColor = system.trustTrend === 'improving' ? '#10b981' : system.trustTrend === 'degrading' ? '#ef4444' : 'var(--text-muted)';
  const eventList = Array.isArray(events) ? events : [];

  const tabStyle = (active: boolean) => ({
    padding: '8px 16px', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: 600,
    cursor: 'pointer', border: 'none', transition: 'all 0.15s',
    background: active ? 'var(--primary)' : 'transparent',
    color: active ? 'white' : 'var(--text-secondary)',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Back */}
      <Link href="/dashboard/systems" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '13px' }}>
        <ChevronLeft size={14} /> AI Trust Registry
      </Link>

      {/* Hero card */}
      <div className="glass-card" style={{ padding: '28px', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--primary-dim)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Cpu size={28} color="var(--primary)" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', background: 'rgba(59,130,246,0.1)', color: 'var(--primary)', border: '1px solid rgba(59,130,246,0.2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {system.environment}
            </span>
            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', background: 'rgba(16,185,129,0.08)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {system.status}
            </span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '4px' }}>{system.displayName}</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{system.purpose}</p>
          <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
            {system.owner && <span>Owner: <strong style={{ color: 'var(--text-secondary)' }}>{system.owner}</strong></span>}
            {system.modelProvider && <span>Model: <strong style={{ color: 'var(--text-secondary)' }}>{system.modelProvider} / {system.modelName}</strong></span>}
            {system.version && <span>v{system.version}</span>}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '48px', fontWeight: 800, fontFamily: 'var(--font-display)', color: scoreColor, letterSpacing: '-0.03em', lineHeight: 1 }}>
            {score}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Trust Score</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', fontSize: '12px', color: trendColor }}>
            <TrendIcon size={13} /> {system.trustTrend}
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
            <button onClick={() => mutate()} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '5px 8px' }}>
              <RefreshCw size={11} /> Refresh
            </button>
            {system.passportId && (
              <Link href={`/verify/passport/${system.passportId}`} target="_blank" className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '5px 8px' }}>
                <ExternalLink size={11} /> Seal
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', padding: '4px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', width: 'fit-content' }}>
        {(['overview', 'events', 'passport'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={tabStyle(activeTab === tab)}>
            {tab === 'overview' ? 'System Overview' : tab === 'events' ? `Runtime Events (${eventList.length})` : 'Security Passport'}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

          {/* Connected Tools */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Server size={14} color="var(--primary)" /> Connected Tools ({(system.connectedTools || []).length})
            </h3>
            {(system.connectedTools?.length ?? 0) === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No tools registered.</p>
            ) : (system.connectedTools || []).map((tool: Record<string, string>, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', marginBottom: '6px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '12px', fontWeight: 600 }}>{tool.name}</span>
                <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '99px', background: 'rgba(16,185,129,0.08)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>{tool.status || 'active'}</span>
              </div>
            ))}
          </div>

          {/* Databases */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Database size={14} color="#8b5cf6" /> Connected Databases ({(system.connectedDatabases || []).length})
            </h3>
            {(system.connectedDatabases?.length ?? 0) === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No databases connected.</p>
            ) : (system.connectedDatabases || []).map((db: Record<string, string>, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', marginBottom: '6px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '12px', fontWeight: 600 }}>{db.name}</span>
                {db.classification && (
                  <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '99px', background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>{db.classification}</span>
                )}
              </div>
            ))}
          </div>

          {/* MCP Servers */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Globe size={14} color="#06b6d4" /> MCP Servers ({(system.connectedMcpServers || []).length})
            </h3>
            {(system.connectedMcpServers?.length ?? 0) === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No MCP servers connected.</p>
            ) : (system.connectedMcpServers || []).map((mcp: Record<string, string>, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', marginBottom: '6px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '12px', fontWeight: 600 }}>{mcp.name}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{mcp.protocol}</span>
              </div>
            ))}
          </div>

          {/* Data Classifications */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Lock size={14} color="#eab308" /> Data Classifications
            </h3>
            {(system.dataClassifications?.length ?? 0) === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No data classifications set.</p>
            ) : (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {system.dataClassifications.map((cls: string, i: number) => (
                  <span key={i} style={{ padding: '4px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 600, background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)', color: '#eab308' }}>{cls}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Events tab */}
      {activeTab === 'events' && (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Runtime Event Feed</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Auto-refreshes every 10s</span>
          </div>
          {eventList.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              <Activity size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
              <div>No runtime events recorded yet.</div>
            </div>
          ) : (
            <div style={{ maxHeight: '520px', overflowY: 'auto' }}>
              {eventList.map((ev: Record<string, unknown>, i: number) => {
                const cfg = EVENT_CONFIG[ev.eventType as string] || { color: '#6b7280', icon: Activity, label: String(ev.eventType) };
                const EventIcon = cfg.icon;
                const outcomeCfg = OUTCOME_CFG[ev.outcome as string] || { color: '#6b7280', label: String(ev.outcome).toUpperCase() };
                const sevColor = SEV_CFG[ev.severity as string] || '#6b7280';
                return (
                  <div key={i} style={{ display: 'flex', gap: '14px', padding: '14px 20px', borderBottom: '1px solid var(--border)', alignItems: 'flex-start', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${cfg.color}15`, border: `1px solid ${cfg.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <EventIcon size={14} color={cfg.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '3px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{cfg.label}</span>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: outcomeCfg.color }}>{outcomeCfg.label}</span>
                        <span style={{ fontSize: '10px', width: '8px', height: '8px', borderRadius: '50%', background: sevColor, display: 'inline-block' }} title={`Severity: ${ev.severity}`} />
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                        <strong>{String(ev.action)}</strong>{ev.resource ? ` → ${ev.resource}` : ''}
                      </div>
                      {Boolean(ev.actor) && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Actor: {String(ev.actor ?? '')}</div>}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
                      <Clock size={10} style={{ display: 'inline', marginRight: '3px' }} />
                      {new Date(ev.occurredAt as string).toLocaleTimeString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Passport tab */}
      {activeTab === 'passport' && (
        <div className="glass-card" style={{ padding: '28px' }}>
          {!system.passportId ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <ShieldCheck size={40} color="var(--text-muted)" style={{ marginBottom: '16px', opacity: 0.4 }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>No Security Passport Issued</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Issue a Security Passport to create a cryptographic trust attestation for this system.</p>
              <Link href="/dashboard/passport" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                <ShieldCheck size={14} /> Issue Passport
              </Link>
            </div>
          ) : passport ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#10b981', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '4px' }}>PASSPORT {passport.status}</div>
                  <div style={{ fontSize: '18px', fontWeight: 700 }}>Assurance Level: {String(passport.assuranceLevel).replace(/_/g, ' ')}</div>
                </div>
                <Link href={`/verify/passport/${system.passportId}`} target="_blank" className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                  <ExternalLink size={12} /> View Public Seal
                </Link>
              </div>
              {[
                { label: 'Passport ID', value: system.passportId },
                { label: 'Overall Score', value: `${Math.round((passport.overallScore || 0) * 100)}/100` },
                { label: 'Issued At', value: passport.issuedAt ? new Date(passport.issuedAt).toLocaleString() : '—' },
                { label: 'Valid Until', value: passport.validUntil ? new Date(passport.validUntil).toLocaleString() : 'Indefinite' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
                  <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
              <Loader2 size={20} className="animate-spin" style={{ marginBottom: '8px' }} />
              Loading passport data…
            </div>
          )}
        </div>
      )}
    </div>
  );
}
