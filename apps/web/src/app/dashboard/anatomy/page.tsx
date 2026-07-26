'use client';
import { IntelligenceAnatomy3D } from '@/components/3d/IntelligenceAnatomy3D';

export default function AnatomyPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 600 }} className="gradient-text">
            3D Living Intelligence Anatomy
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Real-time WebGL visualization of cognitive manifold states, governance core shields, and Council of Titans telemetry.
          </p>
        </div>
      </div>

      <IntelligenceAnatomy3D />
    </div>
  );
}
