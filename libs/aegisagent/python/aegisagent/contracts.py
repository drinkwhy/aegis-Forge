"""
Aegis Core Shared Contracts - Python Fabric Layer
"""
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, Any, List, Optional
from datetime import datetime


class EntityType(str, Enum):
    AGENT = "AGENT"
    MODEL = "MODEL"
    TOOL = "TOOL"
    MCP_SERVER = "MCP_SERVER"
    DATA_SOURCE = "DATA_SOURCE"
    PROMPT = "PROMPT"
    CONTEXT = "CONTEXT"
    ACTION = "ACTION"
    SECURITY_EVENT = "SECURITY_EVENT"
    ATTACK = "ATTACK"
    FINDING = "FINDING"
    POLICY = "POLICY"
    SENTINEL = "SENTINEL"
    EXPERIMENT = "EXPERIMENT"
    ACTIVATION_CAPTURE = "ACTIVATION_CAPTURE"
    TOPOLOGICAL_ANALYSIS = "TOPOLOGICAL_ANALYSIS"


class DecisionAction(str, Enum):
    ALLOW = "ALLOW"
    BLOCK = "BLOCK"
    REVIEW = "REVIEW"


class SentinelStatus(str, Enum):
    DRAFT = "DRAFT"
    SIMULATING = "SIMULATING"
    VALIDATED = "VALIDATED"
    STAGED = "STAGED"
    CANARY = "CANARY"
    ACTIVE = "ACTIVE"
    RETIRED = "RETIRED"


class TitanType(str, Enum):
    BEHAVIORAL = "BEHAVIORAL"
    MPED = "MPED"
    TOPOLOGICAL = "TOPOLOGICAL"
    GSAE = "GSAE"


@dataclass
class SecurityObservationTarget:
    agent_id: str
    workspace_id: str
    model_id: Optional[str] = None


@dataclass
class SecurityObservationInput:
    prompt_hash: str
    context_sources: List[str] = field(default_factory=list)
    provenance: str = "TRUSTED"  # TRUSTED, UNTRUSTED, HYBRID


@dataclass
class SecurityObservationAction:
    type: str
    tool_id: Optional[str] = None
    parameters_hash: Optional[str] = None
    parameters: Dict[str, Any] = field(default_factory=dict)


@dataclass
class BehavioralObservation:
    output_risk: float
    policy_violations: List[str] = field(default_factory=list)


@dataclass
class TelemetryObservation:
    cpu: float
    memory: float
    io: float
    execution_ms: int


@dataclass
class TopologicalObservation:
    persistence_entropy: float = 0.0
    entropy_delta: float = 0.0
    beta0: int = 0
    beta1: int = 0
    compression_score: float = 0.0


@dataclass
class SecurityDecision:
    action: DecisionAction
    risk_score: float
    policy_id: str
    reason: str


@dataclass
class AegisSecurityObservation:
    id: str
    timestamp: datetime
    target: SecurityObservationTarget
    input: SecurityObservationInput
    behavioral: BehavioralObservation
    decision: SecurityDecision
    action: Optional[SecurityObservationAction] = None
    telemetry: Optional[TelemetryObservation] = None
    topology: Optional[TopologicalObservation] = None


@dataclass
class TitanAnalysisResult:
    titan_type: TitanType
    anomalous: bool
    confidence: float
    metrics: Dict[str, Any]
    recommended_action: DecisionAction


@dataclass
class SentinelGenome:
    rules: List[Dict[str, Any]]
    attack_coverage: List[str]
    fitness_score: float
    false_positive_rate: float


@dataclass
class AegisSentinelPolicy:
    id: str
    version: int
    origin: str
    target_id: str
    status: SentinelStatus
    genome: SentinelGenome
    evidence_ref: str
    created_at: datetime
    updated_at: datetime
