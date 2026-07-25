import functools
import time
from typing import Callable, Any
from .policy import PolicyChecker
from .telemetry import TelemetryEmitter

class AegisAgent:
    def __init__(self, workspace_id: str, api_key: str, max_turns: int = 50):
        self.workspace_id = workspace_id
        self.api_key = api_key
        self.max_turns = max_turns
        self.policy_checker = PolicyChecker(api_key)
        self.telemetry = TelemetryEmitter(workspace_id)
        self.turn_count = 0

def wrap_executor(agent: AegisAgent):
    def decorator(func: Callable):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            tool_name = func.__name__
            
            # 1. Policy check
            decision = await agent.policy_checker.check(tool_name, kwargs)
            if not decision.allowed:
                raise Exception(f"Tool execution blocked by policy: {decision.reason}")
            
            # 2. Vault credential fetch simulation
            for k, v in kwargs.items():
                if isinstance(v, str) and v.startswith("vault://"):
                    kwargs[k] = "fetched-secret-value"
            
            start_time = time.time()
            result = None
            error = None
            
            try:
                # 3. Execute
                result = await func(*args, **kwargs)
                return result
            except Exception as e:
                error = e
                raise
            finally:
                duration_ms = int((time.time() - start_time) * 1000)
                
                # 4. Telemetry
                agent.telemetry.emit_tool_call(
                    session_id="default-session",  # In real usage, this would be passed in
                    agent_id="default-agent",
                    tool_name=tool_name,
                    params=kwargs,
                    result=str(result) if not error else str(error),
                    duration_ms=duration_ms,
                    policy_decision=decision
                )
                
        return wrapper
    return decorator
