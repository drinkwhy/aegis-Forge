from pydantic import BaseModel
from typing import Literal

class TargetProfile(BaseModel):
    agent_id: str
    workspace_id: str
    mcp_servers: list[dict]  # From Neo4j graph
    tools: list[dict]
    llm_backend: str  # e.g., "claude-3-5-sonnet", "gpt-4o"
    has_file_access: bool
    has_code_interpreter: bool
    has_web_search: bool
    external_facing: bool
    contains_pii: bool

class CorpusEntry(BaseModel):
    id: str
    attack_class: str
    owasp_mapping: str
    severity: Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    payload_template: str
    canary_type: str
    success_detector: str
    sandbox_requirements: dict
    tags: list[str] = []

class GeneratedPayload(BaseModel):
    corpus_entry_id: str
    campaign_id: str
    payload_text: str
    reasoning: str  # Why Claude thinks this will work
    stealth_score: float  # 0-1, from evaluator
    estimated_effectiveness: float  # 0-1, from evaluator
    canary_values: dict  # Populated canary placeholders
    turn_sequence: list[str]  # For multi-turn attacks
    metadata: dict

class GenerateRequest(BaseModel):
    campaign_id: str
    target: TargetProfile
    corpus_entry_id: str
    attempt_number: int = 1
    previous_result: dict | None = None  # For RL mutation

class GenerateResponse(BaseModel):
    payload: GeneratedPayload
    token_cost_usd: float
