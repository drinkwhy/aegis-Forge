'use client';
import { useState } from 'react';
import { ShieldCheck, XCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function AdminReviewPage({ params }: { params: { id: string } }) {
  const [approved, setApproved] = useState(false);

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 className="gradient-text" style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>
        Admin Review
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        Audit Case: {params.id}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* Security Summary */}
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', padding: '24px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="var(--primary)" /> Security Assessment
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tests Executed</span> <strong>347</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Passed</span> <strong style={{ color: 'var(--success)' }}>332</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Failed</span> <strong style={{ color: 'var(--error)' }}>15</strong></div>
            <div style={{ height: '1px', background: 'var(--border)', margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Critical Findings</span> <strong>0</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>High Findings</span> <strong style={{ color: 'var(--warning)' }}>2</strong></div>
          </div>
        </div>

        {/* Compliance Summary */}
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', padding: '24px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} color="var(--success)" /> Compliance Readiness
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>EU AI Act</span> <strong style={{ color: 'var(--success)' }}>READY</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>ISO/IEC 42001</span> <strong>89%</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>NIST AI RMF</span> <strong>96%</strong></div>
            <div style={{ height: '1px', background: 'var(--border)', margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Evidence Coverage</span> <strong>94%</strong></div>
          </div>
        </div>

      </div>

      {/* Qualification Blockers */}
      <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', padding: '24px', border: '1px solid var(--border)', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Passport Qualification</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Requirement label="Payment Confirmed" isMet={true} />
          <Requirement label="Testing Authorized & RoE Valid" isMet={true} />
          <Requirement label="Required Attack Tests Complete" isMet={true} />
          <Requirement label="Required Evidence Exists" isMet={true} />
          <Requirement label="No Unresolved Critical Findings" isMet={true} />
          <Requirement label="Compliance Controls Evaluated" isMet={true} />
          <Requirement label="Mandatory Compliance Controls Not Failed" isMet={true} />
        </div>
      </div>

      <button 
        onClick={() => setApproved(true)}
        disabled={approved}
        style={{ 
          width: '100%', padding: '16px', borderRadius: 'var(--radius)', border: 'none', 
          background: approved ? 'var(--success)' : 'var(--primary)', 
          color: approved ? '#fff' : '#000', 
          fontWeight: 700, cursor: approved ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          fontSize: '16px'
        }}
      >
        {approved ? <><CheckCircle2 size={20} /> Passport Issued</> : 'Approve & Issue Passport'}
      </button>

    </div>
  );
}

function Requirement({ label, isMet }: { label: string, isMet: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: isMet ? 'var(--text-primary)' : 'var(--error)' }}>
      {isMet ? <CheckCircle2 size={16} color="var(--success)" /> : <XCircle size={16} color="var(--error)" />}
      <span>{label}</span>
    </div>
  );
}
