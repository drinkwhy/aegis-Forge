'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { Play, Plus, X, Loader2, Zap, Lock, AlertTriangle } from 'lucide-react';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import Link from 'next/link';
import { useActiveOrganization } from '@/context/OrganizationContext';

const CURRENT_PLAN = 'starter'; // Replace with real plan from auth context
const CAMPAIGN_LIMIT = 3;
const CAMPAIGNS_USED = 2; // Replace with real usage from billing API

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Campaign {
  id: string;
  name: string;
  target_agent_id?: string;
  status: string;
  total_tests: number;
  tests_run: number;
  findings_count: number;
  created_at: string;
}

export default function CampaignsPage() {
  const { organizationId } = useActiveOrganization();
  const orgID = organizationId || '';
  const [isPanelOpen, setPanelOpen] = useState(false);
  const [filter, setFilter] = useState('All');
  const [runningId, setRunningId] = useState<string | null>(null);
  
  const { data, error, isLoading, mutate } = useSWR('/api/v1/campaigns', fetcher);
  const campaigns: Campaign[] = data?.campaigns || [];

  const filteredCampaigns = campaigns.filter((c) => {
    if (filter === 'All') return true;
    return c.status.toLowerCase() === filter.toLowerCase();
  });

  const atLimit = CURRENT_PLAN === 'starter' && CAMPAIGNS_USED >= CAMPAIGN_LIMIT;

  const handleRunCampaign = async (campaignId: string) => {
    if (atLimit) return;
    setRunningId(campaignId);
    try {
      await fetch(`/api/v1/organizations/${orgID}/campaigns/${campaignId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      mutate();
    } finally {
      setRunningId(null);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get('name'),
      target_agent_id: formData.get('target'),
      attack_classes: ['mcp-tool-poisoning', 'prompt-injection'],
    };

    const res = await fetch('/api/v1/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setPanelOpen(false);
      mutate();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '4px' }}>Test Campaigns</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Continuous adversarial testing across your AI system surface.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setPanelOpen(true)} disabled={atLimit} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} /> New Campaign
        </button>
      </div>

      {/* Starter Limit Banner */}
      {CURRENT_PLAN === 'starter' && (
        <div style={{ padding: '14px 18px', borderRadius: 'var(--radius)', background: atLimit ? 'rgba(239,68,68,0.06)' : 'rgba(234,179,8,0.06)', border: `1px solid ${atLimit ? 'rgba(239,68,68,0.2)' : 'rgba(234,179,8,0.2)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={16} color={atLimit ? 'var(--danger)' : 'var(--accent)'} />
            <span style={{ fontSize: '13px', color: atLimit ? 'var(--danger)' : 'var(--text-secondary)' }}>
              {atLimit
                ? <><strong style={{ color: 'var(--danger)' }}>Campaign limit reached.</strong> You&apos;ve used all 3 campaigns on the Starter plan this month.</>  
                : <><strong style={{ color: 'var(--accent)' }}>{CAMPAIGNS_USED}/{CAMPAIGN_LIMIT} campaigns</strong> used this month on Starter plan.</>}
            </span>
          </div>
          <Link href="/dashboard/billing" className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', whiteSpace: 'nowrap', color: 'var(--accent)', borderColor: 'rgba(234,179,8,0.3)' }}>
            <Zap size={12} /> Upgrade for unlimited
          </Link>
        </div>
      )}

      <div className="glass" style={{ padding: '0' }}>
        <div style={{ display: 'flex', gap: '16px', padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          {['All', 'Running', 'Complete', 'Failed'].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`btn ${filter === t ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '6px 12px', fontSize: '13px' }}
            >
              {t}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div style={{ padding: '24px', color: 'var(--text-secondary)' }}>Loading campaigns...</div>
        ) : error ? (
          <div style={{ padding: '24px', color: 'var(--danger)' }}>Error connecting to control plane API</div>
        ) : filteredCampaigns.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No campaigns found matching filter.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '13px' }}>
                <th style={{ padding: '16px 24px', fontWeight: 500 }}>Name</th>
                <th style={{ padding: '16px 24px', fontWeight: 500 }}>Target Agent</th>
                <th style={{ padding: '16px 24px', fontWeight: 500 }}>Status</th>
                <th style={{ padding: '16px 24px', fontWeight: 500 }}>Tests Run</th>
                <th style={{ padding: '16px 24px', fontWeight: 500 }}>Findings</th>
                <th style={{ padding: '16px 24px', fontWeight: 500 }}>Started</th>
                <th style={{ padding: '16px 24px', fontWeight: 500 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCampaigns.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 500 }}>{c.name}</td>
                  <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {c.target_agent_id || 'Global Scope'}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className={`status-dot ${c.status.toLowerCase()}`} />
                      <span style={{ fontSize: '13px' }}>{c.status}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '14px' }}>
                    {c.tests_run} / {c.total_tests}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    {c.findings_count > 0 ? (
                      <SeverityBadge severity="high" />
                    ) : (
                      <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>0</span>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--text-muted)' }}>
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '6px', minWidth: 0 }}
                      onClick={() => handleRunCampaign(c.id)}
                      disabled={runningId === c.id || c.status === 'running' || atLimit}
                      title={atLimit ? 'Campaign limit reached — upgrade to continue' : 'Run campaign'}
                    >
                      {runningId === c.id ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isPanelOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 8, 23, 0.8)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}>
          <form onSubmit={handleCreateCampaign} className="glass animate-fade-in" style={{ width: '450px', height: '100%', borderRadius: 0, borderRight: 'none', borderTop: 'none', borderBottom: 'none', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>New Campaign</h3>
              <button type="button" onClick={() => setPanelOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, overflow: 'auto' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>Campaign Name</label>
                <input name="name" type="text" className="input" placeholder="e.g. Q4 Security Audit" required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>Target Agent</label>
                <select name="target" className="input" style={{ appearance: 'none' }}>
                  <option value="CustomerSupport-Bot">CustomerSupport-Bot</option>
                  <option value="DevOps-Assistant">DevOps-Assistant</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '12px' }}>Attack Classes</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {['MCP Tool Poisoning', 'Prompt Injection', 'Excessive Agency'].map((ac) => (
                    <label key={ac} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                      <input type="checkbox" defaultChecked style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }} />
                      {ac}
                    </label>
                  ))}
                  {/* Pro-gated attack class */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', opacity: 0.5 }}>
                    <input type="checkbox" disabled style={{ width: '16px', height: '16px' }} />
                    <Lock size={13} color="var(--text-muted)" />
                    Credential Harvesting
                    <span style={{ fontSize: '10px', background: 'var(--accent)', color: '#000', padding: '1px 6px', borderRadius: '99px', fontWeight: 800 }}>PRO</span>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ padding: '24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setPanelOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Run Campaign</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
