import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { 
  LayoutDashboard, 
  Activity,
  Play, 
  ShieldAlert, 
  Network, 
  Wrench, 
  FileText, 
  Settings,
  ShieldCheck,
  CreditCard,
  Zap,
  Cpu,
  BarChart3,
  Shield,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Current Audit', href: '/dashboard/audit', icon: Activity },
  { name: 'Findings', href: '/dashboard/findings', icon: ShieldAlert },
  { name: 'Security Passport', href: '/dashboard/passport', icon: ShieldCheck },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

const billingItem = { name: 'Billing', href: '/dashboard/billing', icon: CreditCard };
const adminItem = { name: 'Admin Console', href: '/admin', icon: Shield };

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'superadmin';

  const navLinkStyle = (isActive: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: 'var(--radius-sm)',
    textDecoration: 'none',
    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
    background: isActive ? 'var(--primary-dim)' : 'transparent',
    borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
    transition: 'all 0.2s',
    fontWeight: 500,
    fontSize: '14px',
  });

  return (
    <aside className="glass" style={{ width: '240px', height: '100vh', display: 'flex', flexDirection: 'column', borderRadius: 0, borderTop: 'none', borderBottom: 'none', borderLeft: 'none' }}>
      <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <h1 className="gradient-text" style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '0.05em' }}>AEGIS CRUCIBLE</h1>
      </div>
      
      <nav style={{ flex: 1, padding: '0 12px', overflowY: 'auto' }}>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.name}>
                <Link href={item.href} style={navLinkStyle(isActive)}>
                  <item.icon size={18} color={isActive ? 'var(--primary)' : 'currentColor'} />
                  {item.name}
                </Link>
              </li>
            );
          })}

          {/* Divider */}
          <li style={{ margin: '8px 0' }}>
            <div style={{ height: '1px', background: 'var(--border)' }} />
          </li>

          {/* Billing */}
          <li>
            <Link
              href={billingItem.href}
              style={navLinkStyle(pathname === billingItem.href)}
            >
              <billingItem.icon size={18} color={pathname === billingItem.href ? 'var(--primary)' : 'currentColor'} />
              {billingItem.name}
            </Link>
          </li>

          {/* Admin Console — visible only for admins */}
          {isAdmin && (
            <li>
              <Link
                href={adminItem.href}
                style={{ ...navLinkStyle(pathname.startsWith(adminItem.href)), borderColor: pathname.startsWith(adminItem.href) ? '#ef4444' : 'transparent', color: pathname.startsWith(adminItem.href) ? '#ef4444' : 'var(--text-muted)', background: pathname.startsWith(adminItem.href) ? 'rgba(239,68,68,0.08)' : 'transparent' }}
              >
                <adminItem.icon size={16} color={pathname.startsWith(adminItem.href) ? '#ef4444' : '#6b7280'} />
                {adminItem.name}
              </Link>
            </li>
          )}
        </ul>
      </nav>

      {/* Upgrade Nudge */}
      <div style={{ padding: '12px', margin: '0 12px 12px' }}>
        <Link
          href="/dashboard/billing"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px',
            borderRadius: 'var(--radius)',
            background: 'linear-gradient(135deg, rgba(234,179,8,0.08), rgba(59,130,246,0.05))',
            border: '1px solid rgba(234,179,8,0.2)',
            textDecoration: 'none',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(234,179,8,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={14} color="var(--accent)" />
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', whiteSpace: 'nowrap' }}>Starter Plan</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Upgrade to Pro →</div>
          </div>
        </Link>
      </div>

      {/* Workspace Footer */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', position: 'relative', flexShrink: 0 }}>
            <span style={{ fontSize: '13px', fontWeight: 700 }}>AC</span>
            <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)', border: '2px solid var(--bg-surface)' }} className="radar-pulse" />
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>Acme Workspace</div>
            <div style={{ fontSize: '11px', color: 'var(--cyan)', fontWeight: 600, letterSpacing: '0.05em' }}>CONNECTED</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
