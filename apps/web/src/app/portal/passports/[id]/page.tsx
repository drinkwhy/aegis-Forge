'use client';
import { use, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import {
  ShieldCheck, AlertTriangle, PauseCircle, Ban, RotateCcw,
  ChevronLeft, ExternalLink, Copy, FileCheck, Database, Lock,
  Terminal, Loader2, RefreshCw, CheckCircle,
} from 'lucide-react';

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID || 'd3b07384-d113-4a11-b541-ef81f212239e';
const PUBLIC_BASE = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_APP_URL || window.location.origin)
  : 'https://aegiscruc.io';
const fetcher = (url: string) => fetch(url).then(r => { if (!r.ok) throw new Error('Not found'); return r.json(); });

type PassportStatus = 'VALID' | 'DEGRADED' | 'SUSPENDED' | 'REVOKED';

const STATUS_CFG: Record<PassportStatus, { color: string; icon: React.ElementType; label: string; desc: string }> = {
  VALID:     { color: '#10b981', icon: ShieldCheck,   label: 'ACCREDITED & ACTIVE',   desc: 'All validation criteria satisfied.' },
  DEGRADED:  { color: '#f97316', icon: AlertTriangle, label: 'SECURITY WARNING',       desc: 'Non-blocking drift detected.' },
  SUSPENDED: { color: '#eab308', icon: PauseCircle,   label: 'PASSPORT SUSPENDED',     desc: 'Manually suspended. Re-evaluate to reinstate.' },
  REVOKED:   { color: '#ef4444', icon: Ban,           label: 'ATTESTATION REVOKED',    desc: 'Unresolved critical finding.' },
};

const CLAIMS = [
  'Prompt Injection Resistance Validated',
  'Unauthorized Tool Execution Interception Active',
  'Sensitive Data Outbound Masking Enforced',
  'MCP Boundary gVisor Sandbox Confirmed',
  'Privilege Lease Boundaries Enforced',
];

interface PageProps { params: Promise<{ id: string }> }

