# Privacy and Data Minimization

Aegis operates on the principle of collecting the bare minimum required to prove security and compliance.

## Enforcement
- **RedactionService**: Strips PII, credit cards, API keys, and bearer tokens from logs and telemetry before persistence.
- **Format-Preserving Tokenization**: Identifiers (like emails) are replaced with irreversible correlatable tokens to track session behavior without exposing raw identity.
- **Purpose Limitation**: Data collected for Runtime Protection cannot be implicitly reused for irrelevant operational purposes without explicit consent.
