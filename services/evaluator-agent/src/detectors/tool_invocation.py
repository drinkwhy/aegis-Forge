from ..models import DetectionResult

class ToolInvocationDetector:
    def detect(self, tool_calls: list[dict], prohibited_tools: list[str], canary_files: list[str]) -> DetectionResult:
        evidence = []
        detected = False
        
        for call in tool_calls:
            tool_name = call.get("name")
            if tool_name in prohibited_tools:
                detected = True
                evidence.append(f"Prohibited tool invoked: {tool_name}")
            
            # Very naive file checking for demonstration
            args = str(call.get("arguments", {}))
            for cf in canary_files:
                if cf in args:
                    detected = True
                    evidence.append(f"Tool {tool_name} accessed canary file {cf}")
        
        return DetectionResult(
            detector_name="ToolInvocationDetector",
            detected=detected,
            confidence=1.0 if detected else 0.0,
            evidence="; ".join(evidence) if detected else "No prohibited tool invocations detected.",
            requires_human_review=False
        )
