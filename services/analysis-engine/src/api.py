from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from datetime import datetime
from .models import FAIRInput, FAIRScore
from .fair_ai import FAIRCalculator
from .titans import CouncilOfTitans
from aegisagent.contracts import (
    AegisSecurityObservation,
    SecurityObservationTarget,
    SecurityObservationInput,
    SecurityObservationAction,
    BehavioralObservation,
    TelemetryObservation,
    TopologicalObservation,
    SecurityDecision,
    DecisionAction,
)
import structlog

app = FastAPI(title="Aegis Crucible Analysis Engine & Council of Titans", version="0.2.0")
log = structlog.get_logger()
calculator = FAIRCalculator()
council = CouncilOfTitans()

@app.get("/health")
async def health():
    return {"status": "ok", "titans": ["BEHAVIORAL", "MPED", "TOPOLOGICAL", "GSAE"]}

@app.post("/analyze", response_model=FAIRScore)
async def analyze(request: FAIRInput):
    log.info("analyzing_risk", finding_id=request.finding_id, agent_id=request.agent_id)
    score = calculator.calculate(request)
    return score

class ObservationPayload(BaseModel):
    id: str
    agent_id: str
    workspace_id: str
    prompt_hash: str
    output_risk: float
    policy_violations: List[str] = []
    untrusted_context: bool = False
    tool_id: Optional[str] = None
    cpu_load: float = 20.0
    execution_ms: int = 250
    persistence_entropy: float = 0.5
    entropy_delta: float = 0.0
    compression_score: float = 0.1

@app.post("/titans/evaluate")
async def evaluate_observation(payload: ObservationPayload):
    log.info("council_of_titans_evaluating", observation_id=payload.id, agent_id=payload.agent_id)
    
    obs = AegisSecurityObservation(
        id=payload.id,
        timestamp=datetime.now(),
        target=SecurityObservationTarget(
            agent_id=payload.agent_id,
            workspace_id=payload.workspace_id
        ),
        input=SecurityObservationInput(
            prompt_hash=payload.prompt_hash,
            provenance="UNTRUSTED" if payload.untrusted_context else "TRUSTED"
        ),
        action=SecurityObservationAction(
            type="TOOL_CALL",
            tool_id=payload.tool_id
        ) if payload.tool_id else None,
        behavioral=BehavioralObservation(
            output_risk=payload.output_risk,
            policy_violations=payload.policy_violations
        ),
        telemetry=TelemetryObservation(
            cpu=payload.cpu_load,
            memory=45.0,
            io=12.0,
            execution_ms=payload.execution_ms
        ),
        topology=TopologicalObservation(
            persistence_entropy=payload.persistence_entropy,
            entropy_delta=payload.entropy_delta,
            beta0=1,
            beta1=0,
            compression_score=payload.compression_score
        ),
        decision=SecurityDecision(
            action=DecisionAction.ALLOW,
            riskScore=payload.output_risk,
            policyID="default",
            reason="Initial evaluation"
        )
    )

    evaluation = council.analyze_and_forge(obs)
    return evaluation
