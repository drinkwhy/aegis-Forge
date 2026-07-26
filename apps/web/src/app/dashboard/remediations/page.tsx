'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { Wrench, CheckCircle, ExternalLink, Shield } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

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

export default function RemediationsPage() {
  const { data, error, isLoading } = useSWR('/api/v1/remediations', fetcher);
  const remediations: Remediation[] = data?.remediations || [];

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '4px' }} className="gradient-text">
          Automated Remediations
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Approve proposed patches, prompts, and policy fixes to harden your AI agents.
        </p>
      </div>

      {isLoading ? (
        <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading remediations...</div>
      ) : error ? (
        <div style={{ color: 'var(--danger)', fontSize: '14px' }}>Error connecting to control plane API</div>
      ) : remediations.length === 0 ? (
        <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>
          <Wrench size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>No Proposed Remediations</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
            Run attack campaigns against your agents. When vulnerabilities are verified, automated patches will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {remediations.map((rem) => (
            <div key={rem.id} className="glass animate-fade-in" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'start', gap: '16px' }}>
                <div style={{ background: 'var(--primary-dim)', padding: '10px', borderRadius: '8px', color: 'var(--primary)' }}>
                  <Wrench size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{rem.finding_title}</h3>
                    <span className={`badge badge-${rem.severity.toLowerCase()}`}>{rem.severity}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px' }}>
                    Type: <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{rem.fix_type}</span>
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
              <div>
                <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }}>
                  <CheckCircle size={14} /> Approve & Deploy
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
