'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  Building2, Server, Target, FileCheck, CreditCard,
  ChevronRight, ChevronLeft, CheckCircle, Loader2,
  Shield, AlertTriangle, ExternalLink
} from 'lucide-react';

const TEST_CATEGORIES = [
  { id: 'direct_prompt_injection', label: 'Direct Prompt Injection', desc: 'LLM01 — System prompt override attacks' },
  { id: 'indirect_prompt_injection', label: 'Indirect Prompt Injection', desc: 'LLM01 — Via tool outputs, documents, web content' },
  { id: 'tool_poisoning', label: 'Tool Poisoning', desc: 'LLM07 — Malicious tool descriptions and behaviors' },
  { id: 'parameter_smuggling', label: 'Parameter Smuggling', desc: 'LLM07 — Hidden parameter injection via tool calls' },
  { id: 'excessive_agency', label: 'Excessive Agency', desc: 'LLM08 — Agent taking unauthorized actions' },
  { id: 'unauthorized_tool_execution', label: 'Unauthorized Tool Execution', desc: 'LLM08 — Executing tools outside authorized scope' },
  { id: 'sensitive_data_exposure', label: 'Sensitive Data Exposure', desc: 'LLM06 — Leaking secrets, PII, confidential data' },
  { id: 'privilege_authorization_failures', label: 'Privilege & Authorization Failures', desc: 'LLM01/LLM08 — Bypassing access controls' },
];

const STEPS = [
  { num: 1, label: 'Organization', icon: Building2 },
  { num: 2, label: 'AI System', icon: Server },
  { num: 3, label: 'Target Config', icon: Target },
  { num: 4, label: 'Scope & RoE', icon: FileCheck },
  { num: 5, label: 'Payment', icon: CreditCard },
];

