# Forensic Analysis: Source System A (Agent Secure Gateway)

**Repository Target**: `F:\Agent-Secure-Gateway\Agent-Secure-Gateway.worktrees\agents-unique-hamster`  
**Analyzer**: Principal Systems Architect  
**Date**: July 26, 2026  

---

## 1. Executive Overview

Source System A (`Agent Secure Gateway` / `aegisagent`) is a high-speed runtime proxy enforcement, single-use capability token, and DLP/honeyfact defense gateway designed to sit between autonomous AI agents and external tools, models, databases, and network APIs.

---

## 2. Runtime Architecture & Execution Model

### Entry Points
- **Backend API Gateway**: `artifacts/api-server` (Express.js / Node.js backend)
- **Dashboard & Proxy UI**: `artifacts/agent-gate` (Next.js / React frontend)
- **Browser Extension**: `artifacts/chrome-extension` (Manifest v3 AI agent browser tool interceptor)
- **Mockup Sandbox**: `artifacts/mockup-sandbox` (Interactive prototype visualization engine)

### Request & Tool-Call Lifecycle
```text
User / Agent Tool Request
       │
       ▼
aegisagent-sdk (`aegis.fetch()` or `runWithAegisGuardrails()`)
       │
       ▼
/api/proxy (Validation: API Key `ag_live_`, DLP Scan, Honeyfact Verification)
       │
       ├──[BLOCKED] ──► Audit Log Entry & Security Event Issued
       │
       └──[ALLOWED] ──► Issue Short-Lived Single-Use Capability Token (`cap_...`)
                            │
                            ▼
/api/execute (Validation: Consume token exactly once)
                            │
                            ▼
Upstream API / Tool Execution (e.g. OpenAI, MCP Server, External DB)
```

---

## 3. Security Subsystem Identification

1. **Authentication & API Keys**:
   - Developer API keys prefixed with `ag_live_`.
   - JWT-based tenant user authentication for dashboard access.
2. **Capability Token Gateway**:
   - Single-use capability token design prevents direct API bypass.
   - Tokens expire within short configurable windows (e.g., 30s) and are burned on execution.
3. **Deception & Leak Detection**:
   - **Session-bound Honeyfacts**: Dynamic synthetic facts injected into prompt context. If transformed or leaked by RAG/agent tool calls, immediate high-confidence alerts are triggered.
   - **Honeytokens**: Deception credentials embedded into responses to catch credential scraping.
4. **Data Loss Prevention (DLP)**:
   - Format-preserving tokenization to mask sensitive enterprise PII/secrets before egress.
   - CaMeL (Control and Architecture for Multimodal LLMs) channel separation to isolate system instructions (control) from un-trusted external inputs (data).

---

## 4. Data Layer & Persistence

- **Database**: PostgreSQL
- **ORM**: Drizzle ORM (`lib/db`)
- **Core Tables**:
  - `tenants` / `users` (Multi-tenant account boundary)
  - `api_keys` (Developer authentication keys)
  - `firewall_rules` (Custom domain, IP, and tool restrictions)
  - `dlp_rules` (DLP patterns and masking rules)
  - `honeyfacts` / `honeytokens` (Session lures)
  - `audit_logs` / `security_events` (Append-only security log ledger)

---

## 5. Key Observation Points for Aegis Forge

To feed the continuous security improvement loop in Aegis Forge, System A exposes observation hooks at:
1. **User Prompt Ingestion**: `aegisagent-sdk` prompt wrapper (`runWithAegisGuardrails`).
2. **Tool-Call Request**: `/api/proxy` endpoint (capturing tool name, requested parameters, target URL).
3. **Security Violation Trigger**: DLP match or honeyfact detection in `/api/proxy`.
4. **Response Egress**: `/api/execute` completion wrapper.
