'use client';
import useSWR from 'swr';
import { FileText, Download, ShieldAlert, Award } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface AuditReport {
  id: string;
  name: string;
  created_at: string;
  scope: string;
  vulnerabilities_checked: number;
  score: string;
}

export default function ReportsPage() {
  const { data, error, isLoading } = useSWR('/api/v1/reports', fetcher);
  const reports: AuditReport[] = data?.reports || [];

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '4px' }} className="gradient-text">
            Security & Compliance Reports
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Generate cryptographic audit reports mapping findings directly to OWASP Top 10 and MITRE ATLAS matrices.
          </p>
        </div>
        <button className="btn btn-primary">
          Generate Audit Report
        </button>
      </div>

      {isLoading ? (
        <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading reports...</div>
      ) : error ? (
        <div style={{ color: 'var(--danger)', fontSize: '14px' }}>Error connecting to control plane API</div>
      ) : reports.length === 0 ? (
        <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>
          <FileText size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>No Compliance Reports</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
            Generate your first compliance certification to prove your agent's governance holds under adversarial attack conditions.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {reports.map((rep) => (
            <div key={rep.id} className="glass animate-fade-in" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ background: 'rgba(124, 58, 237, 0.15)', padding: '8px', borderRadius: '8px', color: 'var(--accent)' }}>
                    <Award size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600 }}>{rep.name}</h3>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Created {new Date(rep.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <button className="btn btn-ghost" style={{ padding: '6px', borderRadius: '6px' }}>
                  <Download size={14} />
                </button>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Target Scope:</span>
                  <span>{rep.scope}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Checked:</span>
                  <span>{rep.vulnerabilities_checked} vectors</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Security Rating:</span>
                  <span style={{ color: 'var(--success)', fontWeight: 600 }}>{rep.score}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
