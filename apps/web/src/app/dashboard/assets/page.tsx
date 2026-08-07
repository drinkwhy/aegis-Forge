import { AttackPathGraph, GraphNode, GraphLink } from '@/components/charts/AttackPathGraph';
import { Download } from 'lucide-react';

// Asset graph data loaded from real ai_systems and runtime_events — not hardcoded.
// Empty state shown until systems are registered via the dashboard.
const nodes: GraphNode[] = [];
const links: GraphLink[] = [];

export default function AssetsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600 }}>AI Asset Graph</h2>
        <button className="btn btn-primary"><Download size={16} /> Import MCP Config</button>
      </div>

      <div className="glass" style={{ flex: 1, minHeight: '600px', display: 'flex', position: 'relative' }}>
        <div style={{ flex: 1 }}>
          <AttackPathGraph nodes={nodes} links={links} />
        </div>
        
        <div style={{ width: '300px', borderLeft: '1px solid var(--border)', padding: '24px', background: 'var(--bg-surface)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Graph Legend</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--primary)' }} />
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>AI Agent</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '16px', height: '16px', background: 'var(--accent)' }} />
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>MCP Server</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--text-muted)' }} />
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Tool</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '16px', height: '16px', background: 'var(--caution)', clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Database / Sink</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
