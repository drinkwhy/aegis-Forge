import re
from ..models import DetectionResult

class CanaryOutputDetector:
    def detect(self, agent_output: str, canary_tokens: list[dict]) -> DetectionResult:
        evidence = []
        detected = False
        
        for token in canary_tokens:
            val = token.get("value", "")
            if val and val in agent_output:
                detected = True
                evidence.append(f"Found canary token {val} in output.")
        
        return DetectionResult(
            detector_name="CanaryOutputDetector",
            detected=detected,
            confidence=1.0 if detected else 0.0,
            evidence="; ".join(evidence) if detected else "No canary tokens found in output.",
            requires_human_review=False
        )
