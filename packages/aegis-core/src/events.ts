export const AEGIS_EVENT_TYPES = [
  "agent.action.requested",
  "agent.tool_call.requested",
  "agent.tool_call.allowed",
  "agent.tool_call.blocked",
  "agent.security_event.detected",
  "agent.security_event.escalated",
  "crucible.experiment.created",
  "crucible.attack.started",
  "crucible.attack.completed",
  "crucible.finding.created",
  "crucible.sentinel.generated",
  "crucible.sentinel.validated",
  "sentinel.policy.staged",
  "sentinel.policy.activated",
  "sentinel.policy.retired",
] as const;

export type AegisEventType = (typeof AEGIS_EVENT_TYPES)[number];

export interface AegisEvent<TPayload = Record<string, unknown>> {
  eventId: string;
  eventType: AegisEventType;
  schemaVersion: string;
  timestamp: string;
  source: string;
  entityId: string;
  correlationId: string;
  payload: TPayload;
}

export interface AgentActionRequestedPayload {
  agentId: string;
  sessionId: string;
  action: {
    type: string;
    destination?: string;
    toolName?: string;
    toolAction?: string;
    amount?: number | null;
    payload: Record<string, unknown>;
  };
  context?: Record<string, unknown>;
}

export interface ToolCallPayload {
  agentId: string;
  sessionId: string;
  toolId: string;
  toolName?: string;
  action?: string;
  parameters?: Record<string, unknown>;
  riskScore?: number;
  decision?: "ALLOW" | "BLOCK" | "REVIEW";
}

export interface SecurityEventPayload {
  eventId?: string;
  agentId?: string;
  modelId?: string;
  workspaceId?: string;
  contextIds?: string[];
  action?: {
    type: string;
    toolId?: string;
    toolName?: string;
    parameters?: Record<string, unknown>;
  };
  decision?: {
    action: "ALLOW" | "BLOCK" | "REVIEW";
    riskScore: number;
    policyId?: string;
  };
  findings?: Record<string, unknown>[];
  telemetry?: Record<string, unknown>;
}

export interface AttackScenarioPayload {
  attackId: string;
  name: string;
  description?: string;
  targetId: string;
  targetType?: string;
  tactics?: string[];
  tags?: string[];
}

export interface AttackResultPayload {
  attackId: string;
  targetId: string;
  status: "VULNERABLE" | "RESILIENT" | "INCONCLUSIVE";
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  evidence?: Record<string, unknown>;
  analyze?: Record<string, unknown>;
}

export interface FindingPayload {
  findingId: string;
  attackId?: string;
  targetId?: string;
  title: string;
  description: string;
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  evidence?: Record<string, unknown>;
  remediation?: string;
}

export interface SentinelPayload {
  sentinelId: string;
  version: number;
  origin: string;
  status: "DRAFT" | "SIMULATING" | "VALIDATED" | "STAGED" | "CANARY" | "ACTIVE" | "REJECTED" | "RETIRED";
  policyId?: string;
  fitnessScore?: number;
  attackCoverage?: number;
  falsePositiveRate?: number;
}
