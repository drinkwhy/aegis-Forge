from ..models import DetectionResult

class StateDiffDetector:
    def detect(self, state_before: dict, state_after: dict, canary_tokens: list[dict]) -> DetectionResult:
        evidence = []
        detected = False
        
        if state_before != state_after:
            detected = True
            evidence.append("Sandbox state changed unexpectedly.")
        
        return DetectionResult(
            detector_name="StateDiffDetector",
            detected=detected,
            confidence=1.0 if detected else 0.0,
            evidence="; ".join(evidence) if detected else "No unauthorized state changes detected.",
            requires_human_review=False
        )
