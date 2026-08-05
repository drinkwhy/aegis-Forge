'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { Wrench, CheckCircle, ExternalLink, X, Loader2, AlertTriangle } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const WORKSPACE_ID = process.env.NEXT_PUBLIC_WORKSPACE_ID || 'd3b07384-d113-4a11-b541-ef81f212239d';

interface Remediation {
  id: string;
  finding_id: string;
  finding_title: string;
  severity: string;
  fix_type: 'code_patch' | 'system_prompt' | 'policy_update';
  proposed_fix: {
    patch?: string;
    prompt?: string;
  };
  pr_url?: string;
  status: 'proposed' | 'approved' | 'validated';
  proposed_at: string;
}

const FIX_TYPE_LABEL: Record<string, string> = {
  code_patch: 'Code Patch',
  system_prompt: 'System Prompt Update',
  policy_update: 'Policy Rule Update',
};

export default function RemediationsPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/v1/remediations', fetcher);
  const remediations: Remediation[] = data?.remediations || [];

  const [confirmTarget, setConfirmTarget] = useState<Remediation | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedIds, setDeployedIds] = useState<Set<string>>(new Set());

  const handleApprove = async () => {
    if (!confirmTarget) return;
    setIsDeploying(true);
    try {
      await fetch(`/api/v1/workspaces/${WORKSPACE_ID}/remediations/${confirmTarget.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved_by: 'admin', note: 'Approved via Aegis Crucible console' }),
      });
      setDeployedIds((prev) => new Set(prev).add(confirmTarget.id));
      mutate();
    } finally {
      setIsDeploying(false);
      setConfirmTarget(null);
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
          Automated Remediations
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Approve proposed patches, system prompt updates, and policy fixes to harden your AI agents.
        </p>
      </div>

      {isLoading ? (
        <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading remediations...</div>
      ) : error ? (
        <div style={{ color: 'var(--danger)', fontSize: '14px' }}>Error connecting to control plane API</div>
      ) : remediations.length === 0 ? (
        <div className="glass" style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Wrench size={32} color="var(--text-muted)" />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>No Proposed Remediations</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
            Run attack campaigns against your agents. When vulnerabilities are verified, automated patches will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {remediations.map((rem) => {
            const isDeployed = deployedIds.has(rem.id) || rem.status === 'approved' || rem.status === 'validated';
            return (
              <div key={rem.id} className="glass animate-fade-in" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1 }}>
                  <div style={{ background: isDeployed ? 'rgba(16,185,129,0.1)' : 'var(--primary-dim)', padding: '10px', borderRadius: '8px', color: isDeployed ? 'var(--success)' : 'var(--primary)', flexShrink: 0 }}>
                    {isDeployed ? <CheckCircle size={20} /> : <Wrench size={20} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 600 }}>{rem.finding_title}</h3>
                      <span className={`badge badge-${rem.severity.toLowerCase()}`}>{rem.severity}</span>
                      {isDeployed && <span className="badge badge-low">DEPLOYED</span>}
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '6px' }}>
                      Type: <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{FIX_TYPE_LABEL[rem.fix_type] ?? rem.fix_type}</span>
                    </p>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <span>Proposed: {new Date(rem.proposed_at).toLocaleDateString()}</span>
                      {rem.pr_url && (
                        <a href={rem.pr_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                          PR Branch <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  {isDeployed ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--success)', fontWeight: 600 }}>
                      <CheckCircle size={16} /> Applied
                    </div>
                  ) : (
                    <button
                      className="btn btn-primary"
                      style={{ padding: '8px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                      onClick={() => setConfirmTarget(rem)}
                    >
                      <CheckCircle size={14} /> Approve &amp; Deploy
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,8,23,0.85)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-card animate-fade-in" style={{ maxWidth: '480px', width: '100%', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertTriangle size={22} color="var(--accent)" />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>Confirm Deployment</h3>
              </div>
              <button onClick={() => setConfirmTarget(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                You are about to deploy the following remediation to your production AI system. This action will be recorded in the audit trail and cannot be undone.
              </p>
              <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{confirmTarget.finding_title}</div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className={`badge badge-${confirmTarget.severity.toLowerCase()}`}>{confirmTarget.severity}</span>
                  <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{FIX_TYPE_LABEL[confirmTarget.fix_type]}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setConfirmTarget(null)} disabled={isDeploying}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleApprove}
                disabled={isDeploying}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {isDeploying ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                {isDeploying ? 'Deploying…' : 'Confirm & Deploy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
