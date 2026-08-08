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
  auditCaseId: uuid("audit_case_id").references(() => auditCases.id, { onDelete: "cascade" }),
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
  auditCaseId: uuid("audit_case_id").references(() => auditCases.id, { onDelete: "cascade" }),
  evidenceType: text("evidence_type").notNull(),
  subjectType: text("subject_type").notNull(),
  subjectId: text("subject_id").notNull(),
  sourceSystem: text("source_system").notNull(),
  sourceRecordId: text("source_record_id"),
  capturedAt: timestamp("captured_at").notNull(),
  validFrom: timestamp("valid_from").notNull(),
  expiresAt: timestamp("expires_at"),
  contentHash: text("content_hash").notNull(),
  hashAlgorithm: text("hash_algorithm").default("SHA-256").notNull(),
  storageUri: text("storage_uri").notNull(), // should be encrypted object storage URI
  schemaVersion: text("schema_version").notNull(),
  collectorIdentity: text("collector_identity").notNull(),
  reviewerIdentity: text("reviewer_identity"),
  reviewStatus: text("review_status").default("UNREVIEWED").notNull(),
  frameworkId: text("framework_id").notNull(),
  frameworkVersionId: text("framework_version_id").notNull(),
  requirementId: text("requirement_id").notNull(),
  integrityStatus: text("integrity_status").default("UNKNOWN").notNull(),
  classification: text("classification").default("SECURITY_EVIDENCE").notNull(),
  retentionPolicyId: text("retention_policy_id"),
  deletionState: text("deletion_state").default("ACTIVE").notNull(), // 'ACTIVE', 'ARCHIVED', 'DELETED'
  residencyRegion: text("residency_region").default("US").notNull(),
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
  auditCaseId: uuid("audit_case_id").references(() => auditCases.id, { onDelete: "cascade" }),
  assetId: uuid("asset_id").references(() => assets.id, { onDelete: "cascade" }),
  frameworkId: text("framework_id").notNull(),
  frameworkVersion: text("framework_version").notNull(),
  controlId: text("control_id").notNull(),
  status: text("status").notNull(), // PASS, PARTIAL, FAIL, NOT_APPLICABLE, NEEDS_EVIDENCE, EXCEPTION_REQUESTED, EXCEPTION_APPROVED, EXCEPTION_REJECTED
  evidenceIds: uuid("evidence_ids").array().default([]).notNull(),
  assessmentResultIds: uuid("assessment_result_ids").array().default([]).notNull(),
  findingIds: uuid("finding_ids").array().default([]).notNull(),
  confidence: numeric("confidence"),
  evaluatorVersion: text("evaluator_version"),
  explanation: text("explanation"),
  remediationGuidance: text("remediation_guidance"),
  lastEvaluatedAt: timestamp("last_evaluated_at").defaultNow().notNull(),
  nextEvaluationAt: timestamp("next_evaluation_at"),
  reviewerStatus: text("reviewer_status"),
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
  auditCaseId: uuid("audit_case_id").references(() => auditCases.id, { onDelete: "cascade" }),
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
  auditCaseId: uuid("audit_case_id").references(() => auditCases.id, { onDelete: "cascade" }),
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

export const auditCases = pgTable("audit_cases", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  status: text("status").default("DRAFT").notNull(),
  readinessScore: numeric("readiness_score"),
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
  auditCaseId: uuid("audit_case_id").references(() => auditCases.id, { onDelete: "cascade" }),
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
  auditCaseId: uuid("audit_case_id").references(() => auditCases.id, { onDelete: "cascade" }),
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
  auditCaseId: uuid("audit_case_id").references(() => auditCases.id, { onDelete: "cascade" }),
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
  auditCaseId: uuid("audit_case_id").references(() => auditCases.id, { onDelete: "cascade" }),
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
  auditCaseId: uuid("audit_case_id").references(() => auditCases.id, { onDelete: "cascade" }),
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
  auditCaseId: uuid("audit_case_id").references(() => auditCases.id, { onDelete: "cascade" }),
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
  auditCaseId: uuid("audit_case_id").references(() => auditCases.id, { onDelete: "cascade" }),
  auditOrderId: uuid("audit_order_id").notNull().references(() => auditOrders.id, { onDelete: "restrict" }),
  reviewerUserId: text("reviewer_user_id").notNull(),
  decision: text("decision").notNull(), // 'APPROVED','REJECTED','REMEDIATION_REQUIRED','RETEST_REQUIRED'
  notes: text("notes"),
  reviewedAt: timestamp("reviewed_at").defaultNow().notNull(),
});

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "set null" }),
  auditCaseId: uuid("audit_case_id").references(() => auditCases.id, { onDelete: "cascade" }),
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