export default function PortalPassportDetail({ params }: PageProps) {
  const { id } = use(params);
  const [copied, setCopied] = useState<'url' | 'embed' | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: passport, error, mutate, isLoading } = useSWR(
    `/api/v1/verify/passports/${id}`,
    fetcher
  );

  const copyText = (text: string, type: 'url' | 'embed') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleAction = async (action: string) => {
    setActionLoading(action);
    setActionError(null);
    try {
      const res = await fetch(`/api/v1/organizations/${ORG_ID}/security-passports/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: `${action} requested via Customer Portal` }),
      });
      if (!res.ok) throw new Error(await res.text());
      await mutate();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '12px', color: 'var(--text-secondary)' }}>
      <Loader2 size={24} className="animate-spin" color="var(--primary)" />
      <span style={{ fontSize: '14px' }}>Loading passport…</span>
    </div>
  );

  if (error || !passport) return (
    <div className="glass-card" style={{ padding: '40px', textAlign: 'center', maxWidth: '420px', margin: '60px auto' }}>
      <AlertTriangle size={32} color="#f97316" style={{ marginBottom: '16px' }} />
      <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Passport Not Found</h3>
      <Link href="/portal/passports" className="btn btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
        <ChevronLeft size={13} /> Back to My Passports
      </Link>
    </div>
  );

  const status = (passport.status as PassportStatus) || 'VALID';
  const cfg = STATUS_CFG[status];
  const StatusIcon = cfg.icon;
  const score = Math.round((Number(passport.overallScore) || 0) * 100);
  const verifyUrl = `${PUBLIC_BASE}/verify/passport/${id}`;
  const embedCode = `<a href="${verifyUrl}" target="_blank">\n  <img src="${PUBLIC_BASE}/api/shield.svg" alt="Aegis Verified"/>\n</a>`;

  const customerActions = [
    { id: 'suspend',   label: 'Suspend',   icon: PauseCircle, color: '#eab308', disabled: status === 'SUSPENDED', desc: 'Temporarily suspend this passport.' },
    { id: 'supersede', label: 'Supersede', icon: RotateCcw,   color: 'var(--primary)', disabled: false, desc: 'Issue a new version of this passport.' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Link href="/portal/passports" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '13px' }}>
        <ChevronLeft size={14} /> My Passports
      </Link>

      {/* Status header */}
      <div className="glass-card" style={{ padding: '28px', display: 'flex', gap: '20px', alignItems: 'center', borderLeft: `3px solid ${cfg.color}` }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: `${cfg.color}15`, border: `2px solid ${cfg.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <StatusIcon size={28} color={cfg.color} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: cfg.color, textTransform: 'uppercase', marginBottom: '4px' }}>{cfg.label}</div>
          <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '4px' }}>{String(passport.systemDisplayName || 'Unknown System')}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{cfg.desc}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
          <div style={{ fontSize: '36px', fontWeight: 800, fontFamily: 'var(--font-display)', color: score >= 85 ? '#10b981' : score >= 60 ? '#f97316' : '#ef4444' }}>
            {score}<span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>/100</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assurance Score</div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            <button onClick={() => mutate()} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', padding: '5px 10px' }}>
              <RefreshCw size={11} /> Refresh
            </button>
            <Link href={verifyUrl} target="_blank" className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', padding: '5px 10px' }}>
              <ExternalLink size={11} /> Public Seal
            </Link>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Verified Claims */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <FileCheck size={14} color="var(--text-secondary)" /> Verified Claims
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {CLAIMS.map((claim, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                  <CheckCircle size={14} color={status === 'VALID' ? '#10b981' : '#6b7280'} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>{claim}</span>
                  <span className={`badge badge-${status === 'VALID' ? 'low' : 'info'}`} style={{ fontSize: '10px', marginLeft: 'auto' }}>{status === 'VALID' ? 'PASSED' : 'ARCHIVED'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Passport Metadata */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Database size={14} color="var(--text-secondary)" /> Passport Metadata
            </h3>
            {[
              { label: 'Passport ID', value: id },
              { label: 'Assurance Level', value: String(passport.assuranceLevel || '—').replace(/_/g, ' ') },
              { label: 'Issued At', value: passport.issuedAt ? new Date(passport.issuedAt as string).toLocaleString() : '—' },
              { label: 'Valid Until', value: passport.validUntil ? new Date(passport.validUntil as string).toLocaleString() : 'Indefinite' },
              { label: 'Subject Hash', value: String(passport.subjectFingerprint || '—') },
              { label: 'Framework Hash', value: String(passport.frameworkFingerprint || '—') },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', gap: '16px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>{label}</span>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Share & Embed */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Terminal size={14} color="var(--text-secondary)" /> Share & Embed
            </h3>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Verify URL</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{ flex: 1, padding: '8px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {verifyUrl}
                </div>
                <button onClick={() => copyText(verifyUrl, 'url')}
                  style={{ padding: '8px 10px', background: copied === 'url' ? 'rgba(16,185,129,0.1)' : 'var(--bg-elevated)', border: `1px solid ${copied === 'url' ? '#10b981' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: copied === 'url' ? '#10b981' : 'var(--text-muted)', transition: 'all 0.15s' }}>
                  <Copy size={12} /> {copied === 'url' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Badge Embed Code</div>
              <div style={{ padding: '10px', background: '#040712', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-secondary)', whiteSpace: 'pre', lineHeight: 1.7, marginBottom: '6px' }}>
                {embedCode}
              </div>
              <button onClick={() => copyText(embedCode, 'embed')}
                style={{ width: '100%', padding: '7px', background: copied === 'embed' ? 'rgba(16,185,129,0.08)' : 'transparent', border: `1px solid ${copied === 'embed' ? '#10b981' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: copied === 'embed' ? '#10b981' : 'var(--text-muted)', transition: 'all 0.15s' }}>
                <Copy size={11} /> {copied === 'embed' ? 'Copied!' : 'Copy Embed Code'}
              </button>
            </div>
          </div>

          {/* Lifecycle Actions */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Lock size={14} color="var(--text-secondary)" /> Lifecycle Management
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '14px' }}>Changes are recorded in the audit trail. Contact support to revoke.</p>
            {actionError && (
              <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', fontSize: '11px', color: '#ef4444', marginBottom: '10px' }}>
                {actionError}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {customerActions.map(action => (
                <button key={action.id} onClick={() => handleAction(action.id)}
                  disabled={action.disabled || !!actionLoading}
                  className="btn btn-ghost"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', justifyContent: 'flex-start', opacity: action.disabled ? 0.5 : 1 }}
                  title={action.desc}>
                  {actionLoading === action.id
                    ? <Loader2 size={13} className="animate-spin" />
                    : <action.icon size={13} color={action.color} />
                  }
                  {action.label}
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: 'auto' }}>{action.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
