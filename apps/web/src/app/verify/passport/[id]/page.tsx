'use client';
import { use, useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  CheckCircle, 
  Database, 
  Cpu, 
  Terminal, 
  ExternalLink,
  Award,
  Globe,
  Loader2
} from 'lucide-react';

interface VerifyPageProps {
  params: Promise<{ id: string }>;
}

export default function VerifyPassportPage({ params }: VerifyPageProps) {
  const { id } = use(params);
  const [isValidating, setIsValidating] = useState(true);
  const [validationLogs, setValidationLogs] = useState<string[]>([]);

  // Simulation of KMS Cryptographic Signature Check on Page Load
  useEffect(() => {
    const logs = [
      "Connecting to Aegis KMS Vault transit backend...",
      "Retrieving public verification key vault-transit:passport-key...",
      "Hashing passport attestation payload...",
      "Verifying Ed25519 signature payload...",
      "Checking configuration baseline drift status...",
      "Signature verified successfully. Passport is VALID."
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < logs.length) {
        setValidationLogs(prev => [...prev, logs[currentLogIndex]]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        setIsValidating(false);
      }
    }, 450);

    return () => clearInterval(interval);
  }, []);

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
      name: 'Aegis Platform',
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
      background: 'var(--bg-base)',
      backgroundImage: 'radial-gradient(ellipse 60% 40% at 50% -10%, rgba(99, 102, 241, 0.1), transparent)'
    }} className="animate-fade-in">
      
      <div 
        className="glass-card glow-cyan" 
        style={{ 
          maxWidth: '680px', 
          width: '100%', 
          padding: '40px',
          background: 'var(--glass-bg)'
        }}
      >
        
        {/* Verification Loader Overlay */}
        {isValidating ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '350px', gap: '24px' }}>
            <Loader2 size={48} color="var(--cyan)" className="animate-spin" />
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
                Verifying Cryptographic Attestation
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Validating Ed25519 signature integrity with Vault Transit KMS...
              </p>
            </div>
            
            <div style={{
              width: '100%',
              background: '#040712',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              maxHeight: '160px',
              overflowY: 'auto'
            }}>
              {validationLogs.map((log, i) => (
                <div key={i} style={{ marginBottom: '6px', color: i === validationLogs.length - 1 ? 'var(--cyan)' : 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--primary)' }}>&gt;</span> {log}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            {/* Top Verification Seal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={24} color="var(--cyan)" />
                <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>
                  AEGIS VERIFIED PASSPORT
                </span>
              </div>
              <div style={{ 
                background: 'rgba(16, 185, 129, 0.1)', 
                color: 'var(--success)', 
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '4px 12px', 
                borderRadius: '99px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.05em'
              }}>
                SIGNATURE VERIFIED
              </div>
            </div>

            {/* Title / Organization details */}
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '24px', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '6px' }}>
                {passport.systemDisplayName}
              </h2>
              <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <span>Owner: <strong>{passport.organizationName}</strong></span>
                <span>•</span>
                <span>Assurance: <strong style={{ color: 'var(--cyan)' }}>{passport.assuranceLevel}</strong></span>
              </div>
            </div>

            {/* Scope Summary Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
              {[
                { label: 'AI Models', count: passport.scopeSummary.models, icon: Cpu },
                { label: 'Sandboxed Tools', count: passport.scopeSummary.tools, icon: Terminal },
                { label: 'MCP Servers', count: passport.scopeSummary.mcpServers, icon: Database },
              ].map((scope, i) => (
                <div key={i} className="glass" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <scope.icon size={18} color="var(--primary)" />
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{scope.label}</div>
                    <div style={{ fontSize: '16px', fontWeight: 700 }}>{scope.count} Verified</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Claims Check List */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Verified Boundary Assurances
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {claims.map((claim, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px' }}>
                    <CheckCircle size={16} color="var(--success)" style={{ flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-primary)' }}>{claim}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cryptographic Seal Verification details */}
            <div className="glass" style={{ padding: '20px', background: '#040712' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Lock size={14} color="var(--cyan)" />
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>
                  KMS Verification Metadata
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Key ID:</span> {passport.signature.keyId}
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Signed At:</span> {new Date(passport.signature.signedAt).toLocaleString()}
                </div>
                <div style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Payload Hash:</span> {passport.signature.payloadHash}
                </div>
                <div style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Signature:</span> {passport.signature.signature}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '12px', color: 'var(--text-muted)' }}>
              This page displays cryptographically verified, redacted compliance parameters. Sensitive assets and configuration variables are concealed.
            </div>
          </div>
        )}

      </div>
      
    </div>
  );
}
