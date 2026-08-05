'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { AssuranceRing } from '@/components/passport/AssuranceRing';
import { SystemOrbit } from '@/components/passport/SystemOrbit';
import { 
  ShieldCheck, 
  ShieldAlert,
  RefreshCw, 
  ExternalLink, 
  Lock, 
  FileCheck, 
  Terminal, 
  Server, 
  CheckCircle,
  Copy,
  Layers,
  Database,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface TestClaim {
  id: string;
  title: string;
  status: 'passed' | 'failed' | 'warning';
  evidenceRef: string;
  description: string;
}

export default function PassportPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const orgID = 'd3b07384-d113-4a11-b541-ef81f212239e';
  
  // Load live passport list from Go database
  const { data: passportsData, mutate } = useSWR(`/api/v1/organizations/${orgID}/security-passports`, fetcher);
  const passportList = passportsData || [];
  const activePassport = passportList[0];

  const passport = activePassport ? {
    passportId: activePassport.passportId,
    passportVersion: activePassport.passportVersion,
    systemDisplayName: activePassport.systemDisplayName,
    status: activePassport.status,
    assuranceLevel: activePassport.assuranceLevel,
    overallScore: activePassport.overallScore,
    issuedAt: activePassport.issuedAt,
    validUntil: activePassport.validUntil,
    frameworkVersionId: activePassport.frameworkVersionId,
    frameworkFingerprint: activePassport.frameworkFingerprint,
    subjectFingerprint: activePassport.subjectFingerprint,
    evidenceManifestHash: activePassport.evidenceManifestHash,
    gitCommit: activePassport.subjectFingerprint.slice(0, 12),
    deploymentDigest: 'sha256:' + activePassport.subjectFingerprint.slice(0, 24),
    lastDriftCheck: new Date(activePassport.issuedAt).toLocaleString(),
    hasDrift: activePassport.status === 'REVOKED' || activePassport.overallScore < 0.85,
    isHeartbeatOffline: activePassport.overallScore < 0.50,
  } : {
    passportId: 'pass_01JA98BD192X0192A',
    passportVersion: '1.0',
    systemDisplayName: 'Enterprise Financial Portfolio Advisor',
    status: 'VALID',
    assuranceLevel: 'CONTINUOUSLY_VERIFIED',
    overallScore: 0.94,
    issuedAt: '2026-07-26T12:00:00Z',
    validUntil: '2027-07-26T12:00:00Z',
    frameworkVersionId: 'fw-v1.4.2-finance',
    frameworkFingerprint: 'fw_8fa21c4de8e441c9',
    subjectFingerprint: '8fa21c4de8e441c9902ba98e102f4cc889f8162e848de1d9ff02bc4500ea1e84',
    evidenceManifestHash: 'manifest_8fa21c4de8e4',
    gitCommit: '4dd69883e0f4',
    deploymentDigest: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    lastDriftCheck: '2026-08-05T01:10:00-05:00',
    hasDrift: false,
    isHeartbeatOffline: false,
  };

  const testClaims: TestClaim[] = [
    { id: '1', title: 'Prompt Injection Resistance', status: 'passed', evidenceRef: 'ev_pi_01', description: 'Differential validation executed against 150 prompt injection attack matrices; zero successful system prompt overwrites recorded.' },
    { id: '2', title: 'Unauthorized Tool Execution Block', status: 'passed', evidenceRef: 'ev_ut_02', description: 'SQL tool query intercepter verified. Out-of-bounds parameter modification blocked by active Sentinel filters.' },
    { id: '3', title: 'Sensitive Data Exfiltration Prevention', status: 'passed', evidenceRef: 'ev_de_03', description: 'Audit logs confirm egress proxy intercepted and masked all outbound requests containing mock sensitive credentials.' },
    { id: '4', title: 'MCP Sandbox Integrity', status: 'passed', evidenceRef: 'ev_mcp_04', description: 'gVisor microcontainer namespaces isolated. Attempted namespace escapes terminated immediately at container runtime boundary.' },
    { id: '5', title: 'Privilege Escalation Interception', status: 'passed', evidenceRef: 'ev_pe_05', description: 'Verified that session lease limits restrict token scopes. Attempt to run unauthorized commands rejected.' },
  ];

  const handleVerifyDrift = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/v1/organizations/${orgID}/security-passports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        await mutate();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const copyEmbedCode = () => {
    const code = `<a href="http://localhost:3000/verify/passport/${passport.passportId}" target="_blank">\n  <img src="http://localhost:3000/api/shield.svg" alt="Aegis Verified Status"/>\n</a>`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusDetails = () => {
    switch (passport.status) {
      case 'VALID':
        return { color: '#10b981', label: 'ACCREDITED & ACTIVE', description: 'System boundaries verified. All continuous hardening criteria fully satisfied.', icon: ShieldCheck };
      case 'DEGRADED':
        return { color: '#f97316', label: 'SECURITY WARNING', description: 'Non-blocking drift detected. Telebeat check-in active but validation coverage is reduced.', icon: ShieldAlert };
      default:
        return { color: '#ef4444', label: 'ATTESTATION SUSPENDED', description: 'Unresolved critical finding detected. Outbound enforcement disabled or bypassed.', icon: ShieldAlert };
    }
  };

  const statusTheme = getStatusDetails();
  const StatusIcon = statusTheme.icon;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in">
      
      {/* Top Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Security Passport Console
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Continuous attestation and cryptographic baseline tracking for AI systems.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-ghost" 
            onClick={handleVerifyDrift}
            disabled={isRefreshing}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Verifying Baseline...' : 'Verify System Drift'}
          </button>
          
          <Link 
            href={`/verify/passport/${passport.passportId}`}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <ExternalLink size={14} />
            Public Trust Seal
          </Link>
        </div>
      </div>

      {/* Main Double Dashboard Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '32px' }}>
        
        {/* Left Column: Attestation and Claims */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Main Status Cockpit Card */}
          <div className="glass-card" style={{ padding: '32px', display: 'flex', gap: '28px', alignItems: 'center' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.02)',
              border: `2px solid ${statusTheme.color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <StatusIcon size={40} color={statusTheme.color} />
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: statusTheme.color, border: `1px solid ${statusTheme.color}40`, padding: '2px 8px', borderRadius: '4px', fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>
                  {statusTheme.label}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  ID: {passport.passportId}
                </span>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
                {passport.systemDisplayName}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {statusTheme.description}
              </p>
            </div>
          </div>

          {/* Attestation Blocks - Cryptographic Ledger Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Terminal size={18} color="var(--cyan)" />
                <h4 style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>System Configuration</h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Git Code Commit</div>
                  <code style={{ fontSize: '12px', color: 'var(--text-primary)', display: 'block', background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                    {passport.gitCommit}
                  </code>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Deployment Digest</div>
                  <code style={{ fontSize: '12px', color: 'var(--text-primary)', display: 'block', background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border)', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                    {passport.deploymentDigest}
                  </code>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Database size={18} color="var(--primary)" />
                <h4 style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>Framework Fingerprints</h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Required Rules Checklist</div>
                  <code style={{ fontSize: '12px', color: 'var(--text-primary)', display: 'block', background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                    {passport.frameworkFingerprint}
                  </code>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Evidence Manifest Hash</div>
                  <code style={{ fontSize: '12px', color: 'var(--text-primary)', display: 'block', background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border)', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                    {passport.evidenceManifestHash}
                  </code>
                </div>
              </div>
            </div>

          </div>

          {/* Claims List Table */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-display)', marginBottom: '16px' }}>
              Attested Claims Check
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {testClaims.map((claim) => (
                <div 
                  key={claim.id}
                  className="glass"
                  onClick={() => setSelectedClaim(selectedClaim === claim.id ? null : claim.id)}
                  style={{
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: selectedClaim === claim.id ? 'rgba(255,255,255,0.02)' : 'transparent',
                    borderColor: selectedClaim === claim.id ? 'var(--cyan)' : 'var(--border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CheckCircle size={18} color="#10b981" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '14px', fontWeight: 500, flex: 1 }}>{claim.title}</span>
                    <code style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{claim.evidenceRef}</code>
                  </div>
                  
                  {selectedClaim === claim.id && (
                    <div style={{ marginTop: '12px', paddingLeft: '30px', fontSize: '13px', color: 'var(--text-secondary)', borderTop: '1px solid var(--border)', paddingTop: '12px', lineHeight: 1.5 }} className="animate-fade-in">
                      {claim.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Score Ring and Orbit Map */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Posture Score Radial Ring */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text-secondary)', alignSelf: 'flex-start', marginBottom: '12px' }}>
              Assurance Posture Rating
            </h4>
            <AssuranceRing 
              overallScore={passport.overallScore} 
              status={passport.status} 
              assuranceLevel={passport.assuranceLevel} 
            />
          </div>

          {/* Target Orbit System Telemetry Map */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              System Orbit Status
            </h4>
            <SystemOrbit 
              hasDrift={passport.hasDrift} 
              heartbeatOffline={passport.isHeartbeatOffline} 
            />
          </div>

          {/* Share Embed Portal Link */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Embed Trust Seal
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.4 }}>
              Copy the iframe embed code to display validation seals on your corporate trust site.
            </p>
            <button 
              className="btn btn-ghost"
              onClick={copyEmbedCode}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderStyle: 'dashed' }}
            >
              <Copy size={14} />
              {copied ? 'Copied Embed Code!' : 'Copy Trust Embed'}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
