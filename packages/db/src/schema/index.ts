import { pgTable, uuid, text, timestamp, boolean, integer, numeric, jsonb } from "drizzle-orm/pg-core";

// Reuse existing tables or stub if they are defined elsewhere.
// Since we are writing the definitive packages/db schema, we define them.

export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  auth0Sub: text("auth0_sub").unique().notNull(),
  email: text("email").notNull(),
  role: text("role").default("member").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const campaigns = pgTable("campaigns", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
  name: text("name").notNull(),
  targetAgentId: text("target_agent_id"),
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const findings = pgTable("findings", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
  campaignId: uuid("campaign_id").notNull().references(() => campaigns.id),
  title: text("title").notNull(),
  severity: text("severity").notNull(),
  status: text("status").default("open").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Subject Snapshots
export const subjectSnapshots = pgTable("subject_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  systemId: text("system_id").notNull(),
  subjectFingerprint: text("subject_fingerprint").notNull(),
  snapshotData: jsonb("snapshot_data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Evidence Artifacts
export const evidenceArtifacts = pgTable("evidence_artifacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  evidenceType: text("evidence_type").notNull(),
  subjectType: text("subject_type").notNull(),
  subjectId: text("subject_id").notNull(),
  sourceSystem: text("source_system").notNull(),
  sourceRecordId: text("source_record_id"),
  capturedAt: timestamp("captured_at").notNull(),
  validFrom: timestamp("valid_from").notNull(),
  expiresAt: timestamp("expires_at"),
  contentHash: text("content_hash").notNull(),
  storageUri: text("storage_uri").notNull(),
  schemaVersion: text("schema_version").notNull(),
  collectorIdentity: text("collector_identity").notNull(),
  reviewerIdentity: text("reviewer_identity"),
  reviewStatus: text("review_status").default("UNREVIEWED").notNull(),
  frameworkId: text("framework_id").notNull(),
  frameworkVersionId: text("framework_version_id").notNull(),
  requirementId: text("requirement_id").notNull(),
  integrityStatus: text("integrity_status").default("UNKNOWN").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Evidence Manifests
export const evidenceManifests = pgTable("evidence_manifests", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  manifestHash: text("manifest_hash").unique().notNull(),
  evidenceIds: uuid("evidence_ids").array().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Validation Executions
export const validationExecutions = pgTable("validation_executions", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  campaignId: uuid("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),
  status: text("status").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Validation Results
export const validationResults = pgTable("validation_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  executionId: uuid("execution_id").notNull().references(() => validationExecutions.id, { onDelete: "cascade" }),
  testSuite: text("test_suite").notNull(),
  passed: boolean("passed").notNull(),
  score: numeric("score").notNull(),
  details: jsonb("details").default({}).notNull(),
});

// Control Evaluations
export const controlEvaluations = pgTable("control_evaluations", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  controlId: text("control_id").notNull(),
  status: text("status").notNull(),
  lastEvaluatedAt: timestamp("last_evaluated_at").defaultNow().notNull(),
});

// Finding Dispositions
export const findingDispositions = pgTable("finding_dispositions", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  findingId: uuid("finding_id").notNull().references(() => findings.id, { onDelete: "cascade" }),
  disposition: text("disposition").notNull(),
  owner: text("owner").notNull(),
  justification: text("justification").notNull(),
  approver: text("approver").notNull(),
  expiresAt: timestamp("expires_at"),
  linkedEvidenceId: uuid("linked_evidence_id").references(() => evidenceArtifacts.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Assurance Evaluations
export const assuranceEvaluations = pgTable("assurance_evaluations", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  frameworkVersionId: text("framework_version_id").notNull(),
  subjectSnapshotId: uuid("subject_snapshot_id").notNull().references(() => subjectSnapshots.id, { onDelete: "restrict" }),
  evaluatedAt: timestamp("evaluated_at").defaultNow().notNull(),
  engineVersion: text("engine_version").notNull(),
  status: text("status").notNull(),
  overallScore: numeric("overall_score").notNull(),
  confidence: numeric("confidence").notNull(),
  controlCoverage: numeric("control_coverage").notNull(),
  evidenceCoverage: numeric("evidence_coverage").notNull(),
  validationPassRate: numeric("validation_pass_rate").notNull(),
  criticalFindingCount: integer("critical_finding_count").notNull(),
  highFindingCount: integer("high_finding_count").notNull(),
  unmetRequirements: text("unmet_requirements").array().notNull(),
  acceptedExceptions: text("accepted_exceptions").array().notNull(),
  revocationReasons: text("revocation_reasons").array().notNull(),
  evidenceManifestHash: text("evidence_manifest_hash").notNull(),
  subjectFingerprint: text("subject_fingerprint").notNull(),
});

// Security Passports
export const securityPassports = pgTable("security_passports", {
  passportId: uuid("passport_id").defaultRandom().primaryKey(),
  passportVersion: text("passport_version").default("1.0").notNull(),
  organizationId: uuid("organization_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  systemId: text("system_id").notNull(),
  systemDisplayName: text("system_display_name").notNull(),
  frameworkId: text("framework_id").notNull(),
  frameworkVersionId: text("framework_version_id").notNull(),
  frameworkFingerprint: text("framework_fingerprint").notNull(),
  assuranceEvaluationId: uuid("assurance_evaluation_id").notNull().references(() => assuranceEvaluations.id, { onDelete: "restrict" }),
  subjectFingerprint: text("subject_fingerprint").notNull(),
  evidenceManifestHash: text("evidence_manifest_hash").notNull(),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
  validUntil: timestamp("valid_until").notNull(),
  status: text("status").notNull(),
  assuranceLevel: text("assurance_level").notNull(),
  scopeSummary: jsonb("scope_summary").default({}).notNull(),
  resultsSummary: jsonb("results_summary").default({}).notNull(),
  limitations: text("limitations").array().notNull(),
  issuer: jsonb("issuer").default({}).notNull(),
  signature: jsonb("signature").default({}).notNull(),
  payloadHash: text("payload_hash").unique().notNull(),
});

// Passport Exceptions
export const passportExceptions = pgTable("passport_exceptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  passportId: uuid("passport_id").notNull().references(() => securityPassports.passportId, { onDelete: "cascade" }),
  requirementId: text("requirement_id").notNull(),
  justification: text("justification").notNull(),
  approvedBy: text("approved_by").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  compensatingControl: text("compensating_control").notNull(),
  residualRisk: text("residual_risk").notNull(),
});

// Passport Status Events
export const passportStatusEvents = pgTable("passport_status_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  passportId: uuid("passport_id").notNull().references(() => securityPassports.passportId, { onDelete: "cascade" }),
  sequence: integer("sequence").notNull(),
  status: text("status").notNull(),
  reason: text("reason"),
  transitionedBy: text("transitioned_by").notNull(),
  transitionedAt: timestamp("transitioned_at").defaultNow().notNull(),
});

// Signing Key References
export const signingKeyReferences = pgTable("signing_key_references", {
  id: uuid("id").defaultRandom().primaryKey(),
  keyId: text("key_id").unique().notNull(),
  algorithm: text("algorithm").default("Ed25519").notNull(),
  provider: text("provider").notNull(),
  status: text("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// External Verification Tokens
export const externalVerificationTokens = pgTable("external_verification_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  passportId: uuid("passport_id").notNull().references(() => securityPassports.passportId, { onDelete: "cascade" }),
  token: text("token").unique().notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
