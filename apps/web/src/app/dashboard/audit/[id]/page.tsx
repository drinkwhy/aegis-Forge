'use client';
import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Loader2, ArrowRight } from 'lucide-react';

const STAGES = [
  { id: 'connect', label: 'Connect AI' },
  { id: 'install_agent', label: 'Install AegisAgent' },
  { id: 'connection_verified', label: 'Connection Verified' },
  { id: 'authorize', label: 'Authorize Assessment' },
  { id: 'compliance_reqs', label: 'Select Compliance Requirements' },
  { id: 'pay', label: 'Pay' },
  { id: 'attack_tests', label: 'Aegis Runs Attack Tests' },
  { id: 'generates_controls', label: 'Aegis Generates Controls' },
  { id: 'approves_protections', label: 'Customer Approves Protections' },
  { id: 'replays_tests', label: 'Aegis Replays Tests' },
  { id: 'compliance_evaluated', label: 'Compliance Evaluated' },
  { id: 'reviewer_approval', label: 'Reviewer Approval' },
  { id: 'passport_issued', label: 'Security Passport Issued' },
  { id: 'continuous_monitoring', label: 'Continuous Monitoring Begins' },
];

export default function AuditTimeline({ params }: { params: { id: string } }) {
  const [currentStage, setCurrentStage] = useState(1); // Mocking 'Install AegisAgent'
  const [progress, setProgress] = useState(45);

  useEffect(() => {
    // Mock progress update
    const timer = setInterval(() => {
      setProgress(p => (p >= 100 ? 100 : p + 5));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="gradient-text" style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>
        Aegis Security Assessment
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        Case ID: {params.id}
      </p>

      <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', padding: '32px', border: '1px solid var(--border)' }}>
        {STAGES.map((stage, index) => {
          const isComplete = index < currentStage;
          const isActive = index === currentStage;
          
          return (
            <div key={stage.id} style={{ display: 'flex', gap: '16px', marginBottom: index === STAGES.length - 1 ? '0' : '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                <div style={{ 
                  background: isComplete ? 'var(--primary)' : isActive ? 'var(--bg-surface)' : 'transparent',
                  border: isActive ? '2px solid var(--primary)' : 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                }}>
                  {isComplete ? <CheckCircle2 size={24} color="var(--bg-base)" fill="var(--primary)" /> : 
                   isActive ? <Circle size={12} fill="var(--primary)" color="var(--primary)" /> : 
                   <Circle size={24} color="var(--border)" />}
                </div>
                {index < STAGES.length - 1 && (
                  <div style={{
                    position: 'absolute',
                    top: '24px',
                    width: '2px',
                    height: 'calc(100% + 24px)',
                    background: isComplete ? 'var(--primary)' : 'var(--border)',
                    zIndex: 1,
                  }} />
                )}
              </div>
              
              <div style={{ flex: 1, paddingBottom: '16px' }}>
                <div style={{ fontSize: '16px', fontWeight: isActive ? 700 : 500, color: isComplete || isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {stage.label}
                </div>
                
                {isActive && stage.id === 'install_agent' && (
                  <div style={{ marginTop: '16px', background: 'var(--bg-base)', padding: '24px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 700 }}>Connect Your AI</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                      <button style={{ flex: 1, padding: '12px', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer' }}>AegisAgent SDK</button>
                      <button style={{ flex: 1, padding: '12px', background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer' }}>API Gateway</button>
                      <button style={{ flex: 1, padding: '12px', background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer' }}>MCP Proxy</button>
                    </div>
                    <div style={{ background: '#0d1117', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid #30363d', fontFamily: 'monospace', fontSize: '13px', color: '#e6edf3' }}>
                      <div style={{ color: '#8b949e', marginBottom: '8px' }}># 1. Install the SDK</div>
                      <div>npm install @aegis/agent</div>
                      <div style={{ color: '#8b949e', margin: '16px 0 8px 0' }}># 2. Initialize in your application</div>
                      <div style={{ color: '#ff7b72' }}>import</div> <div style={{ display: 'inline' }}>{`{ AegisAgent }`}</div> <div style={{ color: '#ff7b72' }}>from</div> <div style={{ color: '#a5d6ff' }}>'@aegis/agent'</div>;
                      <br/><br/>
                      <div style={{ color: '#ff7b72' }}>const</div> agent = <div style={{ color: '#ff7b72' }}>new</div> <div style={{ color: '#d2a8ff' }}>AegisAgent</div>({`{`}
                      <br/>  organizationId: <div style={{ color: '#a5d6ff' }}>'org_...7f9'</div>,
                      <br/>  assetId: <div style={{ color: '#a5d6ff' }}>'ast_...b42'</div>,
                      <br/>  token: process.env.AEGIS_TOKEN
                      <br/>{`}`});
                    </div>
                    <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px' }}>
                      <Loader2 size={14} className="animate-spin" /> Waiting for heartbeat...
                    </div>
                  </div>
                )}
                
                {isActive && stage.id === 'attack_tests' && (
                  <div style={{ marginTop: '16px', background: 'var(--bg-base)', padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600 }}>Running Security Tests</span>
                      <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Estimated completion: 18 minutes</span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                      <ProgressRow label="Prompt Injection" value={100} />
                      <ProgressRow label="Tool Misuse" value={80} />
                      <ProgressRow label="Policy Analysis" value={45} />
                      <ProgressRow label="Evidence Validation" value={0} />
                    </div>
                  </div>
                )}

                {isActive && stage.id === 'compliance_evaluated' && (
                  <div style={{ marginTop: '16px', background: 'var(--bg-base)', padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600 }}>Compliance Readiness</span>
                      <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Analyzing findings...</span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                      <ProgressRow label="EU AI Act" value={82} />
                      <ProgressRow label="ISO/IEC 42001" value={76} />
                      <ProgressRow label="NIST AI RMF" value={91} />
                      <ProgressRow label="SOC 2 AI Controls" value={87} />
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px', fontSize: '12px' }}>
                        <span style={{ color: 'var(--error)' }}>3 Critical Gaps</span>
                        <span style={{ color: 'var(--warning)' }}>7 Evidence Gaps</span>
                        <span style={{ color: 'var(--info)' }}>12 Recommendations</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProgressRow({ label, value }: { label: string, value: number }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div style={{ width: '100%', height: '6px', background: 'var(--bg-surface)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: value === 100 ? 'var(--success)' : 'var(--primary)', transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}
