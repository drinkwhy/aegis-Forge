'use client';
import { use } from 'react';
import { Activity, ShieldAlert, CheckCircle2, Shield, AlertTriangle } from 'lucide-react';

export default function RuntimeDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>
            Runtime Security
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Asset ID: {id}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--success-dim)', color: 'var(--success)', borderRadius: 'var(--radius)', fontWeight: 600 }}>
          <CheckCircle2 size={18} /> AegisAgent Connected
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <MetricCard label="Protected Systems" value="1" icon={Shield} color="var(--primary)" />
        <MetricCard label="Actions Observed" value="18,421" icon={Activity} color="#3b82f6" />
        <MetricCard label="Actions Blocked" value="73" icon={ShieldAlert} color="var(--error)" />
        <MetricCard label="High-Risk Events" value="2" icon={AlertTriangle} color="var(--warning)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', padding: '24px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Recent Runtime Events</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <EventRow 
              action="tool.executed" target="database_query" 
              decision="ALLOW" time="2m ago" 
              details="Executed SELECT query on users table"
            />
            <EventRow 
              action="tool.requested" target="database_query" 
              decision="DENY" time="15m ago" 
              details="Attempted DROP TABLE operation. Blocked by Policy ID: SQL_RESTRICT."
              isAlert
            />
            <EventRow 
              action="mcp.request" target="stripe_api" 
              decision="ALLOW" time="1h ago" 
              details="Requested payment intent creation"
            />
            <EventRow 
              action="behavior.anomaly" target="unknown_domain" 
              decision="REQUIRE_APPROVAL" time="3h ago" 
              details="Attempted connection to unverified external domain."
              isWarning
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', padding: '24px', border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Policy Coverage</h2>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px' }}>
              <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--bg-surface)" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--primary)" strokeWidth="3" strokeDasharray="96, 100" />
                </svg>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 800 }}>
                  96%
                </div>
              </div>
            </div>
            <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', marginTop: '16px' }}>Active policies are enforcing known safe bounds.</p>
          </div>

          <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', padding: '24px', border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Passport Assurance</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <CheckCircle2 size={16} color="var(--success)" /> <span style={{ fontWeight: 600 }}>VERIFIED + MONITORED</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              No material drift or critical policy violations detected. Passport is valid.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color }: { label: string, value: string, icon: any, color: string }) {
  return (
    <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', padding: '24px', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{ padding: '8px', background: `${color}15`, borderRadius: '8px', color }}>
          <Icon size={20} />
        </div>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
      </div>
      <div style={{ fontSize: '32px', fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function EventRow({ action, target, decision, time, details, isAlert = false, isWarning = false }: any) {
  const color = isAlert ? 'var(--error)' : isWarning ? 'var(--warning)' : 'var(--success)';
  return (
    <div style={{ paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 700 }}>{action}</span>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>→ {target}</span>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{time}</span>
      </div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', background: `${color}15`, color, borderRadius: '4px' }}>
          {decision}
        </span>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{details}</span>
      </div>
    </div>
  );
}
