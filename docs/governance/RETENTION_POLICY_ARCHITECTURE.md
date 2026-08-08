# Retention Policy Architecture

Aegis does not retain data "just in case." Retention policies are automatically mapped to data classifications.

## Lifecycle Enforcement
The `RetentionPolicyEngine` runs continuously via background workers.
- Records matching their retention duration are permanently deleted.
- A `DeletionReceipt` is generated, providing cryptographic proof of adherence.
- `LegalHold` overrides normal deletion schedules when active.

## Default Bounds
- Runtime Telemetry: 30-90 Days
- Security Evidence: 1-3 Years
- Billing Data: 7 Years (Financial requirement)
