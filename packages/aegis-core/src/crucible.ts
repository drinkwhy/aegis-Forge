import type { AegisEvent } from "./events";
import type { SentinelStatus, SentinelPolicy } from "./entities";

export type AttackProfile =
  | "agentic-security"
  | "prompt-injection"
  | "data-exfiltration"
  | "credential-abuse"
  | "mcp-abuse"
  | "custom";

export type ExperimentMode = "full" | "quick" | "regression" | "adversarial";

export interface CrucibleExperimentRequest {
  targetId: string;
  targetType: "agent" | "model" | "tool" | "rag_pipeline" | "workflow";
  attackProfile: AttackProfile;
  mode: ExperimentMode;
  origin?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

export interface CrucibleExperimentResponse {
  experimentId: string;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  createdAt: string;
  updatedAt: string;
  findingsCount?: number;
  criticalCount?: number;
  highCount?: number;
  sentinelCandidateId?: string;
}

export interface CrucibleFindingRequest {
  findingId: string;
  experimentId: string;
  targetId: string;
  title: string;
  description: string;
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  evidence?: Record<string, unknown>;
  remediation?: string;
  metadata?: Record<string, unknown>;
  correlationId?: string;
}

export interface SentinelSyncRequest {
  sentinelId: string;
  version: number;
  origin: string;
  status: SentinelStatus;
  rules: Record<string, unknown>;
  genome?: Record<string, unknown>;
  fitnessScore?: number;
  attackCoverage?: number;
  falsePositiveRate?: number;
  validationEvidence?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  correlationId?: string;
}

export interface SentinelSyncResponse {
  sentinelId: string;
  status: "ACKNOWLEDGED" | "REJECTED" | "APPLIED";
  message?: string;
}

export interface CrucibleClient {
  createExperiment(request: CrucibleExperimentRequest): Promise<CrucibleExperimentResponse>;
  getExperimentStatus(experimentId: string): Promise<CrucibleExperimentResponse>;
  submitFinding(request: CrucibleFindingRequest): Promise<void>;
  syncSentinel(request: SentinelSyncRequest): Promise<SentinelSyncResponse>;
  emitEvent<TPayload>(event: AegisEvent<TPayload>): Promise<void>;
}
