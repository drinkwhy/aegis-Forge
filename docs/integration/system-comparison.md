# System Comparison & Integration Matrix

**Integration Target**: Aegis Forge Monorepo  
**Date**: July 26, 2026  

---

## 1. Subsystem Capability Matrix

| System Domain | Source System A (`Agent Secure Gateway`) | Source System B (`Aegis Crucible`) | Integration Decision | Target Unified Component |
| :--- | :--- | :--- | :--- | :--- |
| **Runtime Interception** | TypeScript `aegis.fetch()` wrapper, Chrome extension | Go HTTP SDK middleware | **ADAPTER + SHARED CONTRACT** | `packages/aegisagent-sdk` + Go `libs/aegisagent` |
| **Gateway Proxy** | TS `/api/proxy` & `/api/execute` with capability tokens | Basic Go Chi Router | **PORT & ENHANCE IN GO** | `services/control-plane` (Go API Gateway) |
| **Deception & Lures** | Session Honeyfacts & DLP masking | Go Canary SDK | **MERGE & CROSS-INTEGRATE** | `packages/aegisagent-sdk` + `libs/canary-sdk` |
| **Sandboxing** | Mockup Sandbox | gVisor (`runsc`) + eBPF | **KEEP SYSTEM B** | `services/sandbox-manager` |
| **Attack Generator** | Redteam CLI script | Claude Sonnet RL Engine | **KEEP SYSTEM B** | `services/attack-generator` |
| **Breach Evaluator** | Static checks | GPT-4o Evaluator Agent | **KEEP SYSTEM B** | `services/evaluator-agent` |
| **Risk & Graph** | Simple audit log | FAIR-AI + Neo4j Cypher Client | **KEEP SYSTEM B** | `services/analysis-engine` + `libs/graph-client` |
| **Auto-Remediation** | None | Remediation Agent (Auto-PR) | **KEEP SYSTEM B** | `services/remediation-agent` |
| **Database Schema** | Drizzle ORM (PostgreSQL) | `pgx` Go SQL (PostgreSQL) | **UNIFIED PG SCHEMA** | `packages/db` + Postgres RLS |
| **UI Dashboard** | React Agent-Gate UI | Next.js 15 + Three.js 3D Anatomy | **KEEP SYSTEM B & ENHANCE** | `apps/web` |

---

## 2. Rationales for Architectural Decisions

1. **Keep System B Container Sandboxing & Attack Engine**: System B already implements production-grade container isolation via `gVisor` (`runsc`) and LLM red-teaming dual loops. System A's sandbox is a mockup prototype.
2. **Port System A Capability Tokens to Go Control Plane**: System A's single-use capability token design (`/api/proxy` -> `/api/execute`) provides strong cryptographic guarantee against direct tool call bypasses. Moving this logic to Go (`services/control-plane`) yields hardware-speed execution while maintaining TS client SDK compatibility.
3. **Unify Database Schema via Drizzle (`packages/db`)**: Use Drizzle ORM to define typed migrations for PostgreSQL. Export SQL/Go schemas so `control-plane` can perform raw `pgx` queries while Node services/SDKs access typed Drizzle queries.
4. **Wire 3D Intelligence Anatomy Canvas to Gateway Events**: Connect the live event bus (`SecurityEvent`) produced by System A's runtime proxy to the Three.js 3D Living Anatomy canvas in System B's Next.js app.
