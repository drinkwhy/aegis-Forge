'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { ShieldCheck, LayoutGrid, LogOut, ChevronRight, Plus, Loader2 } from 'lucide-react';

const portalNav = [
  { name: 'Overview', href: '/portal', icon: LayoutGrid },
  { name: 'My Passports', href: '/portal/passports', icon: ShieldCheck },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  if (!isLoaded) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <Loader2 size={24} color="var(--primary)" className="animate-spin" />
    </div>
  );
  const navStyle = (active: boolean) => ({
    display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px',
    borderRadius: 'var(--radius-sm)', textDecoration: 'none',
    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
    background: active ? 'var(--primary-dim)' : 'transparent',
    borderLeft: active ? '3px solid var(--primary)' : '3px solid transparent',
    transition: 'all 0.2s', fontWeight: 500, fontSize: '13px',
  });
  const initials = user?.firstName ? `${user.firstName[0]}${user.lastName?.[0] ?? ''}` : 'U';
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <aside className="glass" style={{ width: '240px', height: '100vh', position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', borderRadius: 0, borderTop: 'none', borderBottom: 'none', borderLeft: 'none' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.06em' }} className="gradient-text">AEGIS PASSPORT</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Customer Portal</div>
          </div>
        </div>
        <div style={{ padding: '12px' }}>
          <Link href="/portal/passports/new" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', padding: '9px', borderRadius: 'var(--radius-sm)', background: 'var(--primary)', color: 'white', textDecoration: 'none', fontSize: '12px', fontWeight: 700 }}>
            <Plus size={14} /> Issue New Passport
          </Link>
        </div>
        <nav style={{ flex: 1, padding: '4px 12px' }}>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {portalNav.map(item => {
              const active = pathname === item.href || (item.href !== '/portal' && pathname.startsWith(item.href));
              return (
                <li key={item.name}>
                  <Link href={item.href} style={navStyle(active)}>
                    <item.icon size={15} color={active ? 'var(--primary)' : 'currentColor'} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderRadius: 'var(--radius-sm)', textDecoration: 'none', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '8px' }}>
            <LogOut size={13} /> Back to Dashboard
          </Link>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 12px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-dim)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>{initials}</div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.firstName} {user.lastName}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.primaryEmailAddress?.emailAddress}</div>
              </div>
            </div>
          )}
        </div>
      </aside>
      <main style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ padding: '14px 32px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <span>Portal</span><ChevronRight size={12} />
          <span style={{ color: 'var(--text-primary)' }}>{portalNav.find(n => pathname === n.href || (n.href !== '/portal' && pathname.startsWith(n.href)))?.name ?? 'Overview'}</span>
        </div>
        <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>{children}</div>
      </main>
    </div>
  );
}
