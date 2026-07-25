# Aegis Forge — Monorepo

> **Continuous AI Security Validation Platform**

Aegis Forge automatically tests and validates the security of autonomous AI agents connected to internal tools, databases, and APIs via the Model Context Protocol (MCP).

---

## Repository Structure

```
aegis-forge/
├── apps/
│   └── web/                    # Next.js 15 security dashboard
├── services/
│   ├── control-plane/          # Go — campaign orchestration & API gateway
│   ├── sandbox-manager/        # Go — gVisor container lifecycle manager
│   ├── attack-generator/       # Python — Claude Sonnet adversarial engine
│   ├── evaluator-agent/        # Python — GPT-4o success detector
│   ├── analysis-engine/        # Python — FAIR-AI risk scoring
│   └── remediation-agent/      # Python — fix generation & PR automation
├── libs/
│   ├── aegisagent/             # Go SDK + Python package (runtime protection)
│   ├── canary-sdk/             # Go — canary token generation & detection
│   ├── roe-validator/          # Go — Rules of Engagement enforcement
│   └── graph-client/           # Go — Neo4j Cypher query library
├── infra/
│   ├── terraform/              # AWS infrastructure (IaC)
│   └── helm/                   # Kubernetes Helm charts
├── attack-corpus/              # Versioned adversarial test payloads (YAML)
└── docs/                       # Architecture decisions, API specs
```

## Architecture

The platform operates in two layers:

**AegisAgent** — A lightweight Go SDK embedded in customer agent deployments. Intercepts tool calls, proxies credentials through Vault, enforces turn limits, and streams telemetry.

**Aegis Forge Engine** — The continuous red-team and hardening pipeline. Spins up gVisor sandboxes, runs adversarial payloads, detects success via deterministic canary tokens, and embeds into CI/CD as a deployment gate.

## Competitive Moat

Three mutually reinforcing layers:
1. **Real-Time Agentic Adaptation** — Claude + GPT-4o dual-model RL loop discovers zero-day payloads continuously
2. **Proprietary Data Flywheel** — Every sandbox run that produces a bypass is stored in the attack corpus. This dataset compounds and cannot be replicated without the sandbox infrastructure.
3. **Embedded Fix-Validation Loop** — CI/CD plugin that fails builds with cryptographic proof if a fix doesn't hold against the attack that found the bug

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, D3.js |
| Control Plane | Go 1.23, Chi, pgx |
| Attack Engine | Python 3.12, FastAPI, Anthropic Claude |
| Evaluator | Python 3.12, FastAPI, OpenAI GPT-4o |
| Sandboxing | gVisor (runsc), eBPF tracing |
| Graph | Neo4j 5.x |
| Telemetry | ClickHouse 24.x |
| Secrets | HashiCorp Vault |
| Infrastructure | AWS EKS, Terraform |

## Getting Started

### Prerequisites
- Go 1.23+
- Python 3.12+ with `uv`
- Node.js 20+
- Docker + containerd
- AWS CLI configured
- Terraform 1.9+

### Local Development

```bash
# Clone and navigate
git clone https://github.com/your-org/aegis-forge
cd aegis-forge

# Install Node dependencies (Turborepo)
npm install

# Initialize Go workspace
go work sync

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys and AWS config

# Start all services
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# LLM APIs
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Database
DATABASE_URL=postgresql://aegis:password@localhost:5432/aegisforge

# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=...

# Auth0
AUTH0_DOMAIN=aegisforge.auth0.com
AUTH0_AUDIENCE=https://api.aegisforge.io

# Vault
VAULT_ADDR=http://localhost:8200
VAULT_TOKEN=...
```

### Infrastructure

```bash
# Bootstrap AWS infrastructure
cd infra/terraform/environments/dev
terraform init
terraform plan
terraform apply
```

## Security

Aegis Forge handles sensitive enterprise data (AI architectures, proprietary prompts, vulnerability evidence). Security controls:

- **Zero Trust** — Istio service mesh mTLS between all services
- **Multi-tenancy** — PostgreSQL Row-Level Security on all tenant data
- **Secrets** — HashiCorp Vault dynamic credentials; no static keys in code
- **Sandboxing** — gVisor user-space kernel; Firecracker microVMs at scale
- **Audit** — Append-only immutable audit ledger; cryptographic non-repudiation
- **Encryption** — AES-256 via AWS KMS; BYOK for enterprise customers

## Legal

All testing requires a cryptographically signed Rules of Engagement (RoE) document. The platform will not execute any campaign without a valid, signed, in-scope RoE. This provides CFAA safe harbor.

See `docs/legal/rules-of-engagement-template.md` for the RoE format.

---

*Aegis Forge is in active development. Not yet ready for production use.*
