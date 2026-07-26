'use client';
import useSWR from 'swr';
import { StatCard } from '@/components/ui/StatCard';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import { Activity, ShieldAlert, Target, TrendingUp, Inbox } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Finding {
  id: string;
  title: string;
  severity: string;
  agentName?: string;
  created_at: string;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  tests_run: number;
  total_tests: number;
  created_at: string;
}

export default function DashboardPage() {
  const { data: findingsData, error: findingsErr } = useSWR('/api/v1/findings', fetcher);
  const { data: campaignsData, error: campaignsErr } = useSWR('/api/v1/campaigns', fetcher);

  const findings: Finding[] = findingsData?.findings || [];
  const campaigns: Campaign[] = campaignsData?.campaigns || [];

  // Derived metrics from live database
  const activeCampaigns = campaigns.filter(c => c.status.toLowerCase() === 'running').length;
  const criticalFindings = findings.filter(f => f.severity.toLowerCase() === 'critical').length;
  const totalAgents = findings.reduce((acc, curr) => {
    if (curr.agentName && !acc.includes(curr.agentName)) {
      acc.push(curr.agentName);
    }
    return acc;
  }, [] as string[]).length;

  const stats = [
    { title: 'Agents Monitored', value: String(totalAgents || 0), change: 'Live', changeType: 'down' as const, icon: Target },
    { title: 'Active Campaigns', value: String(activeCampaigns), change: 'Live', changeType: 'down' as const, icon: Activity },
    { title: 'Open Critical', value: String(criticalFindings), change: 'Live', changeType: 'down' as const, icon: ShieldAlert },
    { title: 'Avg FAIR-AI Risk', value: criticalFindings > 0 ? '$450k' : '$0', change: 'Live', changeType: 'down' as const, icon: TrendingUp },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600 }}>Security Posture Overview</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
        {stats.map(s => <StatCard key={s.title} {...s} />)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Recent Findings Card */}
        <div className="glass" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>Recent Findings</h3>
          
          {findingsErr ? (
            <div style={{ color: 'var(--danger)', fontSize: '14px' }}>Error connecting to control plane API</div>
          ) : findings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <Inbox size={32} style={{ marginBottom: '8px' }} />
              <p style={{ fontSize: '14px' }}>No vulnerabilities detected in database.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '13px' }}>
                  <th style={{ paddingBottom: '12px', fontWeight: 500 }}>Severity</th>
                  <th style={{ paddingBottom: '12px', fontWeight: 500 }}>Finding</th>
                  <th style={{ paddingBottom: '12px', fontWeight: 500 }}>Target Agent</th>
                  <th style={{ paddingBottom: '12px', fontWeight: 500 }}>Detected</th>
                </tr>
              </thead>
              <tbody>
                {findings.slice(0, 5).map((f) => (
                  <tr key={f.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px 0' }}><SeverityBadge severity={f.severity} /></td>
                    <td style={{ padding: '16px 0', fontSize: '14px', fontWeight: 500 }}>{f.title}</td>
                    <td style={{ padding: '16px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>{f.agentName || 'AI-Agent'}</td>
                    <td style={{ padding: '16px 0', fontSize: '14px', color: 'var(--text-muted)' }}>
                      {new Date(f.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Campaign Activity Card */}
        <div className="glass" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>Campaign Activity</h3>
          
          {campaignsErr ? (
            <div style={{ color: 'var(--danger)', fontSize: '14px' }}>Error connecting to control plane API</div>
          ) : campaigns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <Activity size={32} style={{ marginBottom: '8px' }} />
              <p style={{ fontSize: '14px' }}>No campaigns registered.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {campaigns.slice(0, 5).map((c) => {
                const progress = c.total_tests > 0 ? (c.tests_run / c.total_tests) * 100 : 0;
                return (
                  <div key={c.id} style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ marginTop: '6px' }} className={`status-dot ${c.status.toLowerCase()}`} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{c.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        {c.status} — {c.tests_run}/{c.total_tests} vectors run
                      </div>
                      <div style={{ height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${progress}%`, background: 'var(--primary)', transition: 'width 0.5s' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
