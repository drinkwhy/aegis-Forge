import { FindingCard } from '@/components/ui/FindingCard';

const mockFindings = [
  { id: 'f1', title: 'Unauthorized DB access via Prompt Injection', description: 'Attacker successfully injected a malicious prompt payload bypassing input filters, leading to arbitrary database queries via the MCP connector.', agentName: 'CustomerSupport-Bot', severity: 'Critical', riskRange: '$125k – $890k', timestamp: '2h ago' },
  { id: 'f2', title: 'SSRF in Internal API Tool', description: 'The agent can be manipulated to make requests to internal metadata endpoints.', agentName: 'DevOps-Assistant', severity: 'High', riskRange: '$50k – $150k', timestamp: '5h ago' },
  { id: 'f3', title: 'PII Leak in Summarization', description: 'Summarization tool occasionally includes sensitive user PII from context into logs.', agentName: 'DocWriter', severity: 'Medium', riskRange: '$10k – $45k', timestamp: '12h ago' },
  { id: 'f4', title: 'Excessive Agency - S3 Bucket Listing', description: 'Agent has permissions to list all S3 buckets instead of just the requested ones.', agentName: 'CustomerSupport-Bot', severity: 'Critical', riskRange: '$200k – $1.2M', timestamp: '1d ago' },
  { id: 'f5', title: 'Insecure Direct Object Reference', description: 'Agent allows fetching invoices without proper authorization check on the user ID.', agentName: 'Finance-Bot', severity: 'High', riskRange: '$75k – $300k', timestamp: '2d ago' },
  { id: 'f6', title: 'Cleartext Credentials in MCP Config', description: 'Hardcoded API key found in the MCP tool environment variables.', agentName: 'Sales-Agent', severity: 'Medium', riskRange: '$20k – $80k', timestamp: '3d ago' },
];

export default function FindingsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600 }}>Security Findings</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['All', 'Critical', 'High', 'Medium', 'Low'].map(f => (
            <button key={f} className={`btn ${f === 'All' ? 'btn-primary' : 'btn-ghost'}`} style={{ padding: '6px 12px', fontSize: '13px' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
        {mockFindings.map(f => <FindingCard key={f.id} finding={f} />)}
      </div>
    </div>
  );
}
