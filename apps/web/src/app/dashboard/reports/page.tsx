'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { FileText, Download, Award, X, Loader2, Lock, Zap, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const CURRENT_PLAN = 'starter'; // Replace with real plan from auth context

interface AuditReport {
  id: string;
  name: string;
  created_at: string;
  scope: string;
  vulnerabilities_checked: number;
  score: string;
}

const SCOPE_OPTIONS = [
  { value: 'full-workspace', label: 'Full Workspace', description: 'All campaigns, findings, and remediations' },
  { value: 'campaign', label: 'Specific Campaign', description: 'Select one campaign run to certify' },
  { value: 'findings-only', label: 'Findings Only', description: 'OWASP & MITRE ATLAS mapping report' },
];

const FORMAT_OPTIONS = ['PDF', 'JSON', 'Both'];

export default function ReportsPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/v1/reports', fetcher);
  const reports: AuditReport[] = data?.reports || [];

  const [showModal, setShowModal] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [scope, setScope] = useState('full-workspace');
  const [format, setFormat] = useState('PDF');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerateClick = () => {
    if (CURRENT_PLAN === 'starter') {
      setShowGate(true);
    } else {
      setShowModal(true);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/v1/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope, format }),
      });
      if (res.ok) {
        setGenerated(true);
        mutate();
        setTimeout(() => {
          setShowModal(false);
          setGenerated(false);
        }, 1800);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
            Security &amp; Compliance Reports
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Generate cryptographic audit reports mapping findings to OWASP Top 10 and MITRE ATLAS matrices.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleGenerateClick}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}
        >
          {CURRENT_PLAN === 'starter' && <Lock size={14} />}
          Generate Audit Report
          {CURRENT_PLAN === 'starter' && (
            <span style={{ marginLeft: '4px', fontSize: '10px', background: 'var(--accent)', color: '#000', padding: '1px 6px', borderRadius: '99px', fontWeight: 800 }}>PRO</span>
          )}
        </button>
      </div>

      {isLoading ? (
        <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading reports...</div>
      ) : error ? (
        <div style={{ color: 'var(--danger)', fontSize: '14px' }}>Error connecting to control plane API</div>
      ) : reports.length === 0 ? (
        <div className="glass" style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <FileText size={32} color="var(--text-muted)" />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>No Compliance Reports</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '400px', margin: '0 auto 20px' }}>
            Generate your first compliance certification to prove your agent&apos;s governance holds under adversarial conditions.
          </p>
          {CURRENT_PLAN === 'starter' && (
            <Link href="/dashboard/billing" className="btn btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <Zap size={13} color="var(--accent)" />
              <span style={{ color: 'var(--accent)' }}>Upgrade to Pro to generate reports</span>
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {reports.map((rep) => (
            <div key={rep.id} className="glass animate-fade-in" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ background: 'rgba(234, 179, 8, 0.12)', padding: '8px', borderRadius: '8px', color: 'var(--accent)' }}>
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

      {/* Pro Gate Modal */}
      {showGate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,8,23,0.85)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-card animate-fade-in" style={{ maxWidth: '420px', width: '100%', padding: '36px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={24} color="var(--accent)" />
            </div>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '8px' }}>Pro Feature</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Compliance report generation (PDF, JSON, OWASP/MITRE mapping) is available on the <strong style={{ color: 'var(--accent)' }}>Pro plan</strong> and above.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              <Link href="/dashboard/billing" className="btn btn-primary" style={{ justifyContent: 'center', background: 'var(--accent)', color: '#000', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={14} /> Upgrade to Pro — $299/mo
              </Link>
              <button className="btn btn-ghost" onClick={() => setShowGate(false)} style={{ justifyContent: 'center' }}>
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Report Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,8,23,0.85)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-card animate-fade-in" style={{ maxWidth: '520px', width: '100%', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>Generate Audit Report</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>

            {generated ? (
              <div style={{ textAlign: 'center', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <CheckCircle size={48} color="var(--success)" />
                <div style={{ fontSize: '16px', fontWeight: 700 }}>Report Generated!</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Your compliance report is ready to download.</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Report Scope</label>
                  {SCOPE_OPTIONS.map((opt) => (
                    <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: 'var(--radius-sm)', border: `1px solid ${scope === opt.value ? 'var(--primary)' : 'var(--border)'}`, background: scope === opt.value ? 'var(--primary-dim)' : 'var(--bg-elevated)', cursor: 'pointer', transition: 'all 0.15s' }}>
                      <input type="radio" name="scope" value={opt.value} checked={scope === opt.value} onChange={() => setScope(opt.value)} style={{ accentColor: 'var(--primary)' }} />
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>{opt.label}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{opt.description}</div>
                      </div>
                    </label>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Output Format</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {FORMAT_OPTIONS.map((f) => (
                      <button
                        key={f}
                        onClick={() => setFormat(f)}
                        className={`btn ${format === f ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ padding: '8px 20px', fontSize: '13px' }}
                      >{f}</button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleGenerate} disabled={isGenerating} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Award size={14} />}
                    {isGenerating ? 'Generating…' : 'Generate Report'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
