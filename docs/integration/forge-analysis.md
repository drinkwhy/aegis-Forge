# Forensic Analysis: Source System B (Aegis Crucible)

**Repository Target**: `F:\aegis crucible`  
**Analyzer**: Principal Systems Architect  
**Date**: July 26, 2026  

---

## 1. Executive Overview

Source System B (`Aegis Crucible`) is an enterprise continuous AI red-teaming, sandboxed vulnerability testing, automated remediation, and 3D visualization platform.

---

## 2. Microservice & Architecture Breakdown

```text
aegis-crucible/
├── apps/web                   # Next.js 15 Security Dashboard & 3D WebGL Living Anatomy
├── services/
│   ├── control-plane          # Go 1.23 — Campaign orchestration & API gateway (Chi, pgx)
│   ├── sandbox-manager        # Go 1.23 — gVisor (runsc) container lifecycle manager
│   ├── attack-generator       # Python 3.12 — Claude 3.5 Sonnet adversarial engine
│   ├── evaluator-agent        # Python 3.12 — GPT-4o success & breach detector
│   ├── analysis-engine        # Python 3.12 — FAIR-AI risk scoring & topological analysis
│   ├── remediation-agent      # Python 3.12 — Auto-fix generation & PR automation
│   └── api-server             # Go/REST supplementary backend API
├── libs/
│   ├── aegisagent             # Go runtime protection SDK
│   ├── canary-sdk             # Go canary token generation & detection library
│   ├── roe-validator          # Go Rules of Engagement cryptographic validator
│   └── graph-client           # Go Neo4j Cypher query library
├── attack-corpus/             # Versioned YAML attack vectors & honeypot payloads
└── infra/                     # Terraform (AWS EKS) & Helm charts
```

---

## 3. Core Component Analysis

### 1. `control-plane` (`services/control-plane`)
- **Language**: Go 1.23
- **Function**: Central orchestrator. Manages security validation campaigns, experiment workflows, tenant boundaries, and audit persistence via PostgreSQL (`pgx`).

### 2. `sandbox-manager` (`services/sandbox-manager`)
- **Language**: Go 1.23
- **Function**: Provisions isolated gVisor (`runsc`) containers for running live agent attacks safely without risking host infrastructure compromise. Uses eBPF probes for kernel-level syscall tracing.

### 3. `attack-generator` (`services/attack-generator`)
- **Language**: Python 3.12 (FastAPI)
- **Function**: Powered by Anthropic Claude 3.5 Sonnet. Continuously synthesizes adaptive prompt injections, tool misuse chains, and multi-step bypass attempts against target agents.

### 4. `evaluator-agent` (`services/evaluator-agent`)
- **Language**: Python 3.12 (FastAPI)
- **Function**: Independent judge powered by OpenAI GPT-4o. Evaluates sandbox execution logs and canary detections to verify whether an attack was successful with high confidence.

### 5. `analysis-engine` (`services/analysis-engine`)
- **Language**: Python 3.12
- **Function**: Implements FAIR-AI quantitative risk models. Computes risk scores and feeds attack paths into the Neo4j Graph database via `libs/graph-client`.

### 6. `remediation-agent` (`services/remediation-agent`)
- **Language**: Python 3.12
- **Function**: Generates defensive prompt modifications, firewall rules, and code patches. Opens automated PRs to harden victim agents against discovered vulnerabilities.

### 7. `apps/web` (Dashboard & 3D Anatomy Canvas)
- **Language**: Next.js 15, TypeScript, Three.js, React
- **Function**: Executive security dashboard. Features an interactive **3D WebGL Living Intelligence Human Anatomy Canvas** ([IntelligenceAnatomy3D.tsx](file:///f:/Aegis%20Crucible/apps/web/src/components/3d/IntelligenceAnatomy3D.tsx)) mapping agent organ health (Head, Core, Spine, Egress Arms, Forge) to real-time security events.

---

## 4. Legal Safety & Rules of Engagement

System B enforces strict **CFAA safe harbor compliance** via `libs/roe-validator`. No adversarial attack campaign can execute without a cryptographically signed Rules of Engagement (RoE) document defining target scope, time limits, resource caps, and authorized objectives.
