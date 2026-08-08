# Encryption and Key Management

Aegis relies on Envelope Encryption to protect sensitive payloads (such as confidential security evidence and credentials) at rest.

## Architecture
1. Customer Data is encrypted using a unique, per-object Data Encryption Key (DEK).
2. The DEK is then encrypted using a Master Key (KEK) managed in a centralized KMS (e.g., Vault, AWS KMS).
3. Aegis persists only the Encrypted DEK, the Algorithm, and the Key Version.

The Master Key is never exposed to the operational database.
