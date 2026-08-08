# Subprocessor Inventory

Aegis maintains an automated, up-to-date registry of all third-party services that process customer data.

## Processing Activities
Stored in the `processing_activities` table, Aegis tracks:
- The subprocessor (e.g., OpenAI, Stripe, AWS).
- The specific categories of data they process.
- The region of processing.
- The active DPA status.

This allows Aegis to automatically generate the mandatory Subprocessor Disclosures required by GDPR and SOC 2.
