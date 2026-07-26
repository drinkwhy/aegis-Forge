export type AegisEntityType =
  | "agent"
  | "model"
  | "tool"
  | "mcp_server"
  | "data_source"
  | "prompt"
  | "context"
  | "workspace"
  | "user"
  | "workflow"
  | "attack_scenario"
  | "security_event"
  | "security_finding"
  | "sentinel_policy"
  | "experiment"
  | "telemetry_observation"
  | "activation_capture"
  | "topological_analysis";

export interface AegisRelationship {
  id: string;
  type: string;
  sourceId?: string;
  targetId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AegisEntity {
  id: string;
  type: AegisEntityType;
  name: string;
  metadata: Record<string, unknown>;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
  relationships?: AegisRelationship[];
}

export type UniversalEntity = AegisEntity;

export interface AgentAction {
  id: string;
  type: string;
  destination?: string;
  toolName?: string;
  toolAction?: string;
  amount?: number | null;
  payload: Record<string, unknown>;
  agentSessionId?: string;
  provenance?: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  agentId: string;
  toolId: string;
  toolName?: string;
  action?: string;
  parameters?: Record<string, unknown>;
  allowed?: boolean;
  result?: {
    reason?: string;
    details?: string;
  };
}

export interface Agent extends AegisEntity {
  type: "agent";
  modelId?: string;
  workspaceId?: string;
  permissions?: string[];
}

export interface Model extends AegisEntity {
  type: "model";
  provider?: string;
  version?: string;
}

export interface Tool extends AegisEntity {
  type: "tool";
  toolType?: string;
  ownerId?: string;
}

export interface MCPServer extends AegisEntity {
  type: "mcp_server";
  endpoint?: string;
  status?: string;
}

export interface DataSource extends AegisEntity {
  type: "data_source";
  sourceType?: string;
  sourceUri?: string;
}

export interface Prompt extends AegisEntity {
  type: "prompt";
  promptText?: string;
  language?: string;
}

export interface ContextEntity extends AegisEntity {
  type: "context";
  provenance?: string;
  documentId?: string;
}

export interface Experiment extends AegisEntity {
  type: "experiment";
  targetId?: string;
  attackProfile?: string;
  mode?: string;
  status?: string;
  results?: Record<string, unknown>;
}

export interface SentinelPolicy extends AegisEntity {
  type: "sentinel_policy";
  version: number;
  origin: string;
  genome?: Record<string, unknown>;
  rules: Record<string, unknown>;
  fitnessScore?: number;
  attackCoverage?: number;
  falsePositiveRate?: number;
  validationEvidence?: Record<string, unknown>;
  status: SentinelStatus;
}

export type SentinelStatus =
  | "DRAFT"
  | "SIMULATING"
  | "VALIDATED"
  | "STAGED"
  | "CANARY"
  | "ACTIVE"
  | "REJECTED"
  | "RETIRED";

export type SentinelVersion = number;

export interface SecurityFinding extends AegisEntity {
  type: "security_finding";
  description?: string;
  severity?: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  attackId?: string;
  evidence?: Record<string, unknown>;
  remediation?: string;
}

export interface AttackScenario extends AegisEntity {
  type: "attack_scenario";
  description?: string;
  tactics?: string[];
  targetIds?: string[];
}

export interface SecurityEventEntity extends AegisEntity {
  type: "security_event";
  category?: string;
  severity?: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  payload?: Record<string, unknown>;
}

export type SecurityEvent = SecurityEventEntity;

export interface TelemetryObservation extends AegisEntity {
  type: "telemetry_observation";
  cpu?: number;
  memory?: number;
  io?: number;
  additionalMetrics?: Record<string, unknown>;
}

export interface ActivationCapture extends AegisEntity {
  type: "activation_capture";
  modelState?: Record<string, unknown>;
  activationPatterns?: Record<string, unknown>;
}

export interface TopologicalAnalysis extends AegisEntity {
  type: "topological_analysis";
  persistenceEntropy?: number;
  entropyDelta?: number;
  beta0?: number;
  beta1?: number;
  compressionScore?: number;
}
