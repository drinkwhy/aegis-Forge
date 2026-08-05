'use client';
import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { StatCard } from '@/components/ui/StatCard';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import { 
  Activity, 
  ShieldAlert, 
  Target, 
  TrendingUp, 
  Play, 
  CheckCircle2, 
  ShieldCheck, 
  Terminal, 
  Server,
  Layers,
  Cpu,
  ArrowRight,
  Database
} from 'lucide-react';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Finding {
  id: string;
  title: string;
  severity: string;
  agentName?: string;
  created_at: string;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  tests_run: number;
  total_tests: number;
  created_at: string;
}

interface LoopStep {
  step: number;
  title: string;
  service: string;
  status: 'idle' | 'running' | 'complete' | 'blocked';
  detail: string;
}

const INITIAL_LOOP_STEPS: LoopStep[] = [
  { step: 1, title: 'Agent & Tool Registration', service: 'Control Plane', status: 'idle', detail: 'Registering Enterprise Financial Advisor Agent & SQL Tool' },
  { step: 2, title: 'Runtime Tool Call Interception', service: 'aegisagent-sdk', status: 'idle', detail: 'Intercepting outbound SQL query with session honeyfact lure' },
  { step: 3, title: 'Security Event Detection', service: 'Proxy Gateway', status: 'idle', detail: 'Honeyfact exfiltration detected in payload (Severity: CRITICAL)' },
  { step: 4, title: 'RoE Signature Verification', service: 'roe-validator', status: 'idle', detail: 'Cryptographic RoE signed — CFAA Safe Harbor Active' },
  { step: 5, title: 'gVisor Microcontainer Provisioning', service: 'sandbox-manager', status: 'idle', detail: 'Spawning isolated gVisor container (net-none, cap-drop)' },
  { step: 6, title: 'Adversarial Payload Mutation', service: 'attack-generator', status: 'idle', detail: 'Synthesizing mutated system prompt override attack vector' },
  { step: 7, title: 'Canary Verification & Evaluation', service: 'evaluator-agent', status: 'idle', detail: 'HMAC signature confirmed; GPT-4o confidence 0.98 (Breach Confirmed)' },
  { step: 8, title: 'FAIR-AI Risk Scoring & Graphing', service: 'analysis-engine', status: 'idle', detail: 'Calculated FAIR Risk Score: 8.9/10.0; Neo4j attack path mapped' },
  { step: 9, title: 'Defensive Sentinel Policy Synthesis', service: 'remediation-agent', status: 'idle', detail: 'Drafting Sentinel policy: FSM transition DRAFT → VALIDATED → STAGED' },
  { step: 10, title: 'Runtime Gateway Active Enforcement', service: 'Control Plane', status: 'idle', detail: 'Sentinel deployed to gateway: Repeat attack vector 100% BLOCKED' },
  { step: 11, title: 'Attack Corpus Compounding', service: 'attack-corpus', status: 'idle', detail: 'Regression entry mcp-hf-001 appended to permanent build-gate' }
];