// Compliance Engine

export const frameworks = pgTable("frameworks", {
  id: text("id").primaryKey(), // e.g., 'eu_ai_act', 'iso_42001'
  name: text("name").notNull(),
  version: text("version").notNull(),
  jurisdiction: text("jurisdiction"),
  publisher: text("publisher").notNull(),
  type: text("type").notNull(),
  effectiveDate: timestamp("effective_date"),
  deprecatedAt: timestamp("deprecated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const frameworkControls = pgTable("framework_controls", {
  id: uuid("id").defaultRandom().primaryKey(),
  frameworkId: text("framework_id").notNull().references(() => frameworks.id, { onDelete: "cascade" }),
  frameworkVersion: text("framework_version").notNull(),
  controlCode: text("control_code").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  controlType: text("control_type").notNull(),
  severity: text("severity").notNull(),
  requiredEvidenceTypes: text("required_evidence_types").array().default([]).notNull(),
  requiredTestCategories: text("required_test_categories").array().default([]).notNull(),
  guidance: text("guidance"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const complianceProfiles = pgTable("compliance_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  auditCaseId: uuid("audit_case_id").unique().notNull().references(() => auditCases.id, { onDelete: "cascade" }),
  assetId: uuid("asset_id").notNull().references(() => assets.id, { onDelete: "cascade" }),
  jurisdictions: text("jurisdictions").array().default([]).notNull(),
  organizationType: text("organization_type"),
  aiSystemPurpose: text("ai_system_purpose"),
  aiClassification: text("ai_classification"),
  dataTypes: text("data_types").array().default([]).notNull(),
  deploymentLocations: text("deployment_locations").array().default([]).notNull(),
  modelProvider: text("model_provider"),
  customerSelections: jsonb("customer_selections").default({}).notNull(),
  applicableFrameworks: text("applicable_frameworks").array().default([]).notNull(),
  frameworkVersions: jsonb("framework_versions").default({}).notNull(),
  assessmentTimestamp: timestamp("assessment_timestamp").defaultNow().notNull(),
  reviewerState: text("reviewer_state").default("PENDING").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const assessmentPlans = pgTable("assessment_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  auditCaseId: uuid("audit_case_id").unique().notNull().references(() => auditCases.id, { onDelete: "cascade" }),
  requiredTests: text("required_tests").array().default([]).notNull(),
  optionalTests: text("optional_tests").array().default([]).notNull(),
  prohibitedTests: text("prohibited_tests").array().default([]).notNull(),
  expectedControlCoverage: text("expected_control_coverage").array().default([]).notNull(),
  expectedEvidence: text("expected_evidence").array().default([]).notNull(),
  estimatedDurationMs: integer("estimated_duration_ms"),
  testBudget: integer("test_budget"),
  rateLimits: jsonb("rate_limits").default({}).notNull(),
  testSequencing: jsonb("test_sequencing").default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const complianceFindings = pgTable("compliance_findings", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  auditCaseId: uuid("audit_case_id").notNull().references(() => auditCases.id, { onDelete: "cascade" }),
  frameworkId: text("framework_id").notNull(),
  controlId: text("control_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(),
  evidenceRequired: text("evidence_required"),
  remediation: text("remediation"),
  ownerUserId: text("owner_user_id"),
  dueDate: timestamp("due_date"),
  status: text("status").default("OPEN").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const certificationPreparations = pgTable("certification_preparations", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  auditCaseId: uuid("audit_case_id").notNull().references(() => auditCases.id, { onDelete: "cascade" }),
  status: text("status").default("GENERATING").notNull(),
  exportedData: jsonb("exported_data").default({}).notNull(),
  downloadUrl: text("download_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const externalCertifications = pgTable("external_certifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  assetId: uuid("asset_id").notNull().references(() => assets.id, { onDelete: "cascade" }),
  issuer: text("issuer").notNull(),
  certificationType: text("certification_type").notNull(),
  certificationNumber: text("certification_number"),
  issuedAt: timestamp("issued_at").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verificationUrl: text("verification_url"),
  evidenceHash: text("evidence_hash"),
  verificationStatus: text("verification_status").default("PENDING").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// AegisAgent Runtime Protection

export const runtimeAgents = pgTable("runtime_agents", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  assetId: uuid("asset_id").notNull().references(() => assets.id, { onDelete: "cascade" }),
  auditCaseId: uuid("audit_case_id").references(() => auditCases.id, { onDelete: "set null" }),
  agentVersion: text("agent_version").notNull(),
  sdkVersion: text("sdk_version").notNull(),
  runtimeType: text("runtime_type").notNull(), // 'SDK', 'PROXY', 'MCP_GATEWAY', 'ENTERPRISE'
  environment: text("environment").notNull(),
  installationMethod: text("installation_method").notNull(),
  status: text("status").default("REGISTERING").notNull(), // 'REGISTERING', 'CONNECTED', 'HEALTHY', 'DEGRADED', 'OFFLINE', 'REVOKED', 'UPDATE_REQUIRED'
  policyBundleVersion: text("policy_bundle_version"),
  lastHeartbeatAt: timestamp("last_heartbeat_at"),
  registeredAt: timestamp("registered_at").defaultNow().notNull(),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const runtimeEvents = pgTable("runtime_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  assetId: uuid("asset_id").notNull().references(() => assets.id, { onDelete: "cascade" }),
  auditCaseId: uuid("audit_case_id").references(() => auditCases.id, { onDelete: "set null" }),
  runtimeAgentId: uuid("runtime_agent_id").notNull().references(() => runtimeAgents.id, { onDelete: "cascade" }),
  sessionId: text("session_id"),
  traceId: text("trace_id"),
  eventType: text("event_type").notNull(), // e.g. 'tool.requested', 'behavior.anomaly'
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  actor: text("actor"),
  action: text("action"),
  target: text("target"),
  toolName: text("tool_name"),
  model: text("model"),
  policyDecision: text("policy_decision"), // 'ALLOW', 'DENY', 'REQUIRE_APPROVAL', 'WARN'
  riskLevel: text("risk_level"),
  metadata: jsonb("metadata").default({}).notNull(),
  evidenceHash: text("evidence_hash"),
});

export const runtimePolicies = pgTable("runtime_policies", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  assetId: uuid("asset_id").notNull().references(() => assets.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  mode: text("mode").default("OBSERVE").notNull(), // 'DRAFT', 'SIMULATION', 'OBSERVE', 'ENFORCE'
  allowedTools: text("allowed_tools").array().default([]).notNull(),
  prohibitedTools: text("prohibited_tools").array().default([]).notNull(),
  approvedDomains: text("approved_domains").array().default([]).notNull(),
  humanApprovalRequirements: jsonb("human_approval_requirements").default({}).notNull(),
  rateLimits: jsonb("rate_limits").default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const controlRecommendations = pgTable("control_recommendations", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  findingId: uuid("finding_id").notNull().references(() => findings.id, { onDelete: "cascade" }),
  auditCaseId: uuid("audit_case_id").notNull().references(() => auditCases.id, { onDelete: "cascade" }),
  controlType: text("control_type").notNull(), // 'TOOL_RESTRICTION', 'DOMAIN_BLOCK'
  policyTemplate: jsonb("policy_template").notNull(),
  reason: text("reason").notNull(),
  expectedProtection: text("expected_protection").notNull(),
  confidence: numeric("confidence"),
  generatedBy: text("generated_by").notNull(),
  reviewerStatus: text("reviewer_status").default("PENDING").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const behaviorProfiles = pgTable("behavior_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  assetId: uuid("asset_id").unique().notNull().references(() => assets.id, { onDelete: "cascade" }),
  baselineDimensions: jsonb("baseline_dimensions").default({}).notNull(), // common tools, average session length, models
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const securityIncidents = pgTable("security_incidents", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  assetId: uuid("asset_id").notNull().references(() => assets.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  severity: text("severity").notNull(), // 'CRITICAL', 'HIGH', etc.
  status: text("status").default("OPEN").notNull(),
  relatedEventIds: uuid("related_event_ids").array().default([]).notNull(),
  responseActions: jsonb("response_actions").default([]).notNull(),
  passportImpact: text("passport_impact"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Data Governance & Assurance Layer

export const cryptographicAuditEvents = pgTable("cryptographic_audit_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: text("event_id").notNull(), // Correlation back to source event if needed
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  auditCaseId: uuid("audit_case_id").references(() => auditCases.id, { onDelete: "set null" }),
  assetId: uuid("asset_id").references(() => assets.id, { onDelete: "set null" }),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  resource: text("resource").notNull(),
  decision: text("decision").notNull(),
  correlationId: text("correlation_id"),
  payloadHash: text("payload_hash").notNull(),
  previousEventHash: text("previous_event_hash"),
  currentEventHash: text("current_event_hash").unique().notNull(),
  signingKeyId: uuid("signing_key_id").references(() => signingKeyReferences.id, { onDelete: "restrict" }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const retentionPolicies = pgTable("retention_policies", {
  id: text("id").primaryKey(), // e.g. 'runtime_metadata_90d'
  name: text("name").notNull(),
  dataClass: text("data_class").notNull(),
  purpose: text("purpose").notNull(),
  retentionDurationDays: integer("retention_duration_days").notNull(),
  frameworkBasis: text("framework_basis"),
  jurisdiction: text("jurisdiction"),
  deletionBehavior: text("deletion_behavior").default("HARD_DELETE").notNull(), // 'HARD_DELETE', 'ARCHIVE'
  archivalBehavior: text("archival_behavior"),
  version: text("version").default("1.0").notNull(),
  effectiveDate: timestamp("effective_date").defaultNow().notNull(),
});

export const deletionReceipts = pgTable("deletion_receipts", {
  id: uuid("id").defaultRandom().primaryKey(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id").notNull(),
  hash: text("hash").notNull(),
  policyId: text("policy_id").notNull().references(() => retentionPolicies.id),
  deletedAt: timestamp("deleted_at").defaultNow().notNull(),
  actor: text("actor").default("SYSTEM").notNull(),
  result: text("result").default("SUCCESS").notNull(),
});

export const legalHolds = pgTable("legal_holds", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  scope: text("scope").notNull(), // e.g. 'audit_case_123', 'all_evidence'
  reason: text("reason").notNull(),
  createdBy: text("created_by").notNull(),
  approvedBy: text("approved_by").notNull(),
  startAt: timestamp("start_at").defaultNow().notNull(),
  endAt: timestamp("end_at"),
  status: text("status").default("ACTIVE").notNull(), // 'ACTIVE', 'RELEASED'
});

export const processingActivities = pgTable("processing_activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  system: text("system").notNull(),
  purpose: text("purpose").notNull(),
  dataCategories: text("data_categories").array().default([]).notNull(),
  source: text("source").notNull(),
  destination: text("destination").notNull(),
  processorName: text("processor_name").notNull(),
  region: text("region").notNull(),
  dpaStatus: text("dpa_status").default("UNKNOWN").notNull(), // 'SIGNED', 'PENDING', 'UNKNOWN'
  retention: text("retention"),
  securityControls: text("security_controls").array().default([]).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  effectiveDate: timestamp("effective_date").defaultNow().notNull(),
});

export const dataRegions = pgTable("data_regions", {
  id: text("id").primaryKey(), // 'US', 'EU', 'CUSTOMER_MANAGED'
  description: text("description").notNull(),
  isCompliantFor: text("is_compliant_for").array().default([]).notNull(), // e.g. ['GDPR', 'CCPA']
});

export const credentialReferences = pgTable("credential_references", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  targetHost: text("target_host").notNull(),
  credentialType: text("credential_type").notNull(), // 'api_key', 'oauth_token', etc.
  encryptedSecretReference: text("encrypted_secret_reference").notNull(), // Envelope encrypted
  keyId: text("key_id").notNull(), // ID of the KMS/Vault key used
  keyVersion: text("key_version").notNull(),
  encryptionAlgorithm: text("encryption_algorithm").default("AES-GCM").notNull(),
  allowedMethods: text("allowed_methods").array().default([]).notNull(),
  allowedScopes: text("allowed_scopes").array().default([]).notNull(),
  rotationMetadata: jsonb("rotation_metadata").default({}).notNull(),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
