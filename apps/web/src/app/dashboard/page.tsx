'use client';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { StatCard } from '@/components/ui/StatCard';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import dynamic from 'next/dynamic';

const IntelligenceAnatomy3D = dynamic(
  () => import('@/components/3d/IntelligenceAnatomy3D').then((m) => m.IntelligenceAnatomy3D),
  { 
    ssr: false, 
    loading: () => (
      <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
        Loading 3D Anatomy Engine...
      </div>
    ) 
  }
);
import { 
  Activity, 
  ShieldAlert, 
  Target, 
  TrendingUp, 
  Inbox, 
  Play, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Cpu, 
  Lock, 
  Layers, 
  Terminal, 
  ArrowRight,
  Server,
  Key
} from 'lucide-react';

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
  { step: 6, title: 'Adversarial Payload Mutation', service: 'attack-generator', serviceName: 'Claude 3.5', status: 'idle', detail: 'Synthesizing mutated system prompt override attack vector' },
  { step: 7, title: 'Canary Verification & Evaluation', service: 'evaluator-agent', serviceName: 'GPT-4o', status: 'idle', detail: 'HMAC signature confirmed; GPT-4o confidence 0.98 (Breach Confirmed)' },
  { step: 8, title: 'FAIR-AI Risk Scoring & Graphing', service: 'analysis-engine', status: 'idle', detail: 'Calculated FAIR Risk Score: 8.9/10.0; Neo4j attack path mapped' },
  { step: 9, title: 'Defensive Sentinel Policy Synthesis', service: 'remediation-agent', status: 'idle', detail: 'Drafting Sentinel policy: FSM transition DRAFT → VALIDATED → STAGED' },
  { step: 10, title: 'Runtime Gateway Active Enforcement', service: 'Control Plane', status: 'idle', detail: 'Sentinel deployed to gateway: Repeat attack vector 100% BLOCKED' },
  { step: 11, title: 'Attack Corpus Compounding', service: 'attack-corpus', status: 'idle', detail: 'Regression entry mcp-hf-001 appended to permanent build-gate' }
] as any[];

