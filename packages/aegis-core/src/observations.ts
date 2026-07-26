export interface UnifiedSecurityObservation {
  id: string;
  target: {
    agentId: string;
    modelId?: string;
    workspaceId?: string;
  };
  input: {
    promptHash?: string;
    contextSources?: string[];
    rawPrompt?: string;
    metadata?: Record<string, unknown>;
  };
  action?: {
    type: string;
    toolId?: string;
    toolName?: string;
    parametersHash?: string;
    rawParameters?: Record<string, unknown>;
  };
  behavioral: {
    outputRisk: number;
    policyViolations: string[];
    anomalyScore?: number;
  };
  telemetry?: {
    cpu?: number;
    memory?: number;
    io?: number;
    network?: {
      sentBytes?: number;
      receivedBytes?: number;
    };
    additionalMetrics?: Record<string, unknown>;
  };
  topology?: {
    persistenceEntropy?: number;
    entropyDelta?: number;
    beta0?: number;
    beta1?: number;
    compressionScore?: number;
    confidence?: number;
  };
  decision: {
    action: "ALLOW" | "BLOCK" | "REVIEW";
    riskScore: number;
    policyId?: string;
    reason?: string;
  };
  provenance?: {
    sourceEntityIds?: string[];
    contextProvenance?: string;
    generationTime?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisResult {
  analysisId: string;
  observationId: string;
  analyst: "behavioral" | "mped" | "topological" | "gsae" | "custom";
  summary: string;
  confidence: number;
  evidence?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
