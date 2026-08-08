# Audit Logging Standard

Aegis maintains dual-logging streams: Operational Observability and Cryptographic Auditing.

## Cryptographic Ledger
Important state changes (Logins, Evidence Creation, Policy Modification, Passport Issuance) are written to the `cryptographic_audit_events` table.
- Each event stores a `payload_hash` and a `previous_event_hash`, establishing a tamper-evident chain.
- The ledger is append-only.

## Operational Logs
Standard debug/info logs are heavily sanitized by the Redaction Engine. Secrets are never printed to STDOUT or sent to third-party observability platforms.
