import { StatCard } from '@/components/ui/StatCard';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import { Activity, ShieldAlert, Target, TrendingUp } from 'lucide-react';

const stats = [
  { title: 'Agents Monitored', value: '14', change: '+2', changeType: 'down', icon: Target },
  { title: 'Active Campaigns', value: '3', change: 'Stable', changeType: 'down', icon: Activity },
  { title: 'Open Critical', value: '7', change: '+3', changeType: 'up', icon: ShieldAlert },
  { title: 'Avg FAIR-AI Risk', value: '$840k', change: '+$120k', changeType: 'up', icon: TrendingUp },
];

const recentFindings = [
  { id: '1', title: 'Unauthorized DB access via Prompt Injection', agent: 'CustomerSupport-Bot', severity: 'Critical', time: '2h ago' },
  { id: '2', title: 'SSRF in Internal API Tool', agent: 'DevOps-Assistant', severity: 'High', time: '5h ago' },
  { id: '3', title: 'PII Leak in Summarization', agent: 'DocWriter', severity: 'Medium', time: '12h ago' },
  { id: '4', title: 'Excessive Agency - S3 Bucket Listing', agent: 'CustomerSupport-Bot', severity: 'Critical', time: '1d ago' },
];

const campaigns = [
  { name: 'Q3 Red Team Sync', status: 'running', progress: 68, time: 'Started 2h ago' },
  { name: 'CustomerSupport Agent Eval', status: 'pending', progress: 0, time: 'Scheduled' },
  { name: 'DevOps Assistant Nightly', status: 'complete', progress: 100, time: 'Completed' },
];

export default function DashboardPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600 }}>Security Posture Overview</h2>
        <button className="btn btn-primary">Download Report</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
        {stats.map(s => <StatCard key={s.title} {...s} />)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="glass" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>Recent Findings</h3>
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
              {recentFindings.map((f, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '16px 0' }}><SeverityBadge severity={f.severity} /></td>
                  <td style={{ padding: '16px 0', fontSize: '14px', fontWeight: 500 }}>{f.title}</td>
                  <td style={{ padding: '16px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>{f.agent}</td>
                  <td style={{ padding: '16px 0', fontSize: '14px', color: 'var(--text-muted)' }}>{f.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="glass" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>Campaign Activity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {campaigns.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: '16px' }}>
                <div style={{ marginTop: '6px' }} className={`status-dot ${c.status}`} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{c.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>{c.time}</div>
                  <div style={{ height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${c.progress}%`, background: 'var(--primary)', transition: 'width 0.5s' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