export default function DashboardPage() {
  const { data: findingsData, mutate: mutateFindings } = useSWR('/api/v1/findings', fetcher);
  const { data: campaignsData } = useSWR('/api/v1/campaigns', fetcher);

  const findings: Finding[] = findingsData?.findings || [];
  const campaigns: Campaign[] = campaignsData?.campaigns || [];

  // Live simulation state
  const [loopSteps, setLoopSteps] = useState<LoopStep[]>(INITIAL_LOOP_STEPS);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [simulationComplete, setSimulationComplete] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'simulation'>('overview');

  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeStepIndex]);

  const runHardeningSimulation = () => {
    setIsSimulating(true);
    setSimulationComplete(false);
    setActiveStepIndex(0);

    setLoopSteps(prev => prev.map(s => ({ ...s, status: 'idle' })));

    let currentStep = 0;
    const interval = setInterval(() => {
      setLoopSteps(prev => {
        const nextSteps = prev.map((s, idx) => {
          if (idx === currentStep) return { ...s, status: 'running' as const };
          if (idx < currentStep) return { ...s, status: 'complete' as const };
          return s;
        });
        return nextSteps;
      });

      setActiveStepIndex(currentStep);
      currentStep++;

      if (currentStep >= INITIAL_LOOP_STEPS.length) {
        clearInterval(interval);
        setLoopSteps(prev => prev.map(s => ({ ...s, status: 'complete' as const })));
        setIsSimulating(false);
        setSimulationComplete(true);
        mutateFindings(); // Refresh findings table
      }
    }, 1500);
  };

  // Determine active canvas nodes based on current simulation step
  const getCanvasHighlight = () => {
    if (!isSimulating || activeStepIndex === null) return { agent: false, gateway: false, sandbox: false, db: false };
    const step = activeStepIndex + 1;
    return {
      agent: step >= 1 && step <= 2 || step === 6,
      gateway: step === 3 || step === 4 || step === 10,
      sandbox: step >= 5 && step <= 9 || step === 11,
      db: step === 2 || step === 7
    };
  };

  const canvasHighlight = getCanvasHighlight();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in">
      
      {/* Top Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Operations Control Deck
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Real-time continuous hardening diagnostics, telemetry, and vulnerability logs.
          </p>
        </div>

        <div className="glass" style={{ display: 'flex', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
          <button 
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '6px 16px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'overview' ? 'var(--cyan)' : 'transparent',
              color: activeTab === 'overview' ? '#050814' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            HUD Overview
          </button>
          <button 
            onClick={() => setActiveTab('simulation')}
            style={{
              padding: '6px 16px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'simulation' ? 'var(--cyan)' : 'transparent',
              color: activeTab === 'simulation' ? '#050814' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            Hardening Simulator
          </button>
        </div>
      </div>

      {/* Main Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        <StatCard title="Validation Pass Rate" value="100%" change="+0.0%" icon={ShieldCheck} />
        <StatCard title="Active Vulnerabilities" value={String(findings.length)} change="-1 this week" icon={ShieldAlert} />
        <StatCard title="Hardening Campaigns" value={String(campaigns.length)} change="Continuous" icon={Target} />
        <StatCard title="Gateway Checks/Min" value="1,842" change="+12%" icon={Activity} />
      </div>

      {activeTab === 'overview' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px' }}>
          
          {/* Left Grid: Interactive Threat Canvas & Tables */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Interactive Threat Canvas Card */}
            <div className="glass-card glow-cyan" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '16px' }}>
                Threat Interaction Canvas
              </h3>
              
              <div style={{ display: 'flex', justifyContent: 'center', background: '#040713', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', padding: '24px 0' }}>
                <svg width="550" height="220" viewBox="0 0 550 220" style={{ overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="cyan-primary" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--cyan)" />
                      <stop offset="100%" stopColor="var(--primary)" />
                    </linearGradient>
                  </defs>

                  {/* Connective Paths */}
                  <path d="M 100,110 L 250,50" stroke={canvasHighlight.gateway ? 'var(--cyan)' : 'var(--border)'} strokeWidth={canvasHighlight.gateway ? '3' : '1.5'} strokeDasharray={canvasHighlight.gateway ? "5, 5" : "none"} fill="none" style={{ transition: 'all 0.3s' }} />
                  <path d="M 100,110 L 250,170" stroke={canvasHighlight.sandbox ? 'var(--cyan)' : 'var(--border)'} strokeWidth={canvasHighlight.sandbox ? '3' : '1.5'} strokeDasharray={canvasHighlight.sandbox ? "5, 5" : "none"} fill="none" style={{ transition: 'all 0.3s' }} />
                  <path d="M 250,50 L 450,110" stroke={canvasHighlight.gateway ? 'var(--cyan)' : 'var(--border)'} strokeWidth={canvasHighlight.gateway ? '3' : '1.5'} fill="none" style={{ transition: 'all 0.3s' }} />
                  <path d="M 250,170 L 450,110" stroke={canvasHighlight.sandbox ? 'var(--cyan)' : 'var(--border)'} strokeWidth={canvasHighlight.sandbox ? '3' : '1.5'} fill="none" style={{ transition: 'all 0.3s' }} />

                  {/* Node 1: AI Agent */}
                  <circle cx="100" cy="110" r="30" fill="#0b1126" stroke={canvasHighlight.agent ? 'var(--cyan)' : 'var(--primary)'} strokeWidth="2.5" style={{ transition: 'all 0.3s', filter: canvasHighlight.agent ? 'drop-shadow(0 0 10px var(--cyan))' : 'none' }} />
                  <foreignObject x="80" y="95" width="40" height="30">
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <Cpu size={18} color={canvasHighlight.agent ? 'var(--cyan)' : 'var(--text-secondary)'} />
                    </div>
                  </foreignObject>
                  <text x="100" y="160" textAnchor="middle" fill="var(--text-secondary)" fontSize="11" fontWeight="600" fontFamily="var(--font-display)">AI Agent Runtime</text>

                  {/* Node 2: Proxy Gateway */}
                  <circle cx="250" cy="50" r="30" fill="#0b1126" stroke={canvasHighlight.gateway ? 'var(--cyan)' : 'var(--border)'} strokeWidth="2.5" style={{ transition: 'all 0.3s', filter: canvasHighlight.gateway ? 'drop-shadow(0 0 10px var(--cyan))' : 'none' }} />
                  <foreignObject x="230" y="35" width="40" height="30">
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <Layers size={18} color={canvasHighlight.gateway ? 'var(--cyan)' : 'var(--text-secondary)'} />
                    </div>
                  </foreignObject>
                  <text x="250" y="10" textAnchor="middle" fill="var(--text-secondary)" fontSize="11" fontWeight="600" fontFamily="var(--font-display)">Proxy Gateway</text>

                  {/* Node 3: gVisor Sandbox */}
                  <circle cx="250" cy="170" r="30" fill="#0b1126" stroke={canvasHighlight.sandbox ? 'var(--cyan)' : 'var(--border)'} strokeWidth="2.5" style={{ transition: 'all 0.3s', filter: canvasHighlight.sandbox ? 'drop-shadow(0 0 10px var(--cyan))' : 'none' }} />
                  <foreignObject x="230" y="155" width="40" height="30">
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <Server size={18} color={canvasHighlight.sandbox ? 'var(--cyan)' : 'var(--text-secondary)'} />
                    </div>
                  </foreignObject>
                  <text x="250" y="215" textAnchor="middle" fill="var(--text-secondary)" fontSize="11" fontWeight="600" fontFamily="var(--font-display)">gVisor Sandbox</text>

                  {/* Node 4: Database */}
                  <circle cx="450" cy="110" r="30" fill="#0b1126" stroke={canvasHighlight.db ? 'var(--cyan)' : 'var(--primary)'} strokeWidth="2.5" style={{ transition: 'all 0.3s', filter: canvasHighlight.db ? 'drop-shadow(0 0 10px var(--cyan))' : 'none' }} />
                  <foreignObject x="430" y="95" width="40" height="30">
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <Database size={18} color={canvasHighlight.db ? 'var(--cyan)' : 'var(--text-secondary)'} />
                    </div>
                  </foreignObject>
                  <text x="450" y="160" textAnchor="middle" fill="var(--text-secondary)" fontSize="11" fontWeight="600" fontFamily="var(--font-display)">Acme Database</text>
                </svg>
              </div>
            </div>

            {/* Live Open Vulnerabilities Table */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                  Active Security Findings
                </h3>
                <Link href="/dashboard/findings" style={{ fontSize: '13px', color: 'var(--cyan)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                  View All Findings <ArrowRight size={14} />
                </Link>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {findings.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    No active security findings. Platform is clean.
                  </div>
                ) : (
                  findings.map((f) => (
                    <Link 
                      key={f.id}
                      href={`/dashboard/findings/${f.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 18px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255,255,255,0.01)',
                        border: '1px solid var(--border)',
                        textDecoration: 'none',
                        color: 'var(--text-primary)',
                        transition: 'all 0.2s'
                      }}
                      className="glass"
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>{f.title}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Agent: {f.agentName || 'Wealthfront Agent'}</span>
                      </div>
                      <SeverityBadge severity={f.severity} />
                    </Link>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Right Grid: Hardening Campaigns */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '16px' }}>
                Active Campaigns
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {campaigns.length === 0 ? (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center' }}>
                    No campaigns running.
                  </div>
                ) : (
                  campaigns.map((c) => (
                    <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{c.name}</span>
                        <span style={{ 
                          fontSize: '10px', 
                          background: c.status === 'RUNNING' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
                          color: c.status === 'RUNNING' ? 'var(--cyan)' : 'var(--success)', 
                          padding: '2px 8px', 
                          borderRadius: '4px',
                          fontWeight: 700
                        }} className="mono">
                          {c.status}
                        </span>
                      </div>
                      
                      {/* Custom Progress Bar */}
                      <div style={{ height: '6px', background: 'var(--bg-surface)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${(c.tests_run / c.total_tests) * 100}%`, 
                          height: '100%', 
                          background: 'linear-gradient(90deg, var(--cyan), var(--primary))',
                          borderRadius: '3px'
                        }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <span>Progress: {c.tests_run}/{c.total_tests} Runs</span>
                        <span>{Math.round((c.tests_run / c.total_tests) * 100)}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Simulation Trigger */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '8px' }}>
                Trigger Diagnostics
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.4 }}>
                Simulate a complete prompt injection and microcontainer sandboxing bypass scenario.
              </p>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setActiveTab('simulation');
                  runHardeningSimulation();
                }}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Play size={14} fill="#050814" /> Run Hardening Simulator
              </button>
            </div>

          </div>

        </div>
      ) : (
        /* Hardening Simulator console Tab */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px' }} className="animate-fade-in">
          
          {/* Left panel: Simulator step list */}
          <div className="glass-card" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                Adversarial Hardening Pipeline
              </h3>
              <button 
                className="btn btn-primary"
                onClick={runHardeningSimulation}
                disabled={isSimulating}
              >
                <Play size={12} fill="#050814" /> {isSimulating ? 'Simulating Run...' : 'Start Simulator'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '15px', top: '24px', bottom: '24px', width: '2px', background: 'var(--border)' }} />
              
              {loopSteps.map((step, idx) => {
                const isCurrent = activeStepIndex === idx;
                const isComplete = step.status === 'complete';
                
                return (
                  <div key={step.step} style={{ display: 'flex', gap: '20px', opacity: isCurrent || isComplete ? 1 : 0.4, transition: 'all 0.3s' }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      background: isCurrent ? 'var(--cyan)' : isComplete ? 'var(--success)' : 'var(--bg-surface)', 
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: isCurrent ? '#050814' : isComplete ? '#050814' : 'var(--text-secondary)',
                      flexShrink: 0,
                      position: 'relative',
                      zIndex: 1
                    }}>
                      {step.step}
                    </div>
                    
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: 600 }}>{step.title}</h4>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>[{step.service}]</span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                        {step.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel: Terminal execution read-out */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Terminal Window Card */}
            <div className="glass-card" style={{ padding: '24px', background: '#040713', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
                <Terminal size={14} color="var(--cyan)" />
                <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}>
                  HARDENING STACK TERMINAL
                </span>
              </div>

              <div style={{ 
                flex: 1, 
                fontFamily: 'var(--font-mono)', 
                fontSize: '12px', 
                color: 'var(--text-secondary)', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '8px',
                overflowY: 'auto',
                maxHeight: '400px'
              }}>
                <div>[SYSTEM] Hardening diagnostic terminal online.</div>
                {loopSteps.slice(0, activeStepIndex !== null ? activeStepIndex + 1 : 0).map((step, idx) => (
                  <div key={idx} style={{ lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--cyan)' }}>[{step.service.toUpperCase()}]</span> {step.detail}
                  </div>
                ))}
                {simulationComplete && (
                  <div style={{ color: 'var(--success)', marginTop: '12px', fontWeight: 600 }}>
                    [EVALUATOR] Simulation run complete. Vulnerability ingested. Defensive Sentinel policy deployed and verified.
                  </div>
                )}
                <div ref={terminalEndRef} />
              </div>
            </div>

            {/* Interaction Diagram Card */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Interaction Trace highlights
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                As steps run, notice how data routes change. Standard tool calls go to the **Proxy Gateway**, while mutated red-team payloads are spun up in the isolated **gVisor Sandbox** to prevent escape.
              </p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
