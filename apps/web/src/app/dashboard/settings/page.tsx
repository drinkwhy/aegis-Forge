'use client';
import { useState } from 'react';
import { Copy, RefreshCw, Github, Cloud, Key, UserPlus, Trash2, CheckCircle, Loader2, Users, Crown, Shield } from 'lucide-react';
import Link from 'next/link';

const CURRENT_PLAN = 'starter'; // Replace with real plan from auth context
const SEAT_LIMIT = 1; // Starter: 1 seat, Pro: 5 seats

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  avatarInitials: string;
}

const MOCK_TEAM: TeamMember[] = [
  { id: '1', name: 'You', email: 'you@acmecorp.io', role: 'owner', joinedAt: '2025-10-01', avatarInitials: 'AC' },
];

const ROLE_ICONS = { owner: Crown, admin: Shield, member: Users };
const ROLE_COLORS = { owner: 'var(--accent)', admin: 'var(--primary)', member: 'var(--text-secondary)' };

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [team, setTeam] = useState<TeamMember[]>(MOCK_TEAM);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    await new Promise((r) => setTimeout(r, 900));
    setIsInviting(false);
    setInviteSent(true);
    setInviteEmail('');
    setTimeout(() => setInviteSent(false), 3000);
  };

  const handleRemoveMember = (id: string) => {
    setTeam((prev) => prev.filter((m) => m.id !== id));
  };

  const seatsUsed = team.length;
  const atSeatLimit = CURRENT_PLAN === 'starter' && seatsUsed >= SEAT_LIMIT;

  const tabStyle = (tab: string) => ({
    background: 'transparent',
    border: 'none',
    padding: '16px 24px',
    fontSize: '14px',
    fontWeight: 500,
    color: activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)',
    borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
    cursor: 'pointer',
    transition: 'color 0.15s',
  } as React.CSSProperties);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '4px' }}>Settings</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Manage your workspace, API access, integrations, and team.</p>
      </div>

      <div className="glass" style={{ padding: '0' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 16px' }}>
          {['general', 'api keys', 'integrations', 'team'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={tabStyle(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div style={{ padding: '32px' }}>

          {/* ── General ── */}
          {activeTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Workspace Name</label>
                <input type="text" className="input" defaultValue="Acme Corp Workspace" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Global Webhook URL (Findings)</label>
                <input type="text" className="input" defaultValue="https://hooks.slack.com/services/YOUR_WORKSPACE_ID/YOUR_WEBHOOK_TOKEN" />
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>Critical findings will be posted to this endpoint automatically.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : saveSuccess ? <CheckCircle size={14} /> : null}
                  {isSaving ? 'Saving…' : saveSuccess ? 'Saved!' : 'Save Changes'}
                </button>
                {saveSuccess && <span style={{ fontSize: '13px', color: 'var(--success)' }}>Changes saved successfully.</span>}
              </div>
            </div>
          )}

          {/* ── API Keys ── */}
          {activeTab === 'api keys' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>SDK &amp; API Access</h3>
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
                        <button className="btn btn-ghost" style={{ padding: '6px' }} onClick={() => navigator.clipboard.writeText('af_prod_****************abcd')}><Copy size={14} /></button>
                        <button className="btn btn-ghost" style={{ padding: '6px', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}><RefreshCw size={14} /></button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* ── Integrations ── */}
          {activeTab === 'integrations' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {[
                { name: 'GitHub', description: 'Sync repositories and automatically open PRs for remediations.', icon: <Github size={24} />, status: 'Connected' },
                { name: 'AWS', description: 'Deploy canary tokens automatically into your cloud infrastructure.', icon: <Cloud size={24} color="#FF9900" />, status: 'Connected' },
                { name: 'Clerk', description: 'SSO and identity management for team access.', icon: <Key size={24} color="#EB5424" />, status: 'Not Connected' },
              ].map((integration) => (
                <div key={integration.name} style={{ border: '1px solid var(--border)', padding: '24px', borderRadius: 'var(--radius)', background: 'var(--bg-elevated)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ width: '40px', height: '40px', background: 'var(--bg-surface)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {integration.icon}
                    </div>
                    <span className={`badge ${integration.status === 'Connected' ? 'badge-low' : 'badge-info'}`} style={integration.status !== 'Connected' ? { background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)' } : {}}>
                      {integration.status}
                    </span>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>{integration.name}</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{integration.description}</p>
                  </div>
                  <button className="btn btn-ghost" style={{ marginTop: 'auto' }}>Configure</button>
                </div>
              ))}
            </div>
          )}

          {/* ── Team ── */}
          {activeTab === 'team' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '720px' }}>

              {/* Seat Usage */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderRadius: 'var(--radius)', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Users size={18} color="var(--primary)" />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>Team Seats</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {CURRENT_PLAN === 'starter' ? 'Starter Plan · 1 seat included' : 'Pro Plan · 5 seats included'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: atSeatLimit ? 'var(--danger)' : 'var(--text-primary)' }}>
                    {seatsUsed}/{SEAT_LIMIT}
                  </span>
                  {CURRENT_PLAN === 'starter' && (
                    <Link href="/dashboard/billing" className="btn btn-ghost" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', borderColor: 'rgba(234,179,8,0.3)' }}>
                      Upgrade for more seats →
                    </Link>
                  )}
                </div>
              </div>

              {/* Invite Form */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserPlus size={16} color="var(--primary)" />
                  Invite Team Member
                </h3>
                {atSeatLimit ? (
                  <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '13px', color: 'var(--danger)' }}>
                    Seat limit reached on Starter plan. <Link href="/dashboard/billing" style={{ color: 'var(--accent)', fontWeight: 700 }}>Upgrade to Pro</Link> to add up to 5 team members.
                  </div>
                ) : (
                  <form onSubmit={handleInvite} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <input
                      type="email"
                      className="input"
                      placeholder="colleague@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                      style={{ flex: 1, minWidth: '200px' }}
                    />
                    <select
                      className="input"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                      style={{ width: '120px', appearance: 'none' }}
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button type="submit" className="btn btn-primary" disabled={isInviting} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isInviting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                      {isInviting ? 'Sending…' : 'Send Invite'}
                    </button>
                  </form>
                )}
                {inviteSent && (
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--success)' }}>
                    <CheckCircle size={14} /> Invitation sent successfully!
                  </div>
                )}
              </div>

              {/* Member List */}
              <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>Members ({team.length})</h3>
                </div>
                {team.map((member) => {
                  const RoleIcon = ROLE_ICONS[member.role];
                  return (
                    <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: '13px', fontWeight: 700 }}>{member.avatarInitials}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>{member.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{member.email}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: ROLE_COLORS[member.role] }}>
                        <RoleIcon size={13} />
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Joined {new Date(member.joinedAt).toLocaleDateString()}</div>
                      {member.role !== 'owner' && (
                        <button
                          className="btn btn-ghost"
                          onClick={() => handleRemoveMember(member.id)}
                          style={{ padding: '6px', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.2)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
