import asyncio
import time
from typing import Any
from .policy import PolicyDecision

class TelemetryEmitter:
    def __init__(self, workspace_id: str):
        self.workspace_id = workspace_id
        
    def emit_tool_call(self, session_id: str, agent_id: str, tool_name: str, 
                       params: dict, result: Any, duration_ms: int, 
                       policy_decision: PolicyDecision):
        
        event = {
            "session_id": session_id,
            "agent_id": agent_id,
            "workspace_id": self.workspace_id,
            "tool_name": tool_name,
            "params": params,
            "result": result,
            "duration_ms": duration_ms,
            "policy_decision": policy_decision.model_dump(),
            "timestamp": time.time()
        }
        
        # Fire and forget
        asyncio.create_task(self._send_event(event))
        
    async def _send_event(self, event: dict):
        # Stub: send to ClickHouse HTTP interface
        # async with httpx.AsyncClient() as client:
        #     await client.post(...)
        pass
