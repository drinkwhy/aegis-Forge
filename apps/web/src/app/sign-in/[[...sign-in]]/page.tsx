'use client';
import { useState, useEffect } from 'react';
import { SignIn } from '@clerk/nextjs';

export default function Page() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0, 212, 255, 0.06), transparent)'
    }}>
      <div className="glass animate-fade-in" style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
            AEGIS <span style={{ color: 'var(--primary)' }}>FORGE</span>
          </span>
        </div>
        {mounted ? (
          <SignIn signUpUrl="/sign-up" forceRedirectUrl="/dashboard" />
        ) : (
          <div style={{ width: '400px', height: '450px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Loading auth portal...
          </div>
        )}
      </div>
    </div>
  );
}
