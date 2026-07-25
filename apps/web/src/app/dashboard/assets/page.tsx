import { AttackPathGraph, GraphNode, GraphLink } from '@/components/charts/AttackPathGraph';
import { Download } from 'lucide-react';

const mockNodes: GraphNode[] = [
  { id: '1', type: 'agent', label: 'CustomerSupport-Bot' },
  { id: '2', type: 'mcp', label: 'CRM-Connector' },
  { id: '3', type: 'mcp', label: 'Billing-Service' },
  { id: '4', type: 'tool', label: 'get_user_info' },
  { id: '5', type: 'tool', label: 'update_ticket' },
  { id: '6', type: 'tool', label: 'fetch_invoice' },
  { id: '7', type: 'database', label: 'Users DB (PG)' },
  { id: '8', type: 'database', label: 'Invoices (S3)' },
];

const mockLinks: GraphLink[] = [
  { source: '1', target: '2', label: 'uses' },
  { source: '1', target: '3', label: 'uses' },
  { source: '2', target: '4', label: 'exposes' },
  { source: '2', target: '5', label: 'exposes' },
  { source: '3', target: '6', label: 'exposes' },
  { source: '4', target: '7', label: 'queries' },
  { source: '5', target: '7', label: 'mutates' },
  { source: '6', target: '8', label: 'reads' },
];

export default function AssetsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600 }}>AI Asset Graph</h2>
        <button className="btn btn-primary"><Download size={16} /> Import MCP Config</button>
      </div>

      <div className="glass" style={{ flex: 1, minHeight: '600px', display: 'flex', position: 'relative' }}>
        <div style={{ flex: 1 }}>
          <AttackPathGraph nodes={mockNodes} links={mockLinks} />
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
