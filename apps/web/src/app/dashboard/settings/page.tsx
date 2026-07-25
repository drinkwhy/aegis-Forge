'use client';
import { useState } from 'react';
import { Copy, RefreshCw, Github, Cloud, Key } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 600 }}>Settings</h2>

      <div className="glass" style={{ padding: '0' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 16px' }}>
          {['General', 'API Keys', 'Integrations', 'Team'].map(tab => {
            const isActive = activeTab === tab.toLowerCase();
            return (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab.toLowerCase())}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  padding: '16px 24px', 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                  cursor: 'pointer'
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <div style={{ padding: '32px' }}>
          {activeTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Workspace Name</label>
                <input type="text" className="input" defaultValue="Acme Corp Workspace" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Global Webhook URL (Findings)</label>
                <input type="text" className="input" defaultValue="https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX" />
              </div>
              <button className="btn btn-primary" style={{ width: 'fit-content' }}>Save Changes</button>
            </div>
          )}

          {activeTab === 'api keys' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 500 }}>SDK & API Access</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Use these keys to authenticate the Aegis Agent SDK or CI/CD pipelines.</p>
                </div>
                <button className="btn btn-primary">Generate New Key</button>
              </div>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '13px' }}>
                    <th style={{ paddingBottom: '12px', fontWeight: 500 }}>Name</th>
                    <th style={{ paddingBottom: '12px', fontWeight: 500 }}>Key Preview</th>
                    <th style={{ paddingBottom: '12px', fontWeight: 500 }}>Created</th>
                    <th style={{ paddingBottom: '12px', fontWeight: 500 }}>Last Used</th>
                    <th style={{ paddingBottom: '12px', fontWeight: 500 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px 0', fontSize: '14px' }}>CI/CD Pipeline</td>
                    <td style={{ padding: '16px 0', fontSize: '14px', fontFamily: 'var(--font-mono)' }}>af_prod_****************abcd</td>
                    <td style={{ padding: '16px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>Oct 12, 2025</td>
                    <td style={{ padding: '16px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>2 hours ago</td>
                    <td style={{ padding: '16px 0' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-ghost" style={{ padding: '6px' }}><Copy size={14} /></button>
                        <button className="btn btn-ghost" style={{ padding: '6px', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}><RefreshCw size={14} /></button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              <div style={{ border: '1px solid var(--border)', padding: '24px', borderRadius: 'var(--radius)', background: 'var(--bg-elevated)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', background: 'var(--bg-surface)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Github size={24} />
                  </div>
                  <span className="badge badge-low">Connected</span>
                </div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '4px' }}>GitHub</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Sync repositories and automatically open PRs for remediations.</p>
                </div>
                <button className="btn btn-ghost" style={{ marginTop: 'auto' }}>Configure</button>
              </div>

              <div style={{ border: '1px solid var(--border)', padding: '24px', borderRadius: 'var(--radius)', background: 'var(--bg-elevated)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', background: 'var(--bg-surface)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Cloud size={24} color="#FF9900" />
                  </div>
                  <span className="badge badge-low">Connected</span>
                </div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '4px' }}>AWS</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Deploy canary tokens automatically into your cloud infrastructure.</p>
                </div>
                <button className="btn btn-ghost" style={{ marginTop: 'auto' }}>Configure</button>
              </div>

              <div style={{ border: '1px solid var(--border)', padding: '24px', borderRadius: 'var(--radius)', background: 'var(--bg-elevated)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', background: 'var(--bg-surface)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Key size={24} color="#EB5424" />
                  </div>
                  <span className="badge badge-info" style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>Not Connected</span>
                </div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '4px' }}>Auth0</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>SSO and identity management for team access.</p>
                </div>
                <button className="btn btn-primary" style={{ marginTop: 'auto' }}>Connect</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
