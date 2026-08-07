import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import './globals.css'

export const metadata: Metadata = {
  title: 'Aegis Crucible — Continuous AI Security Validation',
  description: 'Automated adversarial simulation and continuous hardening for AI agents. Prove your defenses hold.',
  keywords: 'AI security, red teaming, MCP security, prompt injection testing, LLM security',
  openGraph: {
    title: 'Aegis Crucible',
    description: 'Continuous AI Security Validation Platform',
    type: 'website',
  }
}

import { OrganizationProvider } from '@/context/OrganizationContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_Zmx1ZW50LXN3YW4tOTYuY2xlcmsuYWNjb3VudHMuZGV2JA';
  return (
    <ClerkProvider publishableKey={publishableKey} appearance={{ baseTheme: dark }}>
      <OrganizationProvider>
        <html lang="en">
          <body>{children}</body>
        </html>
      </OrganizationProvider>
    </ClerkProvider>
  )
}
