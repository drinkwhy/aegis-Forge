# Data Residency Architecture

Aegis supports strict geographical bounding of customer data via `DataRegion` configurations.

## Enforcement
- Evidence and sensitive payloads are bound to the storage bucket located in the assigned region (e.g., EU-Central, US-East).
- Cross-region replication is disabled for regulated classifications unless explicitly configured by the customer.
- Operational metadata traversing regions is minimized and anonymized.
