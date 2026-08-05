'use client';
import { useState } from 'react';
import { ShieldCheck, Database, Award, ClipboardCheck } from 'lucide-react';

interface SegmentInfo {
  name: string;
  score: number;
  status: 'passed' | 'failed' | 'warning' | 'incomplete';
  details: string[];
  color: string;
}

interface AssuranceRingProps {
  overallScore: number;
  status: string;
  assuranceLevel: string;
}

export function AssuranceRing({ overallScore, status, assuranceLevel }: AssuranceRingProps) {
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);

  const segments: SegmentInfo[] = [
    {
      name: 'Identity & Inventory',
      score: 100,
      status: 'passed',
      color: '#00d4ff',
      details: ['Asset inventory mapped successfully', 'Systems and dependencies attributed', 'Intended purpose documented', 'System owner identified'],
    },
    {
      name: 'Controls Governance',
      score: 85,
      status: 'warning',
      color: '#eab308',
      details: ['Defensive Sentinel policies staged', 'DLP egress filter active', 'Model boundary isolation enforced', 'Database protection lease active'],
    },
    {
      name: 'Validation & Attack execution',
      score: 95,
      status: 'passed',
      color: '#22c55e',
      details: ['Prompt injection execution tests passed', 'Data exfiltration scenarios executed & blocked', 'MCP boundary sandbox integrity verified'],
    },
    {
      name: 'Evidence Freshness & Integrity',
      score: 100,
      status: 'passed',
      color: '#a78bfa',
      details: ['All required control telemetry logs signed', 'Deterministic configuration hash verified', 'Evidence signatures validated against RoE'],
    },
  ];

  // SVG parameters
  const radius = 90;
  const strokeWidth = 14;
  const center = 110;
  const circumference = 2 * Math.PI * radius;
  const segmentLength = circumference / 4 - 8; // evenly distributed with gaps

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%' }}>
      <div style={{ position: 'relative', width: '220px', height: '220px' }}>
        <svg width="220" height="220" viewBox="0 0 220 220" style={{ transform: 'rotate(-90deg)' }}>
          {segments.map((seg, idx) => {
            const offset = (circumference / 4) * idx;
            const isSelected = selectedSegment === idx;
            return (
              <circle
                key={seg.name}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${segmentLength} ${circumference}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  opacity: selectedSegment === null || isSelected ? 1 : 0.4,
                  strokeWidth: isSelected ? strokeWidth + 4 : strokeWidth,
                  filter: isSelected ? `drop-shadow(0 0 8px ${seg.color})` : 'none',
                }}
                onClick={() => setSelectedSegment(selectedSegment === idx ? null : idx)}
              />
            );
          })}
        </svg>

        {/* Center Text displaying overall stats */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            boxShadow: 'inset 0 0 15px rgba(0,212,255,0.05)',
          }}
        >
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>
            Score
          </span>
          <span style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }} className="mono">
            {Math.round(overallScore * 100)}
          </span>
          <span
            style={{
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '99px',
              background: 'rgba(34, 197, 94, 0.12)',
              color: '#22c55e',
              marginTop: '4px',
              fontWeight: 600,
              letterSpacing: '0.05em',
            }}
          >
            {status}
          </span>
        </div>
      </div>

      {/* Selected Segment Details Panel */}
      <div
        className="glass animate-fade-in"
        style={{
          width: '100%',
          padding: '16px',
          minHeight: '120px',
          borderColor: selectedSegment !== null ? segments[selectedSegment].color + '55' : 'var(--border)',
          transition: 'all 0.3s ease',
        }}
      >
        {selectedSegment === null ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', paddingTop: '20px' }}>
            Click a ring segment to inspect detailed compliance evidence metrics.
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 600, color: segments[selectedSegment].color, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {selectedSegment === 0 && <Database size={16} />}
                {selectedSegment === 1 && <Award size={16} />}
                {selectedSegment === 2 && <ShieldCheck size={16} />}
                {selectedSegment === 3 && <ClipboardCheck size={16} />}
                {segments[selectedSegment].name}
              </h4>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }} className="mono">
                {segments[selectedSegment].score}% Checked
              </span>
            </div>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', listStyle: 'none' }}>
              {segments[selectedSegment].details.map((d, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span style={{ color: segments[selectedSegment].color, marginTop: '2px' }}>✓</span>
                  {d}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
