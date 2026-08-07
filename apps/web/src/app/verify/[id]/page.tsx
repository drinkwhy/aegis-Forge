'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Shield, CheckCircle, XCircle, AlertTriangle, Clock, ExternalLink, Copy, Loader2 } from 'lucide-react';

interface PassportData {
  passportId: string;
  passportVersion: string;
  systemDisplayName: string;
  frameworkId: string;
  assuranceLevel: string;
  status: string;
  issuedAt: string;
  validUntil: string;
  overallScore: number;
  resultsSummary: {
    controlsPassed: number;
    controlsTotal: number;
    openCriticalFindings: number;
    openHighFindings: number;
    overallScore: number;
  };
  limitations: string[];
  signature: {
    algorithm: string;
    keyId: string;
    payloadHash: string;
    signature: string;
    signedAt: string;
  };
  issuer: {
    name: string;
    issuerType: string;
  };
}

const STATUS_CONFIG: Record<string, { color: string; icon: typeof CheckCircle; label: string }> = {
  VALID: { color: '#10b981', icon: CheckCircle, label: 'Valid' },
  SUSPENDED: { color: '#f59e0b', icon: AlertTriangle, label: 'Suspended' },
  REVOKED: { color: '#ef4444', icon: XCircle, label: 'Revoked' },
  EXPIRED: { color: '#6b7280', icon: Clock, label: 'Expired' },
  DEGRADED: { color: '#f59e0b', icon: AlertTriangle, label: 'Degraded' },
};

const ASSURANCE_LABELS: Record<string, { label: string; color: string }> = {
  CONTINUOUSLY_VERIFIED: { label: 'Continuously Verified', color: '#10b981' },
  VERIFIED: { label: 'Verified', color: '#3b82f6' },
  TESTED: { label: 'Tested (Conditional)', color: '#f59e0b' },
  OBSERVED: { label: 'Observed', color: '#6b7280' },
};

