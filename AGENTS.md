# Aegis Forge Agent Instructions

## Mission

Build Aegis Forge as a continuous AI security hardening platform.

## Architecture

Agent Secure Gateway:
- Runtime interception
- Tool-call enforcement
- Policy enforcement
- Telemetry

Aegis Crucible:
- Attack generation
- Sandboxing
- Evaluation
- Analysis
- Remediation

## Integration Rule

Do not perform blind repository-wide rewrites.

Before modifying code:
1. Inspect the relevant subsystem.
2. Identify existing contracts.
3. Check tests.
4. Make the smallest change necessary.
5. Run targeted verification.

## Scope Rule

Only modify files directly required by the current task.

Do not:
- rewrite unrelated services
- change database architecture without approval
- remove existing functionality
- modify security boundaries casually
- expose secrets

## Workflow

Analyze → Plan → Implement → Test → Report.