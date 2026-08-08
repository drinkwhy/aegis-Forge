# Tenant Isolation Verification

Aegis employs defense-in-depth to guarantee data separation between customers.

## Layers of Isolation
1. **Application RBAC**: Standard role-based access checks at the API boundary.
2. **PostgreSQL Row-Level Security (RLS)**: The database engine physically rejects queries that attempt to read rows belonging to an `organization_id` not matching the active session's context.
3. **Scoped Service Identities**: Internal microservices do not share a single omnipotent database credential. They assume narrowly scoped roles.

Automated validation suites continuously prove that Tenant A cannot access Tenant B's records under any circumstance.
