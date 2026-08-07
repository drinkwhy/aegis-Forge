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

// Launch Assessment

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerUserId: text("owner_user_id").notNull(),
  displayName: text("display_name").notNull(),
  slug: text("slug").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const organizationMembers = pgTable("organization_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  role: text("role").default("member").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const assets = pgTable("assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  ownerUserId: text("owner_user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  assetType: text("asset_type").notNull(), // 'openai_compatible', 'mcp_server'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const auditOrders = pgTable("audit_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "restrict" }),
  purchaserUserId: text("purchaser_user_id").notNull(),
  assetId: uuid("asset_id").notNull().references(() => assets.id, { onDelete: "restrict" }),
  productCode: text("product_code").default("AEGIS_VERIFIED_LAUNCH_ASSESSMENT").notNull(),
  status: text("status").default("DRAFT").notNull(),
  amount: integer("amount").default(0).notNull(),
  currency: text("currency").default("usd").notNull(),
  stripeCheckoutSessionId: text("stripe_checkout_session_id").unique(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  paidAt: timestamp("paid_at"),
  passportId: uuid("passport_id").references(() => securityPassports.passportId, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const auditTargets = pgTable("audit_targets", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "restrict" }),
  auditOrderId: uuid("audit_order_id").notNull().references(() => auditOrders.id, { onDelete: "restrict" }),
  assetId: uuid("asset_id").notNull().references(() => assets.id, { onDelete: "restrict" }),
  targetType: text("target_type").notNull(), // 'openai_compatible', 'mcp_server'
  endpoint: text("endpoint").notNull(),
  authenticationReference: text("authentication_reference"),
  environment: text("environment").default("production").notNull(),
  ownershipConfirmed: boolean("ownership_confirmed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const rulesOfEngagement = pgTable("rules_of_engagement", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "restrict" }),
  auditOrderId: uuid("audit_order_id").notNull().references(() => auditOrders.id, { onDelete: "restrict" }),
  targetId: uuid("target_id").notNull().references(() => auditTargets.id, { onDelete: "restrict" }),
  authorizedDomains: text("authorized_domains").array().notNull().default([]),
  authorizedEndpoints: text("authorized_endpoints").array().notNull().default([]),
  permittedTests: text("permitted_tests").array().notNull().default([]),
  prohibitedActions: text("prohibited_actions").array().notNull().default([]),
  rateLimit: integer("rate_limit").default(10).notNull(),
  testingWindowStart: timestamp("testing_window_start"),
  testingWindowEnd: timestamp("testing_window_end"),
  emergencyContact: text("emergency_contact").notNull(),
  signedByUserId: text("signed_by_user_id"),
  signedAt: timestamp("signed_at"),
  expiresAt: timestamp("expires_at"),
  status: text("status").default("DRAFT").notNull(), // 'DRAFT','ACTIVE','EXPIRED','REVOKED'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const assessmentExecutions = pgTable("assessment_executions", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "restrict" }),
  auditOrderId: uuid("audit_order_id").notNull().references(() => auditOrders.id, { onDelete: "restrict" }),
  targetId: uuid("target_id").notNull().references(() => auditTargets.id, { onDelete: "restrict" }),
  status: text("status").default("QUEUED").notNull(), // 'QUEUED','RUNNING','COMPLETE','FAILED','CANCELED'
  totalTests: integer("total_tests").default(0).notNull(),
  completedTests: integer("completed_tests").default(0).notNull(),
  failedTests: integer("failed_tests").default(0).notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  failureReason: text("failure_reason"),
  workerId: text("worker_id"),
  correlationId: text("correlation_id").notNull(), // should be a uuid as text
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const assessmentTestResults = pgTable("assessment_test_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "restrict" }),
  executionId: uuid("execution_id").notNull().references(() => assessmentExecutions.id, { onDelete: "cascade" }),
  testDefinitionId: text("test_definition_id").notNull(),
  testCategory: text("test_category").notNull(),
  status: text("status").notNull(), // 'PASS','FAIL','ERROR','SKIPPED'
  passed: boolean("passed").notNull(),
  severity: text("severity").notNull(), // 'CRITICAL','HIGH','MEDIUM','LOW','INFO'
  requestSummary: text("request_summary"),
  redactedResponse: text("redacted_response"),
  evidenceHash: text("evidence_hash"),
  durationMs: integer("duration_ms"),
  error: text("error"),
  executedAt: timestamp("executed_at").defaultNow().notNull(),
});

export const auditReviews = pgTable("audit_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "restrict" }),
  auditOrderId: uuid("audit_order_id").notNull().references(() => auditOrders.id, { onDelete: "restrict" }),
  reviewerUserId: text("reviewer_user_id").notNull(),
  decision: text("decision").notNull(), // 'APPROVED','REJECTED','REMEDIATION_REQUIRED','RETEST_REQUIRED'
  notes: text("notes"),
  reviewedAt: timestamp("reviewed_at").defaultNow().notNull(),
});

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "set null" }),
  auditOrderId: uuid("audit_order_id").references(() => auditOrders.id, { onDelete: "set null" }),
  eventType: text("event_type").notNull(),
  actorUserId: text("actor_user_id"),
  actorType: text("actor_type").default("user").notNull(),
  payload: jsonb("payload").default({}).notNull(),
  occurredAt: timestamp("occurred_at").defaultNow().notNull(),
});

export const stripeEvents = pgTable("stripe_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  stripeEventId: text("stripe_event_id").unique().notNull(),
  eventType: text("event_type").notNull(),
  processedAt: timestamp("processed_at").defaultNow().notNull(),
});

export const userRoles = pgTable("user_roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkUserId: text("clerk_user_id").unique().notNull(),
  role: text("role").default("customer").notNull(), // 'customer','reviewer','admin'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
