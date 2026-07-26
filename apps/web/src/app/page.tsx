'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base, #020817)',
      color: 'var(--primary, #00d4ff)',
      fontSize: '14px',
      fontWeight: 500
    }}>
      Redirecting to Aegis Forge Platform Dashboard...
    </div>
  );
}
