# Evidence Chain of Custody

All security and compliance evidence collected by Aegis is strictly governed to prevent tampering.

## Mechanics
- **Cryptographic Hashing**: Upon collection, evidence is immediately hashed (SHA-256) and the hash is immutable.
- **Evidence Manifests**: Groupings of evidence are bundled into a signed Manifest. If a single underlying evidence artifact changes, the Manifest hash invalidates.
- **Immutability**: Approved evidence cannot be modified. If a correction is necessary, a new evidence record is generated which supersedes the original.
