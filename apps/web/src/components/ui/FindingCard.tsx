import Link from 'next/link';
import { SeverityBadge } from './SeverityBadge';
import { ArrowRight } from 'lucide-react';

export function FindingCard({ finding }: any) {
  return (
    <div className="glass animate-fade-in" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <SeverityBadge severity={finding.severity} />
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{finding.timestamp}</span>
        </div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', background: 'var(--bg-elevated)', padding: '4px 8px', borderRadius: '4px' }}>
          {finding.riskRange}
        </div>
      </div>
      
      <div>
        <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
          {finding.title}
        </h4>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {finding.description}
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            🤖
          </div>
          <span style={{ color: 'var(--text-secondary)' }}>{finding.agentName}</span>
        </div>
        <Link href={`/dashboard/findings/${finding.id}`} className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '13px' }}>
          View Detail <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
