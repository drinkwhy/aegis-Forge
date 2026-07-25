import type { Metadata } from 'next'
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
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
