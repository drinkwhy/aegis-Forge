'use client';
import { useState } from 'react';
import { Play, Plus, X } from 'lucide-react';
import { SeverityBadge } from '@/components/ui/SeverityBadge';

const mockCampaigns = [
  { id: '1', name: 'Q3 Red Team Sync', agent: 'CustomerSupport-Bot', status: 'Running', tests: 45, findings: 2, started: '2h ago' },
  { id: '2', name: 'CustomerSupport Agent Eval', agent: 'CustomerSupport-Bot', status: 'Pending', tests: 0, findings: 0, started: 'Scheduled' },
  { id: '3', name: 'DevOps Assistant Nightly', agent: 'DevOps-Assistant', status: 'Complete', tests: 120, findings: 5, started: '1d ago' },
  { id: '4', name: 'Sales Agent Weekly', agent: 'Sales-Agent', status: 'Complete', tests: 85, findings: 0, started: '3d ago' },
  { id: '5', name: 'Finance Bot Initial Audit', agent: 'Finance-Bot', status: 'Failed', tests: 12, findings: 0, started: '4d ago' },
];

export default function CampaignsPage() {
  const [isPanelOpen, setPanelOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600 }}>Test Campaigns</h2>
        <button className="btn btn-primary" onClick={() => setPanelOpen(true)}>
          <Plus size={16} /> New Campaign
        </button>
      </div>

      <div className="glass" style={{ padding: '0' }}>
        <div style={{ display: 'flex', gap: '16px', padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          {['All', 'Running', 'Complete', 'Failed'].map(t => (
            <button key={t} className={`btn ${t === 'All' ? 'btn-ghost' : 'btn-ghost'}`} style={{ color: t === 'All' ? 'var(--primary)' : 'var(--text-secondary)', borderColor: t === 'All' ? 'var(--primary-dim)' : 'transparent', background: t === 'All' ? 'var(--primary-dim)' : 'transparent' }}>
              {t}
            </button>
          ))}
        </div>
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
            {mockCampaigns.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 500 }}>{c.name}</td>
                <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--text-secondary)' }}>{c.agent}</td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className={`status-dot ${c.status.toLowerCase()}`} />
                    <span style={{ fontSize: '13px' }}>{c.status}</span>
                  </div>
                </td>
                <td style={{ padding: '16px 24px', fontSize: '14px' }}>{c.tests}</td>
                <td style={{ padding: '16px 24px' }}>
                  {c.findings > 0 ? <SeverityBadge severity="high" /> : <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>0</span>}
                </td>
                <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--text-muted)' }}>{c.started}</td>
                <td style={{ padding: '16px 24px' }}>
                  <button className="btn btn-ghost" style={{ padding: '6px', minWidth: 0 }}>
                    <Play size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isPanelOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 8, 23, 0.8)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}>
          <div className="glass animate-fade-in" style={{ width: '450px', height: '100%', borderRadius: 0, borderRight: 'none', borderTop: 'none', borderBottom: 'none', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>New Campaign</h3>
              <button onClick={() => setPanelOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, overflow: 'auto' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>Campaign Name</label>
                <input type="text" className="input" placeholder="e.g. Q4 Security Audit" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>Target Agent</label>
                <select className="input" style={{ appearance: 'none' }}>
                  <option>CustomerSupport-Bot</option>
                  <option>DevOps-Assistant</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>Rules of Engagement (RoE)</label>
                <select className="input" style={{ appearance: 'none' }}>
                  <option>Default Strict</option>
                  <option>Permissive Read-Only</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '12px' }}>Attack Classes</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {['MCP Tool Poisoning', 'Prompt Injection', 'Excessive Agency', 'Credential Harvesting'].map(ac => (
                    <label key={ac} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                      <input type="checkbox" defaultChecked style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }} />
                      {ac}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ padding: '24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-ghost" onClick={() => setPanelOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => setPanelOpen(false)}>Run Campaign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
