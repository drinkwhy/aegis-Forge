'use client';
import { use } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  CheckCircle, 
  Database, 
  Cpu, 
  Terminal, 
  AlertCircle, 
  ExternalLink,
  Award,
  Globe
} from 'lucide-react';

interface VerifyPageProps {
  params: Promise<{ id: string }>;
}

export default function VerifyPassportPage({ params }: VerifyPageProps) {
  const { id } = use(params);

  // Mock static data mirroring a verified passport for public consumption (strict redactions enforced)
  const passport = {
    passportId: id || 'pass_01JA98BD192X0192A',
    passportVersion: '1.0',
    systemDisplayName: 'Enterprise Financial Portfolio Advisor',
    status: 'VALID',
    assuranceLevel: 'CONTINUOUSLY_VERIFIED',
    issuedAt: '2026-07-26T12:00:00Z',
    validUntil: '2027-07-26T12:00:00Z',
    frameworkFingerprint: 'fw_8fa21c4de8e441c9',
    subjectFingerprint: '8fa21c4de8e441c9902ba98e102f4cc889f8162e848de1d9ff02bc4500ea1e84',
    evidenceManifestHash: 'manifest_8fa21c4de8e4',
    organizationName: 'WealthFront Systems Inc.',
    issuer: {
      name: 'Aegis Crucible',
      issuerType: 'AUTOMATED_PLATFORM',
      keyId: 'vault-transit:passport-key'
    },
    signature: {
      algorithm: 'Ed25519',
      keyId: 'vault-transit:passport-key',
      payloadHash: '43cfd991b2c4500ea1e848fa21c4de8e441c9902ba98e102f4cc889f8162e84f',
      signature: 'ed25519:sig:990aef48b1d9ff02bc4500ea1e8428de1d9ff02bc4500ea1e84d4e3b0c44298fc1c149afbf4c8996fb924',
      signedAt: '2026-07-26T12:00:05Z'
    },
    scopeSummary: {
      agents: 2,
      models: 1,
      tools: 4,
      mcpServers: 1,
      dataStores: 2,
      deployments: 1
    },
    resultsSummary: {
      controlsPassed: 8,
      controlsTotal: 10,
      validationsPassed: 5,
      validationsTotal: 5
    }
  };

  const claims = [
    'Prompt Injection Resistance Validated',
    'Unauthorized Tool Execution Interception Active',
    'Sensitive Data Outbound Masking Enforced',
    'MCP Boundary gVisor Sandbox Confirmed',
    'Privilege Lease Boundaries Enforced'
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '40px 20px',
      background: '#020817',
      backgroundImage: 'radial-gradient(ellipse 60% 40% at 50% -10%, rgba(124, 58, 237, 0.08), transparent)'
    }}>
      <div 
        className="glass" 
        style={{ 
          maxWidth: '680px', 
          width: '100%', 
          padding: '40px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 212, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          position: 'relative'
        }}
      >
        
        {/* Top Badges / Verification Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={24} color="var(--primary)" style={{ filter: 'drop-shadow(0 0 8px rgba(0,212,255,0.4))' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-secondary)' }} className="mono">
              AEGIS CRUCIBLE PASSPORT
            </span>
          </div>

          <span style={{ 
            background: 'rgba(34, 197, 94, 0.15)', 
            color: '#22c55e', 
            border: '1px solid rgba(34, 197, 94, 0.3)', 
            fontSize: '11px',
            padding: '4px 14px',
            borderRadius: '99px',
            fontWeight: 700,
            letterSpacing: '0.05em',
            boxShadow: '0 0 10px rgba(34, 197, 94, 0.1)'
          }}>
            VERIFIED VALID
          </span>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }} className="gradient-text">
            Security Passport Verification
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Official external verification for the security profile of <strong>{passport.systemDisplayName}</strong>.
          </p>
        </div>

        {/* Scope and Validity Info */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '20px', 
          background: 'rgba(255,255,255,0.02)', 
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '20px',
          marginBottom: '28px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Organization</span>
              <p style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>{passport.organizationName}</p>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Passport ID</span>
              <p style={{ fontSize: '12px', fontWeight: 500, marginTop: '2px', wordBreak: 'break-all' }} className="mono">
                {passport.passportId}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Assurance Level</span>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)', marginTop: '2px' }}>
                {passport.assuranceLevel.replace('_', ' ')}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Issued At</span>
              <p style={{ fontSize: '13px', fontWeight: 500, marginTop: '2px' }}>{new Date(passport.issuedAt).toUTCString()}</p>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Valid Until</span>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#22c55e', marginTop: '2px' }}>
                {new Date(passport.validUntil).toUTCString()}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>System Fingerprint</span>
              <p style={{ fontSize: '11px', fontWeight: 500, marginTop: '2px', wordBreak: 'break-all' }} className="mono">
                {passport.subjectFingerprint.substring(0, 32)}...
              </p>
            </div>
          </div>
        </div>

        {/* High-Level Scope Summary Grid */}
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            System Coverage Scope
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', textAlign: 'center' }}>
            {Object.entries(passport.scopeSummary).map(([key, value]) => (
              <div key={key} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 4px' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }} className="mono">{value}</span>
                <span style={{ fontSize: '9px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                  {key.replace('MCPServers', 'MCPs')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Claims Verified */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Verified Safety Claims
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {claims.map((claim, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(34, 197, 94, 0.03)', border: '1px solid rgba(34, 197, 94, 0.1)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
                <CheckCircle size={14} color="#22c55e" />
                <span style={{ fontSize: '12.5px', color: 'var(--text-primary)' }}>{claim}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cryptographic Signature details */}
        <div style={{ 
          background: 'rgba(0,0,0,0.3)', 
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '20px',
          fontSize: '11px',
          color: 'var(--text-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '4px' }}>
            <Lock size={12} color="var(--primary)" />
            Cryptographic Proof Of Authenticity
          </div>
          <div>
            <span>Payload SHA-256 Hash:</span>
            <p className="mono" style={{ color: 'var(--text-primary)', marginTop: '2px', wordBreak: 'break-all' }}>{passport.signature.payloadHash}</p>
          </div>
          <div>
            <span>Issuer Key ID:</span>
            <p className="mono" style={{ color: 'var(--text-primary)', marginTop: '2px' }}>{passport.signature.keyId} ({passport.signature.algorithm})</p>
          </div>
          <div>
            <span>Attestation Signature:</span>
            <p className="mono" style={{ color: 'var(--text-primary)', marginTop: '2px', wordBreak: 'break-all' }}>{passport.signature.signature}</p>
          </div>
        </div>

        {/* Safe Redaction Notice */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', background: 'rgba(0, 212, 255, 0.02)', border: '1px solid rgba(0, 212, 255, 0.1)', borderRadius: 'var(--radius)', padding: '12px 16px' }}>
          <AlertCircle size={16} color="var(--primary)" style={{ marginTop: '2px', flexShrink: 0 }} />
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            <strong>Privacy & Security Compliance Redaction</strong>: All raw attack payloads, internal server hostnames, database connection strings, model prompt contents, and private file paths have been mathematically audited and redacted from this shareable view.
          </p>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '36px', borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span>Powered by Aegis Crucible Platform</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            Verify Status API <ExternalLink size={10} />
          </span>
        </div>

      </div>
    </div>
  );
}