export default function SecurityAuditWizard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Org
  const [existingOrgs, setExistingOrgs] = useState<Array<{ id: string; display_name: string; slug: string }>>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [newOrgName, setNewOrgName] = useState('');
  const [creatingOrg, setCreatingOrg] = useState(false);

  // Step 2: Asset
  const [assetId, setAssetId] = useState<string | null>(null);
  const [assetName, setAssetName] = useState('');
  const [assetDescription, setAssetDescription] = useState('');
  const [assetType, setAssetType] = useState<'openai_compatible' | 'mcp_server'>('openai_compatible');

  // Step 3: Target
  const [targetEndpoint, setTargetEndpoint] = useState('');
  const [targetEnvironment, setTargetEnvironment] = useState<'production' | 'staging' | 'development'>('production');
  const [ownershipConfirmed, setOwnershipConfirmed] = useState(false);

  // Step 4: RoE
  const [permittedTests, setPermittedTests] = useState<string[]>([]);
  const [testingWindowStart, setTestingWindowStart] = useState('');
  const [testingWindowEnd, setTestingWindowEnd] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [roeAgreed, setRoeAgreed] = useState(false);

  // Step 5: Payment
  const [orderId, setOrderId] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);

  useEffect(() => {
    if (isLoaded && user) {
      fetch('/api/v1/organizations')
        .then(r => r.json())
        .then(data => {
          if (data.organizations) {
            setExistingOrgs(data.organizations);
            if (data.organizations.length === 1) {
              setSelectedOrgId(data.organizations[0].id);
            }
          }
        })
        .catch(() => {});
    }
  }, [isLoaded, user]);

  if (!isLoaded) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <Loader2 size={32} color="var(--primary)" className="animate-spin" />
      </div>
    );
  }

  const orgId = selectedOrgId;

  async function handleStep1Next() {
    setError(null);
    if (!selectedOrgId && newOrgName.trim().length < 2) {
      setError('Please select an organization or enter a name for a new one (min 2 characters)');
      return;
    }
    setLoading(true);
    try {
      if (!selectedOrgId) {
        const res = await fetch('/api/v1/organizations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayName: newOrgName.trim() }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to create organization');
        }
        const org = await res.json();
        setSelectedOrgId(org.id);
        setExistingOrgs(prev => [...prev, org]);
      }
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function handleStep2Next() {
    setError(null);
    if (!assetName.trim()) {
      setError('AI system name is required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/organizations/${orgId}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: assetName.trim(), description: assetDescription.trim() || undefined, assetType }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to register AI system');
      }
      const asset = await res.json();
      setAssetId(asset.id);
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function handleStep3Next() {
    setError(null);
    if (!targetEndpoint.trim()) {
      setError('Endpoint URL is required');
      return;
    }
    if (!ownershipConfirmed) {
      setError('You must confirm you own/are authorized to test this endpoint');
      return;
    }
    // Create order if not exists
    setLoading(true);
    try {
      let currentOrderId = orderId;
      if (!currentOrderId) {
        const orderRes = await fetch('/api/v1/audit-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ organizationId: orgId, assetId }),
        });
        if (!orderRes.ok) {
          const err = await orderRes.json();
          throw new Error(err.error || 'Failed to create audit order');
        }
        const order = await orderRes.json();
        currentOrderId = order.id;
        setOrderId(order.id);
      }

      // Save target config
      const patchRes = await fetch(`/api/v1/audit-orders/${currentOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: {
            targetType: assetType,
            endpoint: targetEndpoint.trim(),
            environment: targetEnvironment,
            ownershipConfirmed,
          },
        }),
      });
      if (!patchRes.ok) {
        const err = await patchRes.json();
        throw new Error(err.error || 'Failed to save target');
      }
      setStep(4);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function handleStep4Next() {
    setError(null);
    if (permittedTests.length === 0) {
      setError('Select at least one test category');
      return;
    }
    if (!emergencyContact.trim()) {
      setError('Emergency contact is required');
      return;
    }
    if (!roeAgreed) {
      setError('You must review and agree to the Rules of Engagement');
      return;
    }
    setLoading(true);
    try {
      const patchRes = await fetch(`/api/v1/audit-orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roe: {
            permittedTests,
            prohibitedActions: ['modify_data', 'delete_data', 'create_accounts', 'exfiltrate_real_pii'],
            testingWindowStart: testingWindowStart || null,
            testingWindowEnd: testingWindowEnd || null,
            emergencyContact: emergencyContact.trim(),
            authorizedEndpoints: [targetEndpoint.trim()],
            rateLimit: 10,
            signRoe: true,
          },
        }),
      });
      if (!patchRes.ok) {
        const err = await patchRes.json();
        throw new Error(err.error || 'Failed to save Rules of Engagement');
      }
      setStep(5);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckout() {
    setError(null);
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/v1/billing/checkout-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditOrderId: orderId, organizationId: orgId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create checkout session');
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      setCheckoutLoading(false);
    }
  }

  const selectedOrg = existingOrgs.find(o => o.id === selectedOrgId);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', marginBottom: '8px' }}>
          <Shield size={28} color="var(--primary)" />
          <h1 style={{ fontSize: '28px', fontWeight: 900, fontFamily: 'var(--font-display)', background: 'linear-gradient(135deg, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Aegis Verified Launch Assessment
          </h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          A real, authorized AI security assessment with cryptographic evidence and a signed Security Passport.
        </p>
      </div>

      {/* Step Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '32px', overflowX: 'auto', width: '100%', maxWidth: '680px' }}>
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isCompleted = step > s.num;
          const isCurrent = step === s.num;
          return (
            <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: i < STEPS.length - 1 ? '1' : 'auto' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
                borderRadius: '99px',
                background: isCompleted ? 'rgba(16,185,129,0.1)' : isCurrent ? 'var(--primary-dim)' : 'var(--bg-elevated)',
                border: `1px solid ${isCompleted ? '#10b981' : isCurrent ? 'var(--primary)' : 'var(--border)'}`,
                whiteSpace: 'nowrap',
              }}>
                {isCompleted
                  ? <CheckCircle size={13} color="#10b981" />
                  : <Icon size={13} color={isCurrent ? 'var(--primary)' : 'var(--text-muted)'} />}
                <span style={{ fontSize: '11px', fontWeight: 600, color: isCompleted ? '#10b981' : isCurrent ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: '1px', background: isCompleted ? '#10b981' : 'var(--border)', minWidth: '8px' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Card */}
      <div className="glass-card" style={{ width: '100%', maxWidth: '680px', padding: '32px' }}>
        {error && (
          <div style={{ marginBottom: '20px', padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '13px' }}>
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {/* STEP 1: Organization */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>Select or Create Organization</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>The assessment will be associated with this organization.</p>

            {existingOrgs.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>EXISTING ORGANIZATIONS</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {existingOrgs.map(org => (
                    <button
                      key={org.id}
                      id={`org-select-${org.id}`}
                      onClick={() => { setSelectedOrgId(org.id); setNewOrgName(''); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
                        borderRadius: 'var(--radius-sm)', border: `1px solid ${selectedOrgId === org.id ? 'var(--primary)' : 'var(--border)'}`,
                        background: selectedOrgId === org.id ? 'var(--primary-dim)' : 'var(--bg-elevated)',
                        cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.15s',
                      }}
                    >
                      <Building2 size={15} color={selectedOrgId === org.id ? 'var(--primary)' : 'var(--text-muted)'} />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: selectedOrgId === org.id ? 'var(--primary)' : 'var(--text-primary)' }}>{org.display_name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '8px' }}>
              <label htmlFor="new-org-name" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>OR CREATE NEW ORGANIZATION</label>
              <input
                id="new-org-name"
                type="text"
                value={newOrgName}
                onChange={e => { setNewOrgName(e.target.value); if (e.target.value) setSelectedOrgId(null); }}
                placeholder="Acme Corp"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: `1px solid ${!selectedOrgId && newOrgName ? 'var(--primary)' : 'var(--border)'}`, background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <button
              id="step1-next"
              onClick={handleStep1Next}
              disabled={loading}
              style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '6px', padding: '11px 20px', borderRadius: 'var(--radius-sm)', background: 'var(--primary)', color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : null}
              Continue
              <ChevronRight size={13} />
            </button>
          </div>
        )}

        {/* STEP 2: AI System */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>Register AI System</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>Describe the AI system being assessed.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label htmlFor="asset-name" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>SYSTEM NAME *</label>
                <input id="asset-name" type="text" value={assetName} onChange={e => setAssetName(e.target.value)} placeholder="Customer Support AI Agent" style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label htmlFor="asset-desc" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>DESCRIPTION</label>
                <textarea id="asset-desc" value={assetDescription} onChange={e => setAssetDescription(e.target.value)} placeholder="Briefly describe what this AI system does..." rows={3} style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>SYSTEM TYPE *</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {(['openai_compatible', 'mcp_server'] as const).map(type => (
                    <button key={type} id={`type-${type}`} onClick={() => setAssetType(type)} style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)', border: `1px solid ${assetType === type ? 'var(--primary)' : 'var(--border)'}`, background: assetType === type ? 'var(--primary-dim)' : 'var(--bg-elevated)', cursor: 'pointer', color: assetType === type ? 'var(--primary)' : 'var(--text-secondary)', fontSize: '12px', fontWeight: 600 }}>
                      {type === 'openai_compatible' ? 'OpenAI-Compatible REST API' : 'MCP Server'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={() => setStep(1)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '10px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' }}>
                <ChevronLeft size={13} /> Back
              </button>
              <button id="step2-next" onClick={handleStep2Next} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '11px 20px', borderRadius: 'var(--radius-sm)', background: 'var(--primary)', color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600, opacity: loading ? 0.7 : 1 }}>
                {loading ? <Loader2 size={13} className="animate-spin" /> : null} Continue <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Target Config */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>Target Configuration</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>Provide the endpoint Aegis will test. Credentials are never stored in plaintext.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label htmlFor="target-endpoint" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>ENDPOINT URL *</label>
                <input id="target-endpoint" type="url" value={targetEndpoint} onChange={e => setTargetEndpoint(e.target.value)} placeholder={assetType === 'openai_compatible' ? 'https://api.yourcompany.com/v1' : 'https://mcp.yourcompany.com'} style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', fontFamily: 'var(--font-mono)', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>ENVIRONMENT</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['production', 'staging', 'development'] as const).map(env => (
                    <button key={env} onClick={() => setTargetEnvironment(env)} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)', border: `1px solid ${targetEnvironment === env ? 'var(--primary)' : 'var(--border)'}`, background: targetEnvironment === env ? 'var(--primary-dim)' : 'var(--bg-elevated)', cursor: 'pointer', color: targetEnvironment === env ? 'var(--primary)' : 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, textTransform: 'capitalize' }}>
                      {env}
                    </button>
                  ))}
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                <input id="ownership-confirm" type="checkbox" checked={ownershipConfirmed} onChange={e => setOwnershipConfirmed(e.target.checked)} style={{ marginTop: '2px', accentColor: 'var(--primary)' }} />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  I confirm I own or am authorized to conduct security testing on this endpoint. I understand that tests will send real HTTP requests.
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={() => setStep(2)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '10px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' }}><ChevronLeft size={13} /> Back</button>
              <button id="step3-next" onClick={handleStep3Next} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '11px 20px', borderRadius: 'var(--radius-sm)', background: 'var(--primary)', color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600, opacity: loading ? 0.7 : 1 }}>
                {loading ? <Loader2 size={13} className="animate-spin" /> : null} Continue <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Scope & RoE */}
        {step === 4 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>Assessment Scope & Rules of Engagement</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>Define what Aegis is authorized to test. This document will be cryptographically signed.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>SELECT TEST CATEGORIES *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {TEST_CATEGORIES.map(cat => (
                    <label key={cat.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: `1px solid ${permittedTests.includes(cat.id) ? 'var(--primary)' : 'var(--border)'}`, background: permittedTests.includes(cat.id) ? 'var(--primary-dim)' : 'var(--bg-elevated)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={permittedTests.includes(cat.id)} onChange={e => {
                        if (e.target.checked) setPermittedTests(p => [...p, cat.id]);
                        else setPermittedTests(p => p.filter(t => t !== cat.id));
                      }} style={{ marginTop: '2px', accentColor: 'var(--primary)', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{cat.label}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{cat.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label htmlFor="window-start" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>TESTING WINDOW START</label>
                  <input id="window-start" type="datetime-local" value={testingWindowStart} onChange={e => setTestingWindowStart(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label htmlFor="window-end" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>TESTING WINDOW END</label>
                  <input id="window-end" type="datetime-local" value={testingWindowEnd} onChange={e => setTestingWindowEnd(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div>
                <label htmlFor="emergency-contact" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>EMERGENCY CONTACT * <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(email or phone — if testing must stop immediately)</span></label>
                <input id="emergency-contact" type="text" value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} placeholder="security@yourcompany.com or +1 555-0100" style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-elevated)', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>Rules of Engagement — Standard Terms</strong>
                Aegis will conduct authorized security testing ONLY against the registered endpoint within the defined testing window. Rate limiting will not exceed 10 requests/minute. Aegis will NOT: modify or delete data, create real accounts, exfiltrate production PII, or take actions outside the permitted test categories. All test payloads are synthetic. Evidence is hashed before storage. You may halt testing at any time by contacting your emergency contact.
              </div>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                <input id="roe-agree" type="checkbox" checked={roeAgreed} onChange={e => setRoeAgreed(e.target.checked)} style={{ marginTop: '2px', accentColor: 'var(--primary)' }} />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  I have read and agree to the Rules of Engagement above. I authorize Aegis to conduct the selected tests against the registered endpoint. I understand this RoE will be cryptographically signed and stored as part of the audit record.
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={() => setStep(3)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '10px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' }}><ChevronLeft size={13} /> Back</button>
              <button id="step4-next" onClick={handleStep4Next} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '11px 20px', borderRadius: 'var(--radius-sm)', background: 'var(--primary)', color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600, opacity: loading ? 0.7 : 1 }}>
                {loading ? <Loader2 size={13} className="animate-spin" /> : null} Sign RoE & Continue <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Payment */}
        {step === 5 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>Select Assessment & Pay</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>Review your assessment details before proceeding to secure payment.</p>

            <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700 }}>Aegis Verified Launch Assessment</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>One AI system · Real authorized testing · Signed Security Passport</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--primary)' }}>$2,999</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>one-time</div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>INCLUDED</div>
                {[
                  'Real tests against your authorized endpoint',
                  `${permittedTests.length} selected test categories (${permittedTests.length} categories)`,
                  'Cryptographic evidence hashes for every test',
                  'Aegis reviewer analysis and findings review',
                  'PDF security assessment report',
                  'Signed Security Passport (after reviewer approval)',
                  'Public verification URL',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <CheckCircle size={11} color="#10b981" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Assessment Summary</div>
              <div>Organization: <strong>{selectedOrg?.display_name ?? orgId}</strong></div>
              <div>Asset: <strong>{assetName}</strong> ({assetType === 'openai_compatible' ? 'OpenAI-compatible' : 'MCP Server'})</div>
              <div>Endpoint: <code style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{targetEndpoint}</code></div>
              <div>Test categories: <strong>{permittedTests.length}</strong></div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setStep(4)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '10px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' }}><ChevronLeft size={13} /> Back</button>
              <button
                id="checkout-button"
                onClick={handleCheckout}
                disabled={checkoutLoading}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px 24px', borderRadius: 'var(--radius-sm)', background: checkoutLoading ? 'var(--primary-dim)' : 'linear-gradient(135deg, var(--primary), var(--accent))', color: 'white', border: 'none', cursor: checkoutLoading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 700 }}
              >
                {checkoutLoading ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
                {checkoutLoading ? 'Redirecting to Stripe...' : 'Pay Securely via Stripe'}
                {!checkoutLoading && <ExternalLink size={12} />}
              </button>
            </div>
            <p style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>Payments processed securely by Stripe. Aegis never stores your card details.</p>
          </div>
        )}
      </div>
    </div>
  );
}
