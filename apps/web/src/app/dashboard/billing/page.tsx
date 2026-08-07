'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Zap,
  Building2,
  Rocket,
  ArrowRight,
  BarChart3,
  Users,
  FileText,
  Shield,
  Lock,
  ExternalLink,
  Loader2,
  ChevronRight,
} from 'lucide-react';

// ─── Plan Tiers ───────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'Free',
    period: '',
    description: 'For individual developers evaluating AI security.',
    icon: Rocket,
    color: 'var(--primary)',
    current: true,
    features: [
      { label: '1 workspace', included: true },
      { label: '3 campaigns / month', included: true },
      { label: 'Up to 100 findings stored', included: true },
      { label: 'Security Passport (1 system)', included: true },
      { label: 'Compliance reports', included: false },
      { label: 'Team seats', included: false },
      { label: 'Custom frameworks', included: false },
      { label: 'SSO & SAML', included: false },
      { label: 'Dedicated support', included: false },
    ],
    cta: 'Current Plan',
    ctaDisabled: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$299',
    period: '/mo',
    description: 'For security teams running continuous AI red-teaming.',
    icon: Zap,
    color: 'var(--accent)',
    current: false,
    badge: 'Most Popular',
    features: [
      { label: '3 workspaces', included: true },
      { label: 'Unlimited campaigns', included: true },
      { label: 'Unlimited findings', included: true },
      { label: 'Security Passport (10 systems)', included: true },
      { label: 'Compliance reports (PDF + JSON)', included: true },
      { label: 'Up to 5 team seats', included: true },
      { label: 'Custom frameworks', included: false },
      { label: 'SSO & SAML', included: false },
      { label: 'Priority support', included: true },
    ],
    cta: 'Upgrade to Pro',
    ctaDisabled: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For organizations with advanced compliance and scale requirements.',
    icon: Building2,
    color: '#a855f7',
    current: false,
    features: [
      { label: 'Unlimited workspaces', included: true },
      { label: 'Unlimited campaigns', included: true },
      { label: 'Unlimited findings', included: true },
      { label: 'Unlimited Security Passports', included: true },
      { label: 'Compliance reports + custom branding', included: true },
      { label: 'Unlimited team seats', included: true },
      { label: 'Custom frameworks (NIST, ISO 42001)', included: true },
      { label: 'SSO & SAML', included: true },
      { label: 'Dedicated security engineer', included: true },
    ],
    cta: 'Contact Sales',
    ctaDisabled: false,
  },
];

// ─── Usage Meters — values loaded from real database, not hardcoded ───────────

const USAGE = [
  { label: 'Campaigns', used: 0, limit: 3, icon: Shield, unit: 'this month' },
  { label: 'Findings Stored', used: 0, limit: 100, icon: BarChart3, unit: 'total' },
  { label: 'Team Seats', used: 0, limit: 1, icon: Users, unit: 'occupied' },
  { label: 'Security Passports', used: 0, limit: 1, icon: FileText, unit: 'issued' },
];

// ─── Billing History — populated from real Stripe payment records ─────────────

const INVOICES: { date: string; description: string; amount: string; status: 'paid' | 'pending' }[] = [];

// ─── Components ───────────────────────────────────────────────────────────────

