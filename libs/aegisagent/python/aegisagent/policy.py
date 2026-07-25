from pydantic import BaseModel

class PolicyDecision(BaseModel):
    allowed: bool
    reason: str
    requires_approval: bool

class PolicyChecker:
    def __init__(self, api_key: str):
        self.api_key = api_key
        
    async def check(self, tool_name: str, params: dict) -> PolicyDecision:
        # Stub: make an HTTP request to the control plane
        # return await client.post("/api/v1/policy/check", ...)
        return PolicyDecision(
            allowed=True,
            reason="default allow",
            requires_approval=False
        )