export default function VerifyPassportPage() {
  const params = useParams();
  const passportId = params?.id as string;
  const [passport, setPassport] = useState<PassportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [copied, setCopied] = useState(false);

  const verify = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/verify/passport/${passportId}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Passport not found' }));
        setError(data.error || `Verification failed (HTTP ${res.status})`);
        return;
      }
      const data = await res.json();
      setPassport(data);

      // Check expiry
      const now = new Date();
      const expiry = new Date(data.validUntil);
      if (data.status === 'VALID' && expiry < now) {
        data.status = 'EXPIRED';
      }

      // Signature present = cryptographically signed
      if (data.signature?.signature) {
        setVerified(true);
      }
    } catch {
      setError('Network error — unable to reach verification service');
    } finally {
      setLoading(false);
    }
  };

  const copyId = () => {
    navigator.clipboard.writeText(passportId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Auto-verify on mount
  if (!passport && !error && !loading && passportId) {
    verify();
  }

  const statusCfg = passport ? STATUS_CONFIG[passport.status] || STATUS_CONFIG.EXPIRED : null;
  const assuranceCfg = passport ? ASSURANCE_LABELS[passport.assuranceLevel] || ASSURANCE_LABELS.OBSERVED : null;
  const StatusIcon = statusCfg?.icon || Clock;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0e1a 0%, #111827 50%, #0a0e1a 100%)',
      color: '#e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 20px',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <Shield size={32} color="#3b82f6" />
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: '#f9fafb' }}>
          Aegis Security Passport
        </h1>
      </div>
      <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '32px' }}>
        Independent Verification Portal
      </p>

      {/* Main Card */}
      <div style={{
        width: '100%',
        maxWidth: '640px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '32px',
        backdropFilter: 'blur(12px)',
      }}>
        {/* Passport ID */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <span style={{ color: '#9ca3af', fontSize: '13px' }}>Passport ID:</span>
          <code style={{
            background: 'rgba(255,255,255,0.06)',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#d1d5db',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {passportId}
          </code>
          <button onClick={copyId} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
            color: copied ? '#10b981' : '#9ca3af',
          }}>
            <Copy size={14} />
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Loader2 size={32} color="#3b82f6" className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: '#9ca3af' }}>Verifying passport…</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center',
          }}>
            <XCircle size={24} color="#ef4444" style={{ margin: '0 auto 8px' }} />
            <p style={{ color: '#fca5a5', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Verified Passport */}
        {passport && statusCfg && (
          <>
            {/* Status Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '20px',
              background: `rgba(${passport.status === 'VALID' ? '16,185,129' : passport.status === 'REVOKED' ? '239,68,68' : '245,158,11'}, 0.08)`,
              border: `1px solid rgba(${passport.status === 'VALID' ? '16,185,129' : passport.status === 'REVOKED' ? '239,68,68' : '245,158,11'}, 0.2)`,
              borderRadius: '12px',
              marginBottom: '24px',
            }}>
              <StatusIcon size={28} color={statusCfg.color} />
              <div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: statusCfg.color }}>
                  {statusCfg.label}
                </div>
                {verified && (
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                    ✓ Cryptographically signed ({passport.signature?.algorithm})
                  </div>
                )}
              </div>
            </div>

            {/* Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <DetailItem label="System" value={passport.systemDisplayName} />
              <DetailItem label="Framework" value={passport.frameworkId} />
              <DetailItem label="Assurance Level" value={assuranceCfg?.label || passport.assuranceLevel} valueColor={assuranceCfg?.color} />
              <DetailItem label="Issued" value={new Date(passport.issuedAt).toLocaleDateString()} />
              <DetailItem label="Valid Until" value={new Date(passport.validUntil).toLocaleDateString()} />
              <DetailItem label="Issuer" value={passport.issuer?.name || 'Aegis Crucible'} />
            </div>

            {/* Results */}
            {passport.resultsSummary && (
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px',
              }}>
                <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#9ca3af', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Assessment Results
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <MetricBox label="Controls Passed" value={`${passport.resultsSummary.controlsPassed}/${passport.resultsSummary.controlsTotal}`} color="#10b981" />
                  <MetricBox label="Critical Findings" value={String(passport.resultsSummary.openCriticalFindings)} color={passport.resultsSummary.openCriticalFindings > 0 ? '#ef4444' : '#10b981'} />
                  <MetricBox label="High Findings" value={String(passport.resultsSummary.openHighFindings)} color={passport.resultsSummary.openHighFindings > 0 ? '#f59e0b' : '#10b981'} />
                </div>
              </div>
            )}

            {/* Limitations */}
            {passport.limitations?.length > 0 && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.05)',
                border: '1px solid rgba(245, 158, 11, 0.15)',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
              }}>
                <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#f59e0b', marginBottom: '8px' }}>
                  Limitations
                </h3>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#d1d5db', lineHeight: 1.6 }}>
                  {passport.limitations.map((l: string, i: number) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cryptographic Proof */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '8px',
              padding: '16px',
            }}>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#9ca3af', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Cryptographic Proof
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', fontFamily: 'monospace' }}>
                <ProofRow label="Algorithm" value={passport.signature?.algorithm || 'N/A'} />
                <ProofRow label="Key ID" value={passport.signature?.keyId || 'N/A'} />
                <ProofRow label="Payload Hash" value={passport.signature?.payloadHash || 'N/A'} />
                <ProofRow label="Signed At" value={passport.signature?.signedAt || 'N/A'} />
                <ProofRow label="Signature" value={passport.signature?.signature?.substring(0, 48) + '...' || 'N/A'} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>
        <p>Powered by Aegis Crucible • Independent security assurance for AI systems</p>
        <a href="/.well-known/aegis-passport-keys.json" target="_blank" rel="noopener"
          style={{ color: '#3b82f6', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          View Public Signing Keys <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}

function DetailItem({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div>
      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: 500, color: valueColor || '#e5e7eb' }}>{value}</div>
    </div>
  );
}

function MetricBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '20px', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>{label}</div>
    </div>
  );
}

function ProofRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <span style={{ color: '#6b7280', minWidth: '100px' }}>{label}:</span>
      <span style={{ color: '#d1d5db', wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}
