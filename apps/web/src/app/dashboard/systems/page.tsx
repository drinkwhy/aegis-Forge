'use client';
import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import {
  ShieldCheck, ShieldAlert, AlertTriangle, Activity,
  Plus, RefreshCw, Search, Filter, ChevronRight,
  Cpu, Database, Server, Globe, Lock, TrendingUp,
  TrendingDown, Minus, Loader2, ExternalLink,
} from 'lucide-react';

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID || 'd3b07384-d113-4a11-b541-ef81f212239e';
const fetcher = (url: string) => fetch(url).then(r => r.json());

interface AISystem {
  id: string;
  displayName: string;
  purpose: string;
  owner: string;
  modelProvider: string;
  modelName: string;
  environment: string;
  status: string;
  tags: string[];
  connectedTools: unknown[];
  connectedMcpServers: unknown[];
  connectedDatabases: unknown[];
  dataClassifications: string[];
  trustScore: number;
  trustTrend: 'improving' | 'stable' | 'degrading';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastEventAt: string | null;
  passportId: string;
  registeredAt: string;
}

const RISK_CFG = {
  low:      { color: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)',  label: 'Low Risk' },
  medium:   { color: '#f97316', bg: 'rgba(249,115,22,0.08)',  border: 'rgba(249,115,22,0.2)',  label: 'Medium Risk' },
  high:     { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)',   label: 'High Risk' },
  critical: { color: '#dc2626', bg: 'rgba(220,38,38,0.12)',   border: 'rgba(220,38,38,0.3)',   label: 'Critical Risk' },
};

function TrustScore({ score, trend }: { score: number; trend: string }) {
  const color = score >= 85 ? '#10b981' : score >= 60 ? '#f97316' : '#ef4444';
  const TrendIcon = trend === 'improving' ? TrendingUp : trend === 'degrading' ? TrendingDown : Minus;
  const trendColor = trend === 'improving' ? '#10b981' : trend === 'degrading' ? '#ef4444' : 'var(--text-muted)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ position: 'relative', width: '44px', height: '44px' }}>
        <svg viewBox="0 0 44 44" style={{ transform: 'rotate(-90deg)', width: '44px', height: '44px' }}>
          <circle cx="22" cy="22" r="18" fill="none" stroke="var(--bg-elevated)" strokeWidth="4" />
          <circle cx="22" cy="22" r="18" fill="none" stroke={color} strokeWidth="4"
            strokeDasharray={`${(score / 100) * 113} 113`} strokeLinecap="round" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color, fontFamily: 'var(--font-display)' }}>
          {Math.round(score)}
        </div>
      </div>
      <TrendIcon size={13} color={trendColor} />
    </div>
  );
}

function SystemCard({ system }: { system: AISystem }) {
  const risk = RISK_CFG[system.riskLevel] || RISK_CFG.low;
  const envColor = system.environment === 'production' ? '#3b82f6' : system.environment === 'staging' ? '#eab308' : '#6b7280';

  return (
    <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', transition: 'border-color 0.2s' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {system.displayName}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: envColor, fontWeight: 600, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em' }}>{system.environment}</span>
            {system.owner && <><span>·</span><span>{system.owner}</span></>}
          </div>
        </div>
        <TrustScore score={system.trustScore} trend={system.trustTrend} />
      </div>

      {/* Risk + Model */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{ padding: '3px 8px', borderRadius: '99px', fontSize: '10px', fontWeight: 700, background: risk.bg, border: `1px solid ${risk.border}`, color: risk.color }}>
          {risk.label}
        </span>
        {system.modelProvider && (
          <span style={{ padding: '3px 8px', borderRadius: '99px', fontSize: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            {system.modelProvider} / {system.modelName}
          </span>
        )}
      </div>

      {/* Connected resources */}
      <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
        <span title="Tools" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Server size={11} /> {system.connectedTools?.length ?? 0}
        </span>
        <span title="MCP Servers" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Globe size={11} /> {system.connectedMcpServers?.length ?? 0}
        </span>
        <span title="Databases" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Database size={11} /> {system.connectedDatabases?.length ?? 0}
        </span>
        {system.dataClassifications?.includes('PII') && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f97316' }}>
            <Lock size={11} /> PII
          </span>
        )}
      </div>

      {/* Last event */}
      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
        {system.lastEventAt
          ? `Last event ${new Date(system.lastEventAt).toLocaleString()}`
          : `Registered ${new Date(system.registeredAt).toLocaleDateString()}`}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
        <Link href={`/dashboard/systems/${system.id}`}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '7px', borderRadius: 'var(--radius-sm)', background: 'var(--primary-dim)', color: 'var(--primary)', textDecoration: 'none', fontSize: '12px', fontWeight: 600 }}>
          <ChevronRight size={12} /> View Profile
        </Link>
        {system.passportId && (
          <Link href={`/verify/passport/${system.passportId}`} target="_blank"
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '11px' }}>
            <ExternalLink size={11} /> Seal
          </Link>
        )}
      </div>
    </div>
  );
}

function RegisterSystemModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ displayName: '', purpose: '', owner: '', modelProvider: '', modelName: '', environment: 'production' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.displayName) { setError('Display name is required'); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/organizations/${ORG_ID}/systems`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, name: form.displayName.toLowerCase().replace(/\s+/g, '-') }),
      });
      if (!res.ok) throw new Error(await res.text());
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to register system');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' };
  const labelStyle = { fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '4px', display: 'block' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '28px', margin: '20px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '20px' }}>Register AI System</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>System Name *</label>
            <input style={inputStyle} placeholder="e.g. Customer Support Agent" value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Purpose</label>
            <input style={inputStyle} placeholder="What does this AI system do?" value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={labelStyle}>Model Provider</label>
              <select style={inputStyle} value={form.modelProvider} onChange={e => setForm(f => ({ ...f, modelProvider: e.target.value }))}>
                <option value="">Select...</option>
                <option value="Anthropic">Anthropic</option>
                <option value="OpenAI">OpenAI</option>
                <option value="Google">Google</option>
                <option value="Meta">Meta</option>
                <option value="Mistral">Mistral</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Model Name</label>
              <input style={inputStyle} placeholder="e.g. claude-3-5-sonnet" value={form.modelName} onChange={e => setForm(f => ({ ...f, modelName: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={labelStyle}>Owner / Team</label>
              <input style={inputStyle} placeholder="e.g. Platform Engineering" value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Environment</label>
              <select style={inputStyle} value={form.environment} onChange={e => setForm(f => ({ ...f, environment: e.target.value }))}>
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="development">Development</option>
              </select>
            </div>
          </div>
          {error && <div style={{ fontSize: '12px', color: '#ef4444', padding: '8px', background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button type="button" onClick={onClose} className="btn btn-ghost" style={{ fontSize: '13px' }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              {loading && <Loader2 size={13} className="animate-spin" />}
              Register System
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SystemsPage() {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading, mutate } = useSWR(
    `/api/v1/organizations/${ORG_ID}/systems`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const systems: AISystem[] = Array.isArray(data) ? data : [];

  const filtered = systems.filter(s => {
    const matchSearch = !search || s.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      s.modelProvider?.toLowerCase().includes(search.toLowerCase()) ||
      s.owner?.toLowerCase().includes(search.toLowerCase());
    const matchRisk = riskFilter === 'ALL' || s.riskLevel === riskFilter.toLowerCase();
    return matchSearch && matchRisk;
  });

  const counts = {
    trusted: systems.filter(s => s.trustScore >= 85).length,
    attention: systems.filter(s => s.trustScore >= 50 && s.trustScore < 85).length,
    critical: systems.filter(s => s.trustScore < 50).length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {showModal && <RegisterSystemModal onClose={() => setShowModal(false)} onCreated={() => mutate()} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            AI Trust Registry
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Every AI system your organization operates — continuously tracked.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => mutate()} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <Plus size={14} /> Register System
          </button>
        </div>
      </div>

      {/* Summary pills */}
      {systems.length > 0 && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { label: `${counts.trusted} Trusted`, color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
            counts.attention > 0 ? { label: `${counts.attention} Need Attention`, color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)' } : null,
            counts.critical > 0 ? { label: `${counts.critical} Critical`, color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' } : null,
          ].filter(Boolean).map((pill, i) => (
            <div key={i} style={{ padding: '6px 14px', borderRadius: '99px', background: pill!.bg, border: `1px solid ${pill!.border}`, fontSize: '12px', fontWeight: 600, color: pill!.color }}>
              {pill!.label}
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="glass-card" style={{ padding: '14px 18px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '340px' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input placeholder="Search systems…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '7px 10px 7px 30px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', gap: '5px' }}>
          <Filter size={12} color="var(--text-muted)" />
          {['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(r => (
            <button key={r} onClick={() => setRiskFilter(r)}
              style={{ padding: '4px 10px', borderRadius: '99px', fontSize: '10px', fontWeight: 600, border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
                borderColor: riskFilter === r ? 'var(--primary)' : 'var(--border)',
                background: riskFilter === r ? 'var(--primary-dim)' : 'transparent',
                color: riskFilter === r ? 'var(--primary)' : 'var(--text-muted)' }}>
              {r === 'ALL' ? 'All Risk' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '18px' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card" style={{ padding: '20px', height: '200px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[80, 50, 100, 60].map((w, j) => (
                <div key={j} style={{ height: '12px', borderRadius: '4px', background: 'var(--bg-elevated)', width: `${w}%` }} />
              ))}
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 40px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary-dim)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Cpu size={28} color="var(--primary)" />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
            {systems.length === 0 ? 'No AI Systems Registered' : 'No Systems Match Your Search'}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '320px', lineHeight: 1.6, marginBottom: '20px' }}>
            {systems.length === 0 ? 'Register your first AI system to begin continuous trust monitoring.' : 'Try adjusting your filters.'}
          </p>
          {systems.length === 0 && (
            <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={14} /> Register First System
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '18px' }}>
          {filtered.map(sys => <SystemCard key={sys.id} system={sys} />)}
        </div>
      )}
    </div>
  );
}
