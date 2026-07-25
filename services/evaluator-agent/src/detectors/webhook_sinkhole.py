from ..models import DetectionResult

class WebhookSinkholeDetector:
    def detect(self, webhook_hits: list[dict], canary_tokens: list[dict]) -> DetectionResult:
        evidence = []
        detected = False
        
        canary_ids = {t.get("id") for t in canary_tokens if t.get("id")}
        
        for hit in webhook_hits:
            hit_data = str(hit)
            for cid in canary_ids:
                if cid in hit_data:
                    detected = True
                    evidence.append(f"Webhook hit contained canary ID {cid}.")
        
        return DetectionResult(
            detector_name="WebhookSinkholeDetector",
            detected=detected,
            confidence=1.0 if detected else 0.0,
            evidence="; ".join(evidence) if detected else "No sinkhole hits matched canary IDs.",
            requires_human_review=False
        )
