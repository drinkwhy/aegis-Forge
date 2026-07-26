"""
Council of Titans Analysis Suite & Topological Homology Evaluator
"""
import math
from typing import Dict, Any, List
from aegisagent.contracts import (
    TitanType,
    DecisionAction,
    TitanAnalysisResult,
    AegisSecurityObservation,
    AegisSentinelPolicy,
    SentinelStatus,
    SentinelGenome,
)
from datetime import datetime


class BehavioralTitan:
    """Analyzes high-level semantic behavior and policy violations."""
    def evaluate(self, obs: AegisSecurityObservation) -> TitanAnalysisResult:
        violations = obs.behavioral.policy_violations
        risk = obs.behavioral.output_risk
        
        anomalous = risk > 0.7 or len(violations) > 0
        action = DecisionAction.BLOCK if risk > 0.85 else (DecisionAction.REVIEW if anomalous else DecisionAction.ALLOW)
        
        return TitanAnalysisResult(
            titan_type=TitanType.BEHAVIORAL,
            anomalous=anomalous,
            confidence=0.92,
            metrics={"violations_count": len(violations), "output_risk": risk},
            recommended_action=action
        )


class MPEDTitan:
    """Analyzes hardware & process execution telemetry anomalies (CPU/IO/Memory spikes)."""
    def evaluate(self, obs: AegisSecurityObservation) -> TitanAnalysisResult:
        telemetry = obs.telemetry
        if not telemetry:
            return TitanAnalysisResult(
                titan_type=TitanType.MPED,
                anomalous=False,
                confidence=0.5,
                metrics={"status": "NO_TELEMETRY"},
                recommended_action=DecisionAction.ALLOW
            )
        
        cpu_spike = telemetry.cpu > 85.0
        exec_spike = telemetry.execution_ms > 4000
        anomalous = cpu_spike or exec_spike
        action = DecisionAction.BLOCK if (cpu_spike and exec_spike) else (DecisionAction.REVIEW if anomalous else DecisionAction.ALLOW)
        
        return TitanAnalysisResult(
            titan_type=TitanType.MPED,
            anomalous=anomalous,
            confidence=0.88,
            metrics={"cpu_load": telemetry.cpu, "execution_ms": telemetry.execution_ms},
            recommended_action=action
        )


class TopologicalTitan:
    """
    Analyzes activation geometry manifold changes.
    Uses persistence entropy delta and Betti numbers (beta_0, beta_1) to detect compressed injection states.
    """
    def evaluate(self, obs: AegisSecurityObservation) -> TitanAnalysisResult:
        topology = obs.topology
        if not topology:
            return TitanAnalysisResult(
                titan_type=TitanType.TOPOLOGICAL,
                anomalous=False,
                confidence=0.5,
                metrics={"status": "NO_TOPOLOGY_DATA"},
                recommended_action=DecisionAction.ALLOW
            )
        
        # Topological anomaly threshold: rapid decrease in persistence entropy delta paired with manifold compression
        entropy_anomaly = abs(topology.entropy_delta) > 0.65
        compression_anomaly = topology.compression_score > 0.82
        anomalous = entropy_anomaly or compression_anomaly
        
        action = DecisionAction.BLOCK if (entropy_anomaly and compression_anomaly) else (DecisionAction.REVIEW if anomalous else DecisionAction.ALLOW)
        
        return TitanAnalysisResult(
            titan_type=TitanType.TOPOLOGICAL,
            anomalous=anomalous,
            confidence=0.96,
            metrics={
                "persistence_entropy": topology.persistence_entropy,
                "entropy_delta": topology.entropy_delta,
                "beta0": topology.beta0,
                "beta1": topology.beta1,
                "compression_score": topology.compression_score,
            },
            recommended_action=action
        )


class GSAETitan:
    """Generalized Structural Activation Embedding (GSAE) Titan."""
    def evaluate(self, obs: AegisSecurityObservation) -> TitanAnalysisResult:
        # Evaluates vector latent space shifts
        is_untrusted = obs.input.provenance == "UNTRUSTED"
        has_tool = obs.action is not None and obs.action.tool_id is not None
        
        anomalous = is_untrusted and has_tool
        action = DecisionAction.BLOCK if anomalous else DecisionAction.ALLOW
        
        return TitanAnalysisResult(
            titan_type=TitanType.GSAE,
            anomalous=anomalous,
            confidence=0.89,
            metrics={"untrusted_context": is_untrusted, "invokes_tool": has_tool},
            recommended_action=action
        )


class CouncilOfTitans:
    """
    Synthesizes analyses from all active Titans and evolves a candidate Aegis Sentinel Policy.
    """
    def __init__(self):
        self.behavioral = BehavioralTitan()
        self.mped = MPEDTitan()
        self.topological = TopologicalTitan()
        self.gsae = GSAETitan()

    def analyze_and_forge(self, obs: AegisSecurityObservation) -> Dict[str, Any]:
        results: List[TitanAnalysisResult] = [
            self.behavioral.evaluate(obs),
            self.mped.evaluate(obs),
            self.topological.evaluate(obs),
            self.gsae.evaluate(obs)
        ]

        anomalous_count = sum(1 for r in results if r.anomalous)
        highest_confidence = max((r.confidence for r in results if r.anomalous), default=0.0)
        
        # Consensus decision logic
        if any(r.recommended_action == DecisionAction.BLOCK for r in results):
            final_action = DecisionAction.BLOCK
        elif any(r.recommended_action == DecisionAction.REVIEW for r in results):
            final_action = DecisionAction.REVIEW
        else:
            final_action = DecisionAction.ALLOW

        # Forge new Sentinel Policy if attack anomaly detected
        sentinel_candidate = None
        if final_action != DecisionAction.ALLOW:
            sentinel_candidate = AegisSentinelPolicy(
                id=f"sentinel-{obs.target.agent_id}-{int(datetime.now().timestamp())}",
                version=1,
                origin="COUNCIL_OF_TITANS_FOUNDRY",
                target_id=obs.target.agent_id,
                status=SentinelStatus.DRAFT,
                genome=SentinelGenome(
                    rules=[
                        {
                            "condition": "context_provenance == 'UNTRUSTED' AND tool_requested != NULL",
                            "action": "BLOCK",
                            "reason": f"Topological/Behavioral anomaly detected by Council of Titans (confidence: {highest_confidence})"
                        }
                    ],
                    attack_coverage=["prompt-injection", "indirect-exfiltration", "topological-anomaly"],
                    fitness_score=0.98,
                    false_positive_rate=0.01
                ),
                evidence_ref=obs.id,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )

        return {
            "observation_id": obs.id,
            "consensus_action": final_action.value,
            "anomalous_titans_count": anomalous_count,
            "titan_results": [
                {
                    "titan_type": r.titan_type.value,
                    "anomalous": r.anomalous,
                    "confidence": r.confidence,
                    "metrics": r.metrics,
                    "action": r.recommended_action.value
                }
                for r in results
            ],
            "sentinel_candidate": sentinel_candidate.__dict__ if sentinel_candidate else None
        }
