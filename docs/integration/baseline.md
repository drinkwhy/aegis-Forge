# Baseline State Record

**Repository Target**: Aegis Forge Baseline (`f:\Aegis Crucible`)  
**Date**: July 26, 2026  
**Status**: Pre-Integration Baseline  

---

## 1. System A (`agents-unique-hamster`) Baseline
- **Location**: `F:\Agent-Secure-Gateway\Agent-Secure-Gateway.worktrees\agents-unique-hamster`
- **Monorepo Manager**: `pnpm` workspaces
- **Working Tree**: Clean baseline worktree
- **Core Components**:
  - `artifacts/agent-gate`: React / Next.js proxy control dashboard
  - `artifacts/api-server`: Node.js Express execution gateway
  - `artifacts/chrome-extension`: Manifest v3 browser agent interceptor
  - `lib/aegis-core`: Domain interfaces & schemas
  - `lib/aegisagent-sdk`: Guarded fetch wrapper, CaMeL prompt parser, honeyfacts engine
  - `lib/db`: Drizzle ORM schema for PostgreSQL

---

## 2. System B (`Aegis Crucible`) Baseline
- **Location**: `F:\Aegis Crucible`
- **Monorepo Manager**: Turborepo + Go Workspaces (`go.work` Go 1.26.5 compiler target)
- **Git Branch**: `master`
- **Head Commit**: `42c50edba1a147f9c942f0f7dcbc016aadaa06e9`
- **Working Tree**:
  - Modified: `.env.example`, `apps/web/package.json`, `apps/web/package-lock.json`, `apps/web/src/components/charts/AttackPathGraph.tsx`
  - Untracked: `docker-compose.yml`, `go.work.sum`, `packages/`, `.env.txt`
- **Core Components**:
  - `services/control-plane`: Go 1.23 REST API & campaign orchestrator
  - `services/sandbox-manager`: Go 1.23 gVisor (`runsc`) container manager
  - `services/attack-generator`: Python 3.12 Claude 3.5 Sonnet attack generator
  - `services/evaluator-agent`: Python 3.12 GPT-4o compromise evaluator
  - `services/analysis-engine`: Python 3.12 FAIR-AI risk engine & Council of Titans
  - `libs/canary-sdk`: Go HMAC canary token & sinkhole server
  - `libs/roe-validator`: Go Rules of Engagement CFAA safe harbor engine
  - `apps/web`: Next.js 15 App Router with 3D WebGL Living Anatomy Canvas (`IntelligenceAnatomy3D.tsx`)

---

## 3. Pre-Integration Verification Baseline
- **Go Workspace**: Sync verified via `go work sync`.
- **Node Workspace**: pnpm and npm packages indexed.
- **Docker Compose**: 5 services declared (PostgreSQL 16, Neo4j 5.20, ClickHouse 24, Redpanda Kafka 24.1, HashiCorp Vault 1.15).
