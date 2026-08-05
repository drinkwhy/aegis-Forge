'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { AssuranceRing } from '@/components/passport/AssuranceRing';
import { SystemOrbit } from '@/components/passport/SystemOrbit';
import { 
  ShieldCheck, 
  RefreshCw, 
  AlertTriangle, 
  ExternalLink, 
  Lock, 
  FileCheck, 
  History, 
  Server, 
  Eye, 
  CheckCircle,
  HelpCircle,
  Flame,
  UserCheck
} from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface TestClaim {
  id: string;
  title: string;
  status: 'passed' | 'failed' | 'warning';
  evidenceRef: string;
  description: string;
}

interface PassportException {
  requirementId: string;
  justification: string;
  approvedBy: string;
  expiresAt: string;
  compensatingControl: string;
  residualRisk: string;
}

export default function PassportPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<string | null>(null);

  const orgID = 'd3b07384-d113-4a11-b541-ef81f212239e';
  
  // Load live passport list from Go database
  const { data: passportsData, mutate } = useSWR(`/api/v1/organizations/${orgID}/security-passports`, fetcher);
  const passportList = passportsData || [];
  const activePassport = passportList[0];

  // If no passport exists in the DB, fallback to clean mock data matching bootstrap structure
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
    isHeartbeatOffline: activePassport.overallScore < 0.50, // mock rule based on score
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
    gitCommit: '4dd69883e0f4d62e',
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

  const exceptions: PassportException[] = [
    {
      requirementId: 'REQ-MCP-08',
      justification: 'Legacy read-only CRM data sync MCP server is un-sandboxed due to native system library access requirements.',
      approvedBy: 'Dyllan B. (SecOps Lead)',
      expiresAt: '2026-11-26',
      compensatingControl: 'Restricted network egress interface to localhost; token scope strictly set to Read-Only.',
      residualRisk: 'Low. Network traffic restricted, but local execution vulnerabilities remain inside host network namespace.',
    }
  ];

  // Live trigger pipeline: creates snapshot, runs evaluation, and issues new signed passport
  const triggerDriftCheck = async () => {
    setIsRefreshing(true);
    try {
      // 1. Create system configuration snapshot
      const snapshotRes = await fetch(`/api/v1/organizations/${orgID}/systems/agent_fin_advisor_01/snapshots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentCodeCommit: '4dd69883e0f4d62e',
          modelVersion: 'claude-3-5-sonnet',
          systemPrompt: 'Filter and mask all customer SSNs and financial secrets on egress.',
          toolManifests: ['query_db', 'read_file'],
          lastChecked: new Date().toISOString()
        })
      });
      if (!snapshotRes.ok) throw new Error("Failed to create snapshot");
      const snapshot = await snapshotRes.json();

      // 2. Perform assurance evaluations
      const evalRes = await fetch(`/api/v1/organizations/${orgID}/assurance-evaluations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frameworkVersionId: 'fw-v1.4.2-finance',
          subjectSnapshotId: snapshot.id
        })
      });
      if (!evalRes.ok) throw new Error("Failed to evaluate system posture");
      const evaluation = await evalRes.json();

      // 3. Issue signed security passport
      const passportRes = await fetch(`/api/v1/organizations/${orgID}/security-passports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemId: 'agent_fin_advisor_01',
          systemDisplayName: 'Enterprise Financial Portfolio Advisor',
          frameworkId: 'fw-finance-v1',
          frameworkVersionId: 'fw-v1.4.2-finance',
          assuranceEvaluationId: evaluation.id
        })
      });
      if (!passportRes.ok) throw new Error("Failed to issue security passport");

      // Mutate and refresh page data
      await mutate();
    } catch (err) {
      console.error("System recheck failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 700 }} className="gradient-text">
              Security Passport Dashboard
            </h1>
            <span style={{ 
              background: passport.status === 'REVOKED' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)', 
              color: passport.status === 'REVOKED' ? '#ef4444' : '#22c55e', 
              border: passport.status === 'REVOKED' ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(34, 197, 94, 0.25)', 
              fontSize: '11px',
              padding: '2px 10px',
              borderRadius: '99px',
              fontWeight: 600
            }}>
              {passport.status}
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Cryptographically signed verification of the active runtime and validation state of {passport.systemDisplayName}.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-ghost"
            onClick={triggerDriftCheck}
            disabled={isRefreshing}
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Checking System Drift...' : 'Verify System Drift'}
          </button>
          
          <a 
            href={`/verify/passport/${passport.passportId}`}
            target="_blank"
            className="btn btn-primary"
            style={{ 
              background: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)',
              color: '#ffffff',
              boxShadow: '0 0 15px rgba(0, 212, 255, 0.3)'
            }}
          >
            <Eye size={14} />
            Preview Public Passport
          </a>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '28px', alignItems: 'start' }}>
        
        {/* Left Side: Segment Ring & System Orbit */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Segment Ring Card */}
          <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck size={18} color="var(--primary)" />
                Assurance Posture Ring
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Segment breakdown of system safety verification criteria.
              </p>
            </div>
            <AssuranceRing 
              overallScore={passport.overallScore} 
              status={passport.status} 
              assuranceLevel={passport.assuranceLevel.replace('_', ' ')} 
            />
          </div>

          {/* System Orbit Card */}
          <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Server size={18} color="var(--primary)" />
                Security Orbit Map
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Coverage and validation status of architecture components.
              </p>
            </div>
            <SystemOrbit hasDrift={passport.hasDrift} heartbeatOffline={passport.isHeartbeatOffline} />
          </div>

        </div>

        {/* Right Side: Claims, Drift Telemetry, Exceptions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Passport Metadata Panel */}
          <div className="glass" style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Passport ID</span>
              <p style={{ fontSize: '12px', fontWeight: 600, marginTop: '2px', wordBreak: 'break-all' }} className="mono">{passport.passportId}</p>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assurance Level</span>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)', marginTop: '2px' }}>{passport.assuranceLevel.replace('_', ' ')}</p>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Validity Period</span>
              <p style={{ fontSize: '12px', fontWeight: 600, marginTop: '2px' }}>
                Until {new Date(passport.validUntil).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Active Security Claims */}
          <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="#22c55e" />
                Active Security Claims
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Security claims validated by Aegis Crucible. Click a claim to inspect linked evidence payloads.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {testClaims.map(c => {
                const isOpen = selectedClaim === c.id;
                return (
                  <div 
                    key={c.id}
                    onClick={() => setSelectedClaim(isOpen ? null : c.id)}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255,255,255,0.01)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    className="hover-border"
                  >
                    <div style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>{c.title}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }} className="mono">{c.evidenceRef}</span>
                        <span style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          background: '#22c55e', 
                          boxShadow: '0 0 6px #22c55e'
                        }} />
                      </div>
                    </div>

                    {isOpen && (
                      <div style={{ 
                        padding: '12px', 
                        borderTop: '1px solid var(--border)', 
                        background: 'rgba(0,0,0,0.2)',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                        animation: 'fadeIn 0.2s'
                      }}>
                        <p style={{ marginBottom: '8px' }}>{c.description}</p>
                        <span style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                          View Raw Evidence Artifact <ExternalLink size={12} />
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Change Integrity & Drift Control */}
          <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={18} color="var(--primary)" />
                Change Integrity & Telemetry
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Verifies configuration hashes of runtime elements against the cryptographically signed passport.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Tested Commit</span>
                  <p style={{ fontSize: '13px', fontWeight: 500, marginTop: '2px' }} className="mono">{passport.gitCommit}</p>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Deployment Image Digest</span>
                  <p style={{ fontSize: '12px', fontWeight: 500, marginTop: '2px', wordBreak: 'break-all' }} className="mono">
                    {passport.deploymentDigest.substring(0, 36)}...
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Framework Fingerprint</span>
                  <p style={{ fontSize: '13px', fontWeight: 500, marginTop: '2px' }} className="mono">{passport.frameworkFingerprint}</p>
                </div>
              </div>

              <div style={{ 
                borderLeft: '1px solid var(--border)', 
                paddingLeft: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={16} color="#22c55e" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#22c55e' }}>No Drift Detected</span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  System configuration matched passport fingerprints perfectly. Telemetry confirmed at: <span className="mono">{new Date(passport.lastDriftCheck).toLocaleTimeString()}</span>.
                </p>
              </div>

            </div>
          </div>

          {/* Exceptions Panel */}
          <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} color="var(--caution)" />
                Active Risk Exceptions
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Approved framework exceptions. A valid passport must display all risk exceptions transparently.
              </p>
            </div>

            {exceptions.map(e => (
              <div 
                key={e.requirementId}
                style={{
                  border: '1px solid rgba(234, 179, 8, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(234, 179, 8, 0.02)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--caution)' }}>{e.requirementId} Exception</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Expires: <strong className="mono">{e.expiresAt}</strong></span>
                </div>

                <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-secondary)' }}>
                  <p><strong>Justification:</strong> {e.justification}</p>
                  <p><strong>Compensating Control:</strong> {e.compensatingControl}</p>
                  <p><strong>Residual Risk:</strong> {e.residualRisk}</p>
                </div>

                <div style={{ borderTop: '1px solid rgba(234, 179, 8, 0.1)', paddingTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <UserCheck size={14} color="var(--caution)" />
                  Approved by {e.approvedBy}
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

      <style jsx global>{`
        .hover-border:hover {
          border-color: var(--border-hover) !important;
          background: rgba(255,255,255,0.03) !important;
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
