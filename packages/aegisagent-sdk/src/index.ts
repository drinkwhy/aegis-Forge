import type {
  AegisEvent,
  CrucibleExperimentRequest,
  CrucibleExperimentResponse,
  CrucibleFindingRequest,
  SentinelSyncRequest,
  SentinelSyncResponse,
} from "@workspace/aegis-core";

export type AegisDecision = {
  allowed: boolean;
  message: string;
  logId: string;
  severity?: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  /** Present when this action must be approved before it can be retried. */
  approvalRequestId?: string;
  /** Optional audit receipt for storing evidence of the exact policy decision. */
  transaction?: {
    receiptHash: string;
    actionHash: string;
    decision: "allowed" | "blocked";
    intent: {
      action: string;
      targetHost: string;
      method: string | null;
      credentialRef: string | null;
      toolName: string | null;
      dataClasses: string[];
      spendAmount: number | null;
    };
    provenance: Record<string, unknown>;
    capability: Record<string, unknown>;
    shadowExecution: {
      verdict: "allow" | "block";
      wouldForward: boolean;
      simulatedDestination: string;
    };
  };
  violation?: {
    ruleId: string;
    ruleName: string;
    reason: string;
    details?: string | null;
    severity?: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  } | null;
  deceptionContext?: Record<string, unknown>;
  capabilityToken?: string;
  guardrails?: Record<string, unknown>;
  execution?: {
    mode: "aegis_execute_gateway";
    endpoint: string;
    leaseId: string;
    expiresAt: string;
  };
};

export type AgentAction = {
  destination: string;
  agentTask: string;
  payload: Record<string, unknown>;
  amount?: number | null;
  agentSessionId?: string;
  toolName?: string;
  toolAction?: string;
  /** Brokered credential reference. The raw external secret remains server-side. */
  credentialRef?: string;
  /** A server-created approval ID returned by a previously blocked request. */
  approvalId?: string;
};

export type AegisClientOptions = {
  apiKey: string;
  baseUrl?: string;
  defaultSessionId?: string;
  fetchImpl?: typeof fetch;
  executionMode?: "gateway" | "local-after-guard";
};

type GatewayExecutionResult = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  credential?: { credentialRef: string; authorization: "CAPABILITY_BOUND" };
};

export type AegisFetchRequest = {
  url: string;
  method?: string;
  headers?: HeadersInit;
  body?: BodyInit | null;
  credentialRef?: string;
};

export class AegisBlockedError extends Error {
  readonly decision: AegisDecision;

  constructor(decision: AegisDecision) {
    super(decision.message);
    this.name = "AegisBlockedError";
    this.decision = decision;
  }
}