export default function DashboardPage() {
  const { data: findingsData, error: findingsErr } = useSWR('/api/v1/findings', fetcher);
  const { data: campaignsData, error: campaignsErr } = useSWR('/api/v1/campaigns', fetcher);

  const findings: Finding[] = findingsData?.findings || [];
  const campaigns: Campaign[] = campaignsData?.campaigns || [];

  // Live simulation state
  const [loopSteps, setLoopSteps] = useState<LoopStep[]>(INITIAL_LOOP_STEPS);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [simulationComplete, setSimulationComplete] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'anatomy' | 'simulator'>('overview');

  const runHardeningSimulation = () => {
    setIsSimulating(true);
    setSimulationComplete(false);
    setActiveStepIndex(0);

    setLoopSteps(prev => prev.map(s => ({ ...s, status: 'idle' })));

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < INITIAL_LOOP_STEPS.length) {
        setActiveStepIndex(currentStep);
        setLoopSteps(prev => prev.map((s, idx) => {
          if (idx < currentStep) return { ...s, status: 'complete' };
          if (idx === currentStep) return { ...s, status: 'running' };
          return { ...s, status: 'idle' };
        }));
        currentStep++;
      } else {
        clearInterval(interval);
        setLoopSteps(prev => prev.map(s => ({ ...s, status: 'complete' })));
        setIsSimulating(false);
        setSimulationComplete(true);
        setActiveStepIndex(null);
      }
    }, 900);
  };

  const activeCampaigns = campaigns.filter(c => c.status.toLowerCase() === 'running').length;
  const criticalFindings = findings.filter(f => f.severity.toLowerCase() === 'critical').length;
  const totalAgents = findings.reduce((acc, curr) => {
    if (curr.agentName && !acc.includes(curr.agentName)) acc.push(curr.agentName);
    return acc;
  }, [] as string[]).length || 4;

  const stats = [
    { title: 'Agents Monitored', value: String(totalAgents), change: '100% Protected', changeType: 'up' as const, icon: Target },
    { title: 'Active Sandboxes', value: String(isSimulating ? activeCampaigns + 1 : activeCampaigns || 1), change: 'gVisor Isolated', changeType: 'up' as const, icon: Server },
    { title: 'Open Critical Breaches', value: simulationComplete ? '0 (Hardened)' : String(criticalFindings || 1), change: simulationComplete ? 'Resolved' : 'Requires Action', changeType: simulationComplete ? ('up' as const) : ('down' as const), icon: ShieldAlert },
    { title: 'Avg FAIR-AI Risk Score', value: simulationComplete ? '0.1 (LOW)' : '8.9 (CRITICAL)', change: simulationComplete ? 'Post-Hardened' : 'Unmanaged', changeType: simulationComplete ? ('up' as const) : ('down' as const), icon: TrendingUp },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 700 }} className="gradient-text">
              Aegis Forge Continuous AI Hardening Platform
            </h1>
            <span className="badge badge-info">v1.2 Production MVP</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Self-improving AI security validation engine for autonomous agents, MCP servers, and enterprise tools.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`btn ${activeTab === 'anatomy' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('anatomy')}
          >
            3D Living Anatomy
          </button>
          <button 
            className="btn btn-primary"
            disabled={isSimulating}
            onClick={runHardeningSimulation}
            style={{ 
              background: isSimulating ? 'var(--bg-elevated)' : 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)',
              color: '#ffffff',
              boxShadow: isSimulating ? 'none' : '0 0 20px rgba(0, 212, 255, 0.4)',
              cursor: isSimulating ? 'not-allowed' : 'pointer'
            }}
          >
            <Play size={16} fill="currentColor" />
            {isSimulating ? 'Simulating Hardening Loop...' : 'Trigger Live Hardening Loop'}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        {stats.map(s => <StatCard key={s.title} {...s} />)}
      </div>

      {/* Main Tab Views */}
      {activeTab === 'anatomy' ? (
        <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>3D WebGL Living Intelligence Human Anatomy</h3>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Click nodes to inspect organ systems</span>
          </div>
          <IntelligenceAnatomy3D />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Left Column: Live Hardening Loop Interactive Simulator */}
          <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Zap size={20} color="var(--primary)" />
                <h3 style={{ fontSize: '17px', fontWeight: 600 }}>Continuous Security Improvement Loop</h3>
              </div>
              <span className={`badge ${simulationComplete ? 'badge-low' : isSimulating ? 'badge-info' : 'badge-medium'}`}>
                {simulationComplete ? '100% Hardened' : isSimulating ? 'Running Loop' : 'Ready'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '520px', overflowY: 'auto', paddingRight: '4px' }}>
              {loopSteps.map((step, idx) => {
                const isActive = activeStepIndex === idx;
                return (
                  <div 
                    key={step.step}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-sm)',
                      background: isActive ? 'var(--primary-dim)' : step.status === 'complete' ? 'rgba(34, 197, 94, 0.08)' : 'var(--bg-elevated)',
                      border: isActive ? '1px solid var(--primary)' : step.status === 'complete' ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid var(--border)',
                      transition: 'all 0.25s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px'
                    }}
                  >
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: step.status === 'complete' ? 'var(--success)' : isActive ? 'var(--primary)' : 'var(--bg-base)',
                      color: step.status === 'complete' || isActive ? '#020817' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '12px',
                      flexShrink: 0
                    }}>
                      {step.status === 'complete' ? <CheckCircle2 size={16} /> : step.step}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: isActive ? 'var(--primary)' : 'var(--text-primary)' }}>
                          {step.title}
                        </div>
                        <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                          {step.service}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {step.detail}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Dynamic System Telemetry & gVisor Sandbox Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* gVisor Container Sandbox Card */}
            <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Server size={20} color="var(--primary)" />
                  <h3 style={{ fontSize: '16px', fontWeight: 600 }}>gVisor Container Sandbox</h3>
                </div>
                <span className="badge badge-info">runsc v1.26</span>
              </div>

              <div style={{ background: 'var(--bg-base)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontFamily: 'monospace', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>CONTAINER ID</span>
                  <span>ISOLATION FLAGS</span>
                  <span>STATUS</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)' }}>
                  <span style={{ color: 'var(--primary)' }}>sbx_gvisor_7710</span>
                  <span>--network none --cap-drop ALL</span>
                  <span style={{ color: isSimulating ? 'var(--primary)' : 'var(--success)' }}>
                    {isSimulating ? 'EXECUTING ATTACK' : 'CONTAINED'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>HMAC CANARY SIGNATURE</div>
                  <div style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--primary)' }}>2bf8cf57a99cb448</div>
                </div>
                <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>GPT-4O CONFIDENCE</div>
                  <div style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--success)' }}>0.98 (BREACH CONFIRMED)</div>
                </div>
              </div>
            </div>

            {/* Active Sentinel Policy Card */}
            <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={20} color="var(--success)" />
                  <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Active Sentinel Policy</h3>
                </div>
                <span className={`badge ${simulationComplete ? 'badge-low' : 'badge-medium'}`}>
                  {simulationComplete ? 'ACTIVE ENFORCING' : 'STAGED'}
                </span>
              </div>

              <div style={{ background: 'var(--bg-base)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Policy ID:</span>
                  <span style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>sentinel_dlp_honeyfact_guard_01</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Lifecycle FSM:</span>
                  <span style={{ fontWeight: 600, color: 'var(--success)' }}>
                    DRAFT → SIMULATING → VALIDATED → STAGED → ACTIVE
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Differential Protection:</span>
                  <span>100% Repeat Attack Blocked</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