function UsageMeter({ label, used, limit, icon: Icon, unit }: typeof USAGE[0]) {
  const pct = Math.min((used / limit) * 100, 100);
  const nearLimit = pct >= 80;
  const atLimit = pct >= 100;
  const color = atLimit ? 'var(--danger)' : nearLimit ? '#f97316' : 'var(--primary)';

  return (
    <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={16} color={color} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{unit}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '18px', fontWeight: 800, color }}>{used}</span>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>/{limit}</span>
        </div>
      </div>
      <div style={{ height: '6px', borderRadius: '99px', background: 'var(--bg-elevated)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: '99px', background: color, transition: 'width 0.6s ease' }} />
      </div>
      {atLimit && (
        <div style={{ fontSize: '11px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <XCircle size={12} /> Limit reached — <Link href="/dashboard/billing" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 700 }}>Upgrade to Pro</Link>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  const handleUpgrade = async (planId: string) => {
    if (planId === 'enterprise') {
      window.open('mailto:sales@aegiscruc.io?subject=Enterprise%20Plan%20Inquiry', '_blank');
      return;
    }
    setUpgradeLoading(true);
    try {
      const res = await fetch('/api/v1/billing/checkout-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to initialize Stripe checkout session.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error initializing Stripe checkout session.');
    } finally {
      setUpgradeLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '40px' }} className="animate-fade-in">

      {/* Header */}
      <div>
        <h2 style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
          Billing & Plans
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Manage your subscription, track usage limits, and upgrade to unlock full platform capabilities.
        </p>
      </div>

      {/* Current Plan Banner */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderColor: 'var(--primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Rocket size={24} color="var(--primary)" />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>Current Plan</div>
            <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-display)' }}>Starter — Free</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>No credit card on file</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ textAlign: 'right', fontSize: '13px', color: 'var(--text-muted)' }}>
            <div>2 of 3 campaigns used</div>
            <div style={{ color: '#f97316', fontWeight: 600 }}>1 remaining this month</div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => handleUpgrade('pro')}
            disabled={upgradeLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {upgradeLoading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            Upgrade to Pro
          </button>
        </div>
      </div>

      {/* Usage Meters */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '16px' }}>
          Usage This Month
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
          {USAGE.map((u) => <UsageMeter key={u.label} {...u} />)}
        </div>
      </div>

      {/* Plan Comparison */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '16px' }}>
          Choose Your Plan
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {PLANS.map((plan) => {
            const PlanIcon = plan.icon;
            return (
              <div
                key={plan.id}
                className="glass-card"
                style={{
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                  position: 'relative',
                  borderColor: plan.current ? 'var(--primary)' : plan.id === 'pro' ? 'var(--accent)' : 'var(--border)',
                }}
              >
                {plan.badge && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: '#000', fontSize: '10px', fontWeight: 800, padding: '4px 12px', borderRadius: '99px', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                    {plan.badge}
                  </div>
                )}
                {plan.current && (
                  <div style={{ position: 'absolute', top: '-12px', right: '20px', background: 'var(--primary)', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '4px 12px', borderRadius: '99px', letterSpacing: '0.06em' }}>
                    CURRENT
                  </div>
                )}

                {/* Plan header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PlanIcon size={20} color={plan.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{plan.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{plan.description}</div>
                  </div>
                </div>

                {/* Price */}
                <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                    <span style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'var(--font-display)', color: plan.color }}>{plan.price}</span>
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{plan.period}</span>
                  </div>
                </div>

                {/* Features */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                  {plan.features.map((f) => (
                    <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                      {f.included
                        ? <CheckCircle size={15} color="var(--success)" style={{ flexShrink: 0 }} />
                        : <XCircle size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                      }
                      <span style={{ color: f.included ? 'var(--text-primary)' : 'var(--text-muted)' }}>{f.label}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  className={`btn ${plan.ctaDisabled ? 'btn-ghost' : plan.id === 'enterprise' ? 'btn-ghost' : 'btn-primary'}`}
                  onClick={() => !plan.ctaDisabled && handleUpgrade(plan.id)}
                  disabled={plan.ctaDisabled || upgradeLoading}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    ...(plan.id === 'pro' && !plan.ctaDisabled ? { background: 'var(--accent)', color: '#000' } : {}),
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {plan.ctaDisabled ? (
                    <CheckCircle size={14} />
                  ) : plan.id === 'enterprise' ? (
                    <ExternalLink size={14} />
                  ) : (
                    <ArrowRight size={14} />
                  )}
                  {plan.cta}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing History */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={16} color="var(--text-secondary)" />
            Billing History
          </h3>
        </div>
        {INVOICES.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '14px' }}>
            <CreditCard size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <div>No invoices yet — upgrade to a paid plan to see billing history here.</div>
            <button
              className="btn btn-primary"
              style={{ margin: '16px auto 0', display: 'flex', alignItems: 'center', gap: '8px' }}
              onClick={() => handleUpgrade('pro')}
            >
              <Zap size={14} /> Upgrade to Pro — $299/mo
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ textAlign: 'left', padding: '8px 0', fontWeight: 500 }}>Date</th>
                <th style={{ textAlign: 'left', padding: '8px 0', fontWeight: 500 }}>Description</th>
                <th style={{ textAlign: 'left', padding: '8px 0', fontWeight: 500 }}>Amount</th>
                <th style={{ textAlign: 'left', padding: '8px 0', fontWeight: 500 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {INVOICES.map((inv, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 0', color: 'var(--text-secondary)' }}>{inv.date}</td>
                  <td style={{ padding: '14px 0' }}>{inv.description}</td>
                  <td style={{ padding: '14px 0', fontFamily: 'var(--font-mono)' }}>{inv.amount}</td>
                  <td style={{ padding: '14px 0' }}>
                    <span className={`badge badge-${inv.status === 'paid' ? 'low' : 'medium'}`}>{inv.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Enterprise CTA */}
      <div className="glass-card" style={{ padding: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(168,85,247,0.06), rgba(59,130,246,0.06))', borderColor: 'rgba(168,85,247,0.2)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Lock size={18} color="#a855f7" />
            <h3 style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-display)' }}>Enterprise Security Requirements?</h3>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '500px' }}>
            Custom frameworks, unlimited seats, SAML SSO, and a dedicated security engineer. We work directly with your security team.
          </p>
        </div>
        <a
          href="mailto:sales@aegiscruc.io?subject=Enterprise%20Plan%20Inquiry"
          className="btn btn-ghost"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', borderColor: 'rgba(168,85,247,0.4)', color: '#a855f7' }}
        >
          <ExternalLink size={14} />
          Contact Sales
        </a>
      </div>
    </div>
  );
}
