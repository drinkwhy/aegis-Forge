# Data Classification Standard

Aegis automatically infers data classification based on source, event type, and schema.

## Categories
- **PUBLIC**: General system health and unauthenticated marketing assets.
- **INTERNAL**: Non-sensitive operational metadata.
- **CONFIDENTIAL**: Business logic, private models, unreleased features.
- **RESTRICTED**: Privileged architecture details.
- **SECRET_REFERENCE**: Encrypted pointers to credentials (Aegis never stores plaintext secrets).
- **PERSONAL_DATA**: Identifiable user records.
- **SENSITIVE_PERSONAL_DATA**: Health, biometric, or highly regulated individual data.
- **AUTHENTICATION_DATA**: Login events and MFA states.
- **SECURITY_EVIDENCE**: Highly restricted proof of compliance controls.
- **REGULATED_DATA**: PCI or similarly strictly governed elements.
