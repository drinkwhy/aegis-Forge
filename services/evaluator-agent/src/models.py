from pydantic import BaseModel

class EvaluationRequest(BaseModel):
    campaign_id: str
    run_id: str
    payload: dict  # The GeneratedPayload
    agent_output: str  # Raw LLM response
    tool_calls: list[dict]  # Recorded tool invocations
    sandbox_state_before: dict
    sandbox_state_after: dict
    canary_tokens: list[dict]  # List of CanaryToken dicts
    webhook_hits: list[dict]  # Any sinkhole hits during the run

class DetectionResult(BaseModel):
    detector_name: str
    detected: bool
    confidence: float  # 1.0 = deterministic, <1.0 = probabilistic
    evidence: str
    requires_human_review: bool

class EvaluationResponse(BaseModel):
    run_id: str
    attack_successful: bool
    overall_confidence: float
    detectors_run: list[DetectionResult]
    requires_human_review: bool
    human_review_reason: str | None
    fair_preliminary: dict  # Preliminary FAIR-AI score inputs
