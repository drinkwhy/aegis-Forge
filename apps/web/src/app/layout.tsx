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

const ACTIVE_CLERK_KEY = 'pk_test_Zmx1ZW50LXN3YW4tOTYuY2xlcmsuYWNjb3VudHMuZGV2JA';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider publishableKey={ACTIVE_CLERK_KEY} appearance={{ baseTheme: dark }}>
      <OrganizationProvider>
        <html lang="en">
          <body>{children}</body>
        </html>
      </OrganizationProvider>
    </ClerkProvider>
  )
}
