# Aegis Forge Unified Integration Architecture Blueprint

**Target Repository**: `Aegis Forge`  
**Architect**: Principal Systems Architect  
**Date**: July 26, 2026  

---

## 1. Unified Architecture Topology

```text
                               ┌──────────────────────────────────────────────┐
                               │           AEGIS FORGE CONTROL PLANE          │
                               │        (Go 1.23 / Chi / PostgreSQL)          │
                               │                                              │
                               │  Campaigns  •  Experiments  •  Findings      │
                               │  Capability Tokens  •  Sentinel Staging     │
                               └──────────────────────┬───────────────────────┘
                                                      │
                       ┌──────────────────────────────┴──────────────────────────────┐
                       │                                                             │
                       ▼                                                             ▼
        ┌─────────────────────────────┐                               ┌─────────────────────────────┐
        │   RUNTIME PROTECTION GATE   │                               │    SANDBOXED RED TEAMING    │
        │   (System A Integration)    │                               │    (System B Integration)   │
        │                             │                               │                             │
        │  • aegisagent TS/Go SDK     │                               │  • gVisor Sandbox Manager   │
        │  • Chrome Agent Extension   │                               │  • Claude Attack Generator  │
        │  • /api/proxy Guarded Fetch │                               │  • GPT-4o Evaluator Agent   │
        │  • Honeyfacts & DLP Masking │                               │  • FAIR-AI Analysis Engine  │
        │  • Single-Use Cap Tokens    │                               │  • Remediation Agent (PRs)  │
        └──────────────┬──────────────┘                               └──────────────┬──────────────┘
                       │                                                             │
                       └──────────────────────────────┬──────────────────────────────┘
                                                      │
                                                      ▼
                              ┌──────────────────────────────────────────────┐
                              │             3D LIVING INTELLIGENCE           │
                              │                  ANATOMY UI                  │
                              │           (Next.js 15 / Three.js)            │
                              │                                              │
                              │ Head: Cognition & Model Engine               │
                              │ Core: Sentinel Governance                    │
                              │ Spine: Honeyfacts & Context Memory           │
                              │ Arms: Egress Proxy & Capability Tokens       │
                              └──────────────────────────────────────────────┘
```

---

## 2. Shared Event Bus Contract (`SecurityEvent`)

Every component emits and consumes standardized `SecurityEvent` structs:

```json
{
  "id": "evt_01J9X8A1Z",
  "tenant_id": "tenant_enterprise_01",
  "agent_id": "agent_financial_advisor",
  "session_id": "sess_88192a3",
  "correlation_id": "corr_49120aef",
  "timestamp": "2026-07-26T05:35:00Z",
  "source": "aegisagent-runtime-proxy",
  "event_type": "HONEYFACT_LEAK_DETECTED",
  "severity": "CRITICAL",
  "payload": {
    "tool_name": "execute_sql_query",
    "leaked_fact": "SECRET_SALES_LURE_9912",
    "target_destination": "https://unauthorized-exfil.com",
    "blocked_by_sentinel": true
  },
  "provenance": {
    "ip": "10.0.4.12",
    "sdk_version": "aegisagent-ts-1.2.0"
  }
}
```

---

## 3. The Continuous AI Hardening Loop (MVP Vertical Slice)

1. **Observe**: Agent attempts tool action guarded by `@workspace/aegisagent-sdk`.
2. **Detect**: System A's honeyfact engine detects sensitive lure leakage or unauthorized parameters -> Emits `HONEYFACT_LEAK_DETECTED` `SecurityEvent`.
3. **Orchestrate**: Go `control-plane` verifies Rules of Engagement (`libs/roe-validator`) and creates a new `Experiment`.
4. **Sandbox**: `sandbox-manager` provisions a gVisor (`runsc`) container mirroring the target agent.
5. **Attack & Evaluate**: `attack-generator` (Claude) mutates the attack string; `evaluator-agent` (GPT-4o) confirms breach capability.
6. **Analyze**: `analysis-engine` calculates FAIR-AI risk score and updates Neo4j attack graph (`libs/graph-client`).
7. **Defend**: `remediation-agent` generates a defensive policy (`Sentinel`).
8. **Validate**: Sentinel is differential-tested against benign and mutated payloads.
9. **Stage & Enforce**: Validated Sentinel is pushed to `control-plane`, immediately enforcing the new firewall rule at the runtime proxy.
10. **Visualize**: Next.js dashboard updates the **3D WebGL Living Intelligence Human Anatomy Model**, transitioning organ status in real-time.
