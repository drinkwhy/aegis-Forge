import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import './globals.css'

export const metadata: Metadata = {
  title: 'Aegis Forge — Continuous AI Security Validation',
  description: 'Automated adversarial simulation and continuous hardening for AI agents. Prove your defenses hold.',
  keywords: 'AI security, red teaming, MCP security, prompt injection testing, LLM security',
  openGraph: {
    title: 'Aegis Forge',
    description: 'Continuous AI Security Validation Platform',
    type: 'website',
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_YnVpbGQtdGltZS1kdW1teS1jbGVyay1rZXktMDBhLmNsZXJrLmFjY291bnRzLmRldiQ';
  return (
    <ClerkProvider publishableKey={publishableKey} appearance={{ baseTheme: dark }}>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
