'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { FindingCard } from '@/components/ui/FindingCard';
import { ShieldAlert } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Finding {
  id: string;
  title: string;
  description?: string;
  agentName?: string;
  severity: string;
  riskRange?: string;
  timestamp?: string;
}

export default function FindingsPage() {
  const [filter, setFilter] = useState('All');
  const { data, error, isLoading } = useSWR('/api/v1/findings', fetcher);
  const findings: Finding[] = data?.findings || [];

  const filteredFindings = findings.filter((f) => {
    if (filter === 'All') return true;
    return f.severity.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600 }}>Security Findings</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['All', 'Critical', 'High', 'Medium', 'Low'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '6px 12px', fontSize: '13px' }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading findings...</div>
      ) : error ? (
        <div style={{ color: 'var(--danger)', fontSize: '14px' }}>Error connecting to control plane API</div>
      ) : filteredFindings.length === 0 ? (
        <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>
          <ShieldAlert size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>No Security Findings</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
            All systems verified secure. Run attack campaigns or deploy integrations to test your agents for vulnerabilities.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
          {filteredFindings.map((f) => (
            <FindingCard key={f.id} finding={{
              id: f.id,
              title: f.title,
              description: f.description || 'Vulnerability verified by automated test script simulation run.',
              agentName: f.agentName || 'AI-Agent',
              severity: f.severity,
              riskRange: f.riskRange || 'Calculating...',
              timestamp: f.timestamp || 'Just now'
            }} />
          ))}
        </div>
      )}
    </div>
  );
}
