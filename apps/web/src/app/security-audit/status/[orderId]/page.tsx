'use client';
import { use } from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shield, CheckCircle, XCircle, Clock, Loader2, ExternalLink, Download, AlertTriangle } from 'lucide-react';

interface TestResult {
  id: string;
  testDefinitionId: string;
  testCategory: string;
  status: 'PASS' | 'FAIL' | 'ERROR' | 'SKIPPED';
  passed: boolean;
  severity: string;
  evidenceHash?: string;
  durationMs?: number;
  executedAt: string;
}

interface OrderDetail {
  id: string;
  status: string;
  assetName: string;
  orgName: string;
  amount: number;
  currency: string;
  paidAt?: string;
  passportId?: string;
  execution?: {
    id: string;
    status: string;
    totalTests: number;
    completedTests: number;
    failedTests: number;
    startedAt?: string;
    completedAt?: string;
  };
}

const STATUS_INFO: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  DRAFT: { label: 'Draft', color: '#6b7280', icon: Clock },
  PAYMENT_PENDING: { label: 'Payment Pending', color: '#f59e0b', icon: Clock },
  PAID: { label: 'Paid — Queuing Assessment', color: '#3b82f6', icon: Loader2 },
  INTAKE_REQUIRED: { label: 'Intake Required', color: '#f59e0b', icon: AlertTriangle },
  READY: { label: 'Ready to Run', color: '#3b82f6', icon: CheckCircle },
  ASSESSMENT_RUNNING: { label: 'Assessment Running', color: '#a855f7', icon: Loader2 },
  REVIEW_REQUIRED: { label: 'Awaiting Reviewer', color: '#f59e0b', icon: Clock },
  REMEDIATION_REQUIRED: { label: 'Remediation Required', color: '#ef4444', icon: AlertTriangle },
  COMPLETED: { label: 'Completed', color: '#10b981', icon: CheckCircle },
};

export default function StatusPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/v1/audit-orders/${orderId}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        }
        const rRes = await fetch(`/api/v1/audit-orders/${orderId}/results`);
        if (rRes.ok) {
          const rData = await rRes.json();
          setResults(rData.results || []);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) {
    return <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 size={32} color="var(--primary)" className="animate-spin" /></div>;
  }

  if (!order) {
    return <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Order not found.</div>;
  }

  const statusInfo = STATUS_INFO[order.status] || { label: order.status, color: '#6b7280', icon: Clock };
  const StatusIcon = statusInfo.icon;
  const isRunning = ['PAID', 'ASSESSMENT_RUNNING'].includes(order.status);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield size={22} color="var(--primary)" />
          <h1 style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-display)' }}>Assessment Status</h1>
        </div>

        {/* Status Card */}
        <div className="glass-card" style={{ padding: '24px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>{order.assetName}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{order.orgName} · Order {orderId.slice(0, 8)}…</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '99px', background: `${statusInfo.color}15`, border: `1px solid ${statusInfo.color}40` }}>
              {isRunning ? <StatusIcon size={12} color={statusInfo.color} className="animate-spin" /> : <StatusIcon size={12} color={statusInfo.color} />}
              <span style={{ fontSize: '12px', fontWeight: 700, color: statusInfo.color }}>{statusInfo.label}</span>
            </div>
          </div>

          {order.execution && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <span>Progress</span>
                <span>{order.execution.completedTests}/{order.execution.totalTests} tests</span>
              </div>
              <div style={{ height: '6px', borderRadius: '3px', background: 'var(--bg-elevated)' }}>
                <div style={{ height: '100%', borderRadius: '3px', background: order.execution.failedTests > 0 ? '#f97316' : 'var(--primary)', width: order.execution.totalTests > 0 ? `${(order.execution.completedTests / order.execution.totalTests) * 100}%` : '0%', transition: 'width 0.5s ease' }} />
              </div>
              {order.execution.failedTests > 0 && (
                <div style={{ marginTop: '6px', fontSize: '11px', color: '#ef4444' }}>{order.execution.failedTests} finding(s) detected</div>
              )}
            </div>
          )}

          {order.status === 'COMPLETED' && order.passportId && (
            <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
              <Link href={`/verify/passport/${order.passportId}`} target="_blank" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', textDecoration: 'none', fontSize: '12px', fontWeight: 600 }}>
                <Shield size={12} /> View Security Passport <ExternalLink size={11} />
              </Link>
              <a href={`/api/v1/audit-orders/${orderId}/report`} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '12px' }}>
                <Download size={12} /> Download Report
              </a>
            </div>
          )}
        </div>

        {/* Test Results */}
        {results.length > 0 && (
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Test Results</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {results.map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', border: `1px solid ${r.passed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}` }}>
                  {r.passed
                    ? <CheckCircle size={14} color="#10b981" />
                    : <XCircle size={14} color="#ef4444" />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600 }}>{r.testDefinitionId}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{r.testCategory.replace(/_/g, ' ')}</div>
                  </div>
                  <div style={{ fontSize: '10px', color: r.severity === 'CRITICAL' ? '#ef4444' : r.severity === 'HIGH' ? '#f97316' : 'var(--text-muted)', fontWeight: 600 }}>{r.severity}</div>
                  {r.evidenceHash && (
                    <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }} title={r.evidenceHash}>{r.evidenceHash.slice(0, 8)}…</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
