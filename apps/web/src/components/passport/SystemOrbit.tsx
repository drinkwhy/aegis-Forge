'use client';
import { useState } from 'react';
import { Cpu, HardDrive, Key, Globe, Terminal, Database, FileCode2 } from 'lucide-react';

interface OrbitNode {
  name: string;
  type: string;
  ring: 1 | 2 | 3;
  status: 'green' | 'amber' | 'red' | 'gray';
  x: number;
  y: number;
  icon: any;
  detail: string;
}

interface SystemOrbitProps {
  hasDrift?: boolean;
  heartbeatOffline?: boolean;
}

export function SystemOrbit({ hasDrift, heartbeatOffline }: SystemOrbitProps) {
  const [hoveredNode, setHoveredNode] = useState<OrbitNode | null>(null);

  const center = 160;
  const ring1Radius = 55;
  const ring2Radius = 100;
  const ring3Radius = 140;

  // Pre-calculated trigonometric nodes distributed over orbits
  const nodes: OrbitNode[] = [
    // Ring 1: Agents & Models
    { 
      name: 'Financial Advisor Agent', 
      type: 'Agent', 
      ring: 1, 
      status: heartbeatOffline ? 'red' : 'green', 
      ...getCoords(55, 30), 
      icon: Cpu, 
      detail: heartbeatOffline ? 'Telemetry heartbeat is OFFLINE; gateway disconnected.' : 'Agent telemetry heartbeat active (online).' 
    },
    { name: 'GPT-4o Base Model', type: 'Model', ring: 1, status: 'green', ...getCoords(55, 170), icon: BrainIcon, detail: 'Model version: gpt-4o-2024-05-13. Unaltered.' },
    
    // Ring 2: Tools, MCP servers, APIs
    { name: 'SQL Query Executor Tool', type: 'Tool', ring: 2, status: 'green', ...getCoords(100, -10), icon: Terminal, detail: 'Tool manifest matches original signature hash.' },
    { name: 'Enterprise Financial MCP', type: 'MCP Server', ring: 2, status: 'green', ...getCoords(100, 110), icon: Globe, detail: 'Lease active. Access bounds restricted.' },
    { name: 'Slack Messaging API', type: 'API Connection', ring: 2, status: 'green', ...getCoords(100, 230), icon: Globe, detail: 'OAuth credentials and scopes locked. No drift.' },
 
    // Ring 3: Data stores, credentials, deployments
    { name: 'AWS RDS Postgres', type: 'Data Store', ring: 3, status: 'green', ...getCoords(140, 50), icon: Database, detail: 'Storage isolation verified. Row level security enabled.' },
    { name: 'Vault Credential Store', type: 'Credentials', ring: 3, status: 'green', ...getCoords(140, 130), icon: Key, detail: 'Interception logs signed by HashiCorp Vault transit engine.' },
    { 
      name: 'Vercel Worker Cluster', 
      type: 'Deployment', 
      ring: 3, 
      status: hasDrift ? 'red' : 'green', 
      ...getCoords(140, 260), 
      icon: FileCode2, 
      detail: hasDrift ? 'Deployment image digest mismatch. Drift detected at runtime.' : 'Deployment signature matches. Zero drift.' 
    },
  ];

  function getCoords(r: number, angleDegrees: number) {
    const angleRad = (angleDegrees * Math.PI) / 180;
    return {
      x: center + r * Math.cos(angleRad),
      y: center + r * Math.sin(angleRad),
    };
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'green': return '#22c55e';
      case 'amber': return '#f97316';
      case 'red': return '#ef4444';
      default: return '#64748b';
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      <div style={{ position: 'relative', width: '320px', height: '320px', margin: '0 auto' }}>
        <svg width="320" height="320" viewBox="0 0 320 320">
          {/* Concentric Orbit Rings */}
          <circle cx={center} cy={center} r={ring1Radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx={center} cy={center} r={ring2Radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx={center} cy={center} r={ring3Radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />

          {/* Connection Lines from Center */}
          {nodes.map((node) => (
            <line
              key={node.name}
              x1={center}
              y1={center}
              x2={node.x}
              y2={node.y}
              stroke={getStatusColor(node.status)}
              strokeWidth={hoveredNode?.name === node.name ? '1.5' : '0.8'}
              strokeOpacity={hoveredNode?.name === node.name ? '0.6' : '0.2'}
              style={{ transition: 'all 0.3s' }}
            />
          ))}

          {/* Center Passport Node */}
          <g style={{ cursor: 'pointer' }}>
            <circle cx={center} cy={center} r="18" fill="var(--bg-elevated)" stroke="var(--primary)" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 10px rgba(0, 212, 255, 0.4))' }} />
            <ShieldIcon x={center - 8} y={center - 8} color="var(--primary)" size={16} />
          </g>

          {/* Orbit Nodes */}
          {nodes.map((node) => {
            const Icon = node.icon;
            const isHovered = hoveredNode?.name === node.name;
            const color = getStatusColor(node.status);
            return (
              <g
                key={node.name}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isHovered ? 14 : 11}
                  fill="var(--bg-surface)"
                  stroke={color}
                  strokeWidth="1.5"
                  style={{
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    filter: isHovered ? `drop-shadow(0 0 6px ${color})` : 'none',
                  }}
                />
                <g transform={`translate(${node.x - 7}, ${node.y - 7})`}>
                  <Icon size={14} color={color} />
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Orbit Information Banner */}
      <div className="glass" style={{ padding: '14px', minHeight: '80px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {hoveredNode ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>{hoveredNode.name}</span>
              <span
                style={{
                  fontSize: '10px',
                  color: getStatusColor(hoveredNode.status),
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                {hoveredNode.type}
              </span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
              {hoveredNode.detail}
            </p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px', padding: '10px 0' }}>
            Hover over nodes to inspect structural components and real-time drift telemetry.
          </div>
        )}
      </div>
    </div>
  );
}

// Inline SVGs for Brain & Shield icons to keep dependency footprint low
function BrainIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-3.12 3 3 0 0 1 0-4.88 2.5 2.5 0 0 1 0-3.12A2.5 2.5 0 0 1 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 0-3.12 3 3 0 0 0 0-4.88 2.5 2.5 0 0 0 0-3.12A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
  );
}

function ShieldIcon({ x, y, color, size }: { x: number; y: number; color: string; size: number }) {
  return (
    <svg x={x} y={y} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
