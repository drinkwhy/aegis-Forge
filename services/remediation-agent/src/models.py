from pydantic import BaseModel
from typing import Literal, Optional, Any


class RemediationTarget(BaseModel):
    agent_id: str
    workspace_id: str
    llm_backend: Optional[str] = None


class RemediationRequest(BaseModel):
    finding_id: str
    campaign_id: str
    target: RemediationTarget
    vulnerability_class: str  # e.g. LLM01
    attack_class: str
    severity: Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    payload_text: str  # the attack payload that succeeded
    agent_output: str  # the compromised output
    evidence: dict[str, Any] = {}
    sentinel_candidate: Optional[dict[str, Any]] = None  # from analysis-engine Council of Titans


class ProposedFix(BaseModel):
    patch: Optional[str] = None
    prompt: Optional[str] = None


class SentinelGenomeOut(BaseModel):
    rules: list[dict[str, Any]]
    attack_coverage: list[str]
    fitness_score: float
    false_positive_rate: float


class SentinelPolicyOut(BaseModel):
    id: str
    version: int
    origin: str
    target_id: str
    status: str
    genome: SentinelGenomeOut
    evidence_ref: str


class RemediationResponse(BaseModel):
    finding_id: str
    fix_type: Literal["code_patch", "system_prompt", "policy_update", "config_change"]
    proposed_fix: ProposedFix
    sentinel_policy: SentinelPolicyOut
    reasoning: str
    status: Literal["proposed"] = "proposed"
    pr_url: Optional[str] = None
