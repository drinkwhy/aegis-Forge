# ADR-001: Sandboxing Technology Selection

## Status
Accepted

## Date
2026-07-25

## Context

Aegis Forge must execute adversarial attack simulations including code interpreter testing, MCP tool execution, and indirect prompt injection — all of which carry real risk of sandbox escape or data exfiltration if isolation fails.

We evaluated four sandboxing technologies:

| Technology | Isolation | Startup | Kubernetes-Native | Requires Bare Metal |
|---|---|---|---|---|
| Standard containers | Kernel-shared | <1s | Yes | No |
| Firecracker microVMs | Hardware (KVM) | ~125ms | No | Yes (KVM) |
| gVisor (runsc) | User-space kernel | <1s | Yes | No |
| WebAssembly (Wasm) | Capability-scoped | <1ms | No | No |

## Decision

**MVP and initial SaaS offering: gVisor (runsc) on EKS standard instances.**

**Planned migration at scale: Firecracker microVMs on bare-metal EC2.**

### Rationale for gVisor MVP choice

1. **No bare-metal required**: gVisor runs on standard EC2 instances via EKS node group configuration (`RuntimeClass: gvisor`). Firecracker requires KVM, which only exists on bare-metal instances (`c6i.metal`, `m6i.metal`) costing ~10x more per hour.

2. **Kubernetes-native**: gVisor integrates as a `RuntimeClass` in Kubernetes. Standard containerd + `runsc` shim. No additional infrastructure orchestration required beyond setting `runtimeClassName: gvisor` in pod specs.

3. **User-space kernel**: gVisor intercepts all syscalls in user space via its `ptrace` or `KVM` mode. Even if an attacker achieves code execution within the sandbox, they cannot escape to the host kernel because they're talking to a virtualized kernel (Sentry), not the real one.

4. **EKS compatibility**: AWS EKS supports custom runtime classes. We can run mixed node groups — standard nodes for control plane services, gVisor nodes for sandbox execution.

5. **Performance acceptable for testing cadence**: gVisor adds ~15% syscall latency overhead. For our use case (testing AI agents that are primarily I/O bound on LLM API calls), this is negligible. We are not building a high-frequency trading system.

### Why not Firecracker for MVP

- Requires bare-metal EC2 instances at $3-8/hour vs. $0.17/hour for t3.large
- Complex VMM orchestration (jailer, network tap devices, vsock) adds significant engineering overhead
- Cannot run on EKS managed nodes — requires self-managed node groups on bare metal
- Estimated 3-4 additional weeks of infrastructure engineering for MVP timeline

### Planned Firecracker Migration

When the platform reaches multi-tenant SaaS scale (>50 concurrent campaigns), we will migrate to Firecracker:
- Hardware-level KVM isolation is stronger than user-space kernel interception
- Firecracker starts in ~125ms — comparable to container startup
- At scale, the cost difference (bare metal is more efficient per-VM at density) reverses
- Self-serve SaaS customers with arbitrary, unvetted agent configurations warrant stronger isolation

## Consequences

- MVP launch is unblocked; no bare-metal procurement needed
- gVisor isolation is strong enough for design partners with known, vetted agent configurations
- We must track gVisor CVEs and security advisories as a first-class concern
- The sandbox manager service must abstract the runtime (gVisor vs Firecracker) behind an interface to make the migration straightforward
- The Terraform EKS module must configure the `gvisor` RuntimeClass from day one

## References

- [gVisor Security Model](https://gvisor.dev/docs/architecture_guide/security/)
- [Firecracker Design](https://firecracker-microvm.github.io/)
- [EKS RuntimeClass Configuration](https://docs.aws.amazon.com/eks/latest/userguide/container-runtime.html)
