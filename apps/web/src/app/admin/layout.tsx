'use client';
import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, LayoutGrid, ScrollText, Users, LogOut, ChevronRight, Loader2 } from 'lucide-react';

const adminNav = [
  { name: 'Overview', href: '/admin', icon: LayoutGrid },
  { name: 'Passport Registry', href: '/admin/passports', icon: ShieldCheck },
  { name: 'Organizations', href: '/admin/orgs', icon: Users },
  { name: 'Audit Log', href: '/admin/audit', icon: ScrollText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'superadmin';

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.replace('/sign-in'); return; }
    if (!isAdmin) { router.replace('/dashboard'); return; }
  }, [isLoaded, user, isAdmin, router]);

  if (!isLoaded || !isAdmin) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Loader2 size={28} color="var(--primary)" className="animate-spin" />
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Verifying admin access…</p>
      </div>
    </div>
  );

  const navStyle = (active: boolean) => ({
    display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px',
    borderRadius: 'var(--radius-sm)', textDecoration: 'none',
    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
    background: active ? 'rgba(239,68,68,0.10)' : 'transparent',
    borderLeft: active ? '3px solid #ef4444' : '3px solid transparent',
    transition: 'all 0.2s', fontWeight: 500, fontSize: '13px',
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <aside className="glass" style={{ width: '240px', height: '100vh', position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', borderRadius: 0, borderTop: 'none', borderBottom: 'none', borderLeft: 'none' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={15} color="#ef4444" />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.06em', color: '#ef4444' }}>ADMIN CONSOLE</span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Aegis Crucible · Internal</p>
        </div>
        <nav style={{ flex: 1, padding: '12px' }}>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {adminNav.map(item => {
              const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <li key={item.name}>
                  <Link href={item.href} style={navStyle(active)}>
                    <item.icon size={16} color={active ? '#ef4444' : 'currentColor'} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderRadius: 'var(--radius-sm)', textDecoration: 'none', color: 'var(--text-muted)', fontSize: '12px' }}>
            <LogOut size={14} /> Back to Dashboard
          </Link>
          <div style={{ padding: '8px 12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user?.primaryEmailAddress?.emailAddress}</div>
            <div style={{ fontSize: '10px', color: '#ef4444', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Admin</div>
          </div>
        </div>
      </aside>
      <main style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ padding: '14px 32px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <span>Admin</span><ChevronRight size={12} />
          <span style={{ color: 'var(--text-primary)' }}>{adminNav.find(n => pathname === n.href || (n.href !== '/admin' && pathname.startsWith(n.href)))?.name ?? 'Overview'}</span>
        </div>
        <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>{children}</div>
      </main>
    </div>
  );
}
