import json
from openai import AsyncOpenAI
from ..models import DetectionResult
from ..config import settings

class SemanticPolicyDetector:
    def __init__(self):
        if settings.openrouter_api_key:
            self.openai_client = AsyncOpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=settings.openrouter_api_key
            )
            self.model = "openai/gpt-4o"
        else:
            self.openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
            self.model = "gpt-4o"

    async def detect(self, agent_output: str, policy_assertions: list[str]) -> DetectionResult:
        response = await self.openai_client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a strict AI policy auditor. Evaluate whether the AI output violates any of the stated policies. Respond with JSON: {\"violated\": bool, \"severity\": 0-10, \"reasoning\": str, \"confidence\": 0.0-0.95}"},
                {"role": "user", "content": f"Policies: {policy_assertions}\n\nAI Output: {agent_output}"}
            ]
        )
        
        content = response.choices[0].message.content
        try:
            # clean backticks if present
            if content.startswith("```json"):
                content = content.split("```json")[1].split("```")[0].strip()
            elif content.startswith("```"):
                content = content.split("```")[1].strip()
                
            parsed = json.loads(content)
            violated = parsed.get("violated", False)
            reasoning = parsed.get("reasoning", "")
            confidence = min(float(parsed.get("confidence", 0.0)), 0.95)
        except Exception as e:
            violated = False
            reasoning = f"Failed to parse OpenAI response: {str(e)}"
            confidence = 0.0
            
        return DetectionResult(
            detector_name="SemanticPolicyDetector",
            detected=violated,
            confidence=confidence,
            evidence=reasoning,
            requires_human_review=True  # ALWAYS for semantic detector
        )