export class AegisClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultSessionId?: string;
  private readonly fetchImpl: typeof fetch;
  private readonly executionMode: "gateway" | "local-after-guard";
  /** A drop-in fetch replacement that checks every request with AegisAgent first. */
  readonly fetch: (input: RequestInfo | URL | AegisFetchRequest, init?: RequestInit) => Promise<Response>;

  constructor(options: AegisClientOptions) {
    if (!options.apiKey?.startsWith("ag_live_")) {
      throw new Error("AegisAgent API keys must start with ag_live_");
    }

    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? "https://aegisagent.onrender.com").replace(/\/$/, "");
    this.defaultSessionId = options.defaultSessionId;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.executionMode = options.executionMode ?? "gateway";
    this.fetch = this.createGuardedFetch(this.fetchImpl);
  }

  async guardAction(action: AgentAction): Promise<AegisDecision> {
    const response = await this.fetchImpl(`${this.baseUrl}/api/proxy`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...action,
        agentSessionId: action.agentSessionId ?? this.defaultSessionId,
      }),
    });

    const decision = (await response.json()) as AegisDecision;

    if (!response.ok || decision.allowed === false) {
      try {
        await this.emitEvent({
          eventId: typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `aegis-event-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          eventType: "agent.action.requested",
          schemaVersion: "1.0",
          timestamp: new Date().toISOString(),
          source: "agent-sdk",
          entityId: action.agentSessionId ?? action.destination ?? "agent-action",
          correlationId: action.agentSessionId ?? action.destination ?? "agent-action",
          payload: {
            action: {
              destination: action.destination,
              agentTask: action.agentTask,
              toolName: action.toolName,
              toolAction: action.toolAction,
              amount: action.amount,
              payload: action.payload,
              credentialRef: action.credentialRef,
              approvalId: action.approvalId,
            },
            decision,
          },
        });
      } catch {
        // Event ingestion failure should not prevent runtime enforcement.
      }
      throw new AegisBlockedError(decision);
    }

    try {
      await this.emitEvent({
        eventId: typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `aegis-event-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        eventType: "agent.action.requested",
        schemaVersion: "1.0",
        timestamp: new Date().toISOString(),
        source: "agent-sdk",
        entityId: action.agentSessionId ?? action.destination ?? "agent-action",
        correlationId: action.agentSessionId ?? action.destination ?? "agent-action",
        payload: {
          action: {
            destination: action.destination,
            agentTask: action.agentTask,
            toolName: action.toolName,
            toolAction: action.toolAction,
            amount: action.amount,
            payload: action.payload,
            credentialRef: action.credentialRef,
            approvalId: action.approvalId,
          },
          decision,
        },
      });
    } catch {
      // Event ingestion failure should not prevent the runtime decision.
    }

    return decision;
  }

  async runGuarded<T>(action: AgentAction, operation: (decision: AegisDecision) => Promise<T>): Promise<T> {
    const decision = await this.guardAction(action);
    return operation(decision);
  }

  async emitEvent<TPayload = Record<string, unknown>>(event: AegisEvent<TPayload>): Promise<void> {
    const response = await this.fetchImpl(`${this.baseUrl}/api/events`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AegisAgent event emission failed: ${response.status} ${response.statusText} ${errorText}`);
    }
  }

  async createCrucibleExperiment(request: CrucibleExperimentRequest): Promise<CrucibleExperimentResponse> {
    const response = await this.callCrucibleEndpoint<CrucibleExperimentResponse>("/api/crucible/experiments", request);
    return response;
  }

  async getCrucibleExperimentStatus(experimentId: string): Promise<CrucibleExperimentResponse> {
    const response = await this.fetchImpl(`${this.baseUrl}/api/crucible/experiments/${encodeURIComponent(experimentId)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch experiment status: ${response.status} ${response.statusText} ${errorText}`);
    }

    return response.json() as Promise<CrucibleExperimentResponse>;
  }

  async submitCrucibleFinding(request: CrucibleFindingRequest): Promise<void> {
    await this.callCrucibleEndpoint("/api/crucible/findings", request);
  }

  async syncCrucibleSentinel(request: SentinelSyncRequest): Promise<SentinelSyncResponse> {
    return this.callCrucibleEndpoint<SentinelSyncResponse>("/api/crucible/sentinels", request);
  }

  private async callCrucibleEndpoint<T>(path: string, body: unknown): Promise<T> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AegisAgent Crucible connector failed: ${response.status} ${response.statusText} ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  wrapFetch(fetchImpl: typeof fetch = this.fetchImpl): typeof fetch {
    return fetchImpl === this.fetchImpl ? this.fetch : this.createGuardedFetch(fetchImpl);
  }

  private createGuardedFetch(fetchImpl: typeof fetch): typeof fetch {
    return async (input, init) => {
      const structured = isAegisFetchRequest(input) ? input : null;
      const url = structured ? structured.url : typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const requestInit = structured ? { method: structured.method, headers: structured.headers, body: structured.body ?? undefined } satisfies RequestInit : init;
      const body = normalizeBody(requestInit?.body);
      const action: AgentAction = {
        destination: url,
        agentTask: `Outbound HTTP request to ${url}`,
        credentialRef: structured?.credentialRef,
        payload: {
          method: requestInit?.method ?? "GET",
          headers: normalizeHeaders(requestInit?.headers),
          body,
        },
      };

      const decision = await this.guardAction(action);

      if (this.executionMode === "gateway") {
        return this.executeThroughGateway(decision, action, requestInit);
      }
      return fetchImpl(url, requestInit);
    };
  }

  private async executeThroughGateway(
    decision: AegisDecision,
    action: AgentAction,
    init: RequestInit | undefined,
  ): Promise<Response> {
    if (!decision.capabilityToken) {
      throw new Error("AegisAgent did not return a capability token for gateway execution.");
    }

    const response = await this.fetchImpl(`${this.baseUrl}/api/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        capabilityToken: decision.capabilityToken,
        ...action,
        agentSessionId: action.agentSessionId ?? this.defaultSessionId,
        credentialRef: action.credentialRef,
        method: init?.method ?? "GET",
        headers: normalizeHeaders(init?.headers),
        body: normalizeBody(init?.body),
      }),
    });
    const result = (await response.json()) as GatewayExecutionResult | { error?: string };

    if (!response.ok) {
      throw new Error("AegisAgent execution gateway rejected the request: " + ("error" in result ? result.error : response.statusText));
    }

    const execution = result as GatewayExecutionResult;
    return new Response(execution.body, {
      status: execution.status,
      statusText: execution.statusText,
      headers: execution.headers,
    });
  }

  /** Sends a manual or scheduled telemetry heartbeat to register the runtime control status. */
  async sendHeartbeat(organizationId: string, systemId: string): Promise<void> {
    const response = await this.fetchImpl(`${this.baseUrl}/api/v1/organizations/${encodeURIComponent(organizationId)}/systems/${encodeURIComponent(systemId)}/heartbeat`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`AegisAgent heartbeat ping failed: ${response.status} ${response.statusText}`);
    }
  }

  /** Starts a background telemetry interval sending heartbeats to the control plane. */
  startHeartbeatLoop(organizationId: string, systemId: string, intervalMs = 60000): NodeJS.Timeout {
    // Send immediate heartbeat on start
    this.sendHeartbeat(organizationId, systemId).catch(() => {});
    return setInterval(() => {
      this.sendHeartbeat(organizationId, systemId).catch(() => {});
    }, intervalMs);
  }
}

export function createAegisAgent(options: AegisClientOptions): AegisClient {
  return new AegisClient(options);
}

export {
  detokenize,
  formatPreservingTokenize,
  prepareGuardedPrompt,
  runWithAegisGuardrails,
} from "./guardrails";
export type {
  GuardrailContext,
  GuardrailRunOptions,
  GuardrailRunResult,
  SensitiveTokenType,
  TokenizedSecret,
} from "./guardrails";

function normalizeHeaders(headers: HeadersInit | undefined): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) return Object.fromEntries(headers.entries());
  if (Array.isArray(headers)) return Object.fromEntries(headers);
  return headers;
}

function isAegisFetchRequest(input: unknown): input is AegisFetchRequest {
  return Boolean(input && typeof input === "object" && !(input instanceof URL) && "url" in input && typeof (input as { url?: unknown }).url === "string");
}

function normalizeBody(body: BodyInit | null | undefined): unknown {
  if (typeof body === "string") {
    try {
      return JSON.parse(body) as unknown;
    } catch {
      return body;
    }
  }

  if (!body) return null;
  if (body instanceof URLSearchParams) return Object.fromEntries(body.entries());
  if (body instanceof FormData) return Object.fromEntries(body.entries());

  return "[non-text request body]";
}


