"""
Remediation Agent — generates defensive fixes (system prompt hardening, code
patches, policy updates) and forges/validates an AegisSentinelPolicy for a
confirmed finding, then proposes it back to control-plane for staging.
"""
import json
import time
import uuid
from typing import Any

import httpx
import structlog

from .config import settings
from .models import (
    RemediationRequest,
    RemediationResponse,
    ProposedFix,
    SentinelPolicyOut,
    SentinelGenomeOut,
)

log = structlog.get_logger()

REMEDIATOR_SYSTEM_PROMPT = """
You are an expert AI security engineer for Aegis Forge, a Continuous AI Security
Hardening platform. You are given a CONFIRMED, evidence-backed finding: an
adversarial payload that successfully breached a target AI agent in an isolated
sandbox test.

Your task: propose the smallest effective defensive fix. Choose exactly one
fix_type:
- "system_prompt": a hardened system-prompt addendum that blocks this attack class
- "policy_update": a runtime guardrail/policy rule (input/output filter)
- "code_patch": a concrete unified-diff style code change to the agent's tool
  handling code, only if the vulnerability is clearly a code-level issue
  (e.g. unsanitized tool parameter)
- "config_change": a configuration change (e.g. disabling an overly-broad tool
  permission)

Respond with JSON only, this exact structure:
{
  "fix_type": "system_prompt|policy_update|code_patch|config_change",
  "patch": "unified diff text, or null",
  "prompt": "system prompt addendum text, or null",
  "reasoning": "why this fix stops this specific attack without breaking legitimate use",
  "attack_coverage": ["short-tag-1", "short-tag-2"],
  "estimated_false_positive_rate": 0.0
}
"""


class RemediationAgent:
    def __init__(self):
        if settings.openrouter_api_key:
            self.use_openrouter = True
            self.client = httpx.AsyncClient()
        elif settings.anthropic_api_key:
            self.use_openrouter = False
            import anthropic
            self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        else:
            self.use_openrouter = False
            self.client = None

    async def _draft_fix(self, request: RemediationRequest) -> dict[str, Any]:
        user_prompt = f"""FINDING:
Vulnerability class: {request.vulnerability_class}
Attack class: {request.attack_class}
Severity: {request.severity}
Target agent: {request.target.agent_id} (backend: {request.target.llm_backend})

ATTACK PAYLOAD THAT SUCCEEDED:
{request.payload_text}

COMPROMISED AGENT OUTPUT:
{request.agent_output}

Propose the defensive fix as specified."""

        if self.client is None:
            # No LLM credentials configured — deterministic fallback fix so the
            # loop still closes end-to-end without external API dependency.
            return {
                "fix_type": "policy_update",
                "patch": None,
                "prompt": (
                    f"Block any tool invocation whose input context is UNTRUSTED and "
                    f"matches attack class '{request.attack_class}' "
                    f"({request.vulnerability_class})."
                ),
                "reasoning": "No LLM API key configured; applied deterministic default-deny policy for this attack class.",
                "attack_coverage": [request.attack_class],
                "estimated_false_positive_rate": 0.02,
            }

        if self.use_openrouter:
            headers = {
                "Authorization": f"Bearer {settings.openrouter_api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://aegisforge.io",
                "X-Title": "Aegis Forge",
            }
            payload = {
                "model": "anthropic/claude-3.5-sonnet",
                "messages": [
                    {"role": "system", "content": REMEDIATOR_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                "max_tokens": 1500,
            }
            res = await self.client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                json=payload,
                headers=headers,
                timeout=60.0,
            )
            res.raise_for_status()
            content = res.json()["choices"][0]["message"]["content"]
        else:
            response = self.client.messages.create(
                model="claude-opus-4-5",
                max_tokens=1500,
                system=REMEDIATOR_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_prompt}],
            )
            content = response.content[0].text

        try:
            return json.loads(content)
        except json.JSONDecodeError:
            import re
            match = re.search(r"```json\n(.+?)\n```", content, re.DOTALL)
            if match:
                return json.loads(match.group(1))
            raise ValueError(f"Could not parse remediation JSON: {content[:200]}")

    def _forge_sentinel(self, request: RemediationRequest, draft: dict[str, Any]) -> SentinelPolicyOut:
        # Prefer the candidate already forged by analysis-engine's Council of
        # Titans (evidence-linked), otherwise synthesize a new DRAFT policy.
        if request.sentinel_candidate:
            c = request.sentinel_candidate
            genome = c.get("genome", {})
            return SentinelPolicyOut(
                id=c.get("id", f"sentinel-{request.target.agent_id}-{int(time.time())}"),
                version=c.get("version", 1),
                origin=c.get("origin", "COUNCIL_OF_TITANS_FOUNDRY"),
                target_id=c.get("target_id", request.target.agent_id),
                status="DRAFT",
                genome=SentinelGenomeOut(
                    rules=genome.get("rules", []),
                    attack_coverage=genome.get("attack_coverage", [request.attack_class]),
                    fitness_score=genome.get("fitness_score", 0.9),
                    false_positive_rate=genome.get(
                        "false_positive_rate", draft.get("estimated_false_positive_rate", 0.05)
                    ),
                ),
                evidence_ref=c.get("evidence_ref", request.finding_id),
            )

        return SentinelPolicyOut(
            id=f"sentinel-{request.target.agent_id}-{int(time.time())}",
            version=1,
            origin="REMEDIATION_AGENT_FOUNDRY",
            target_id=request.target.agent_id,
            status="DRAFT",
            genome=SentinelGenomeOut(
                rules=[
                    {
                        "condition": f"attack_class == '{request.attack_class}'",
                        "action": "BLOCK",
                        "reason": draft.get("reasoning", "Confirmed breach; auto-generated block rule."),
                    }
                ],
                attack_coverage=draft.get("attack_coverage", [request.attack_class]),
                fitness_score=0.9,
                false_positive_rate=draft.get("estimated_false_positive_rate", 0.05),
            ),
            evidence_ref=request.finding_id,
        )

    async def remediate(self, request: RemediationRequest) -> RemediationResponse:
        log.info(
            "generating_remediation",
            finding_id=request.finding_id,
            campaign_id=request.campaign_id,
            attack_class=request.attack_class,
        )

        draft = await self._draft_fix(request)
        sentinel = self._forge_sentinel(request, draft)

        fix_type = draft.get("fix_type", "policy_update")
        if fix_type not in ("code_patch", "system_prompt", "policy_update", "config_change"):
            fix_type = "policy_update"

        return RemediationResponse(
            finding_id=request.finding_id,
            fix_type=fix_type,
            proposed_fix=ProposedFix(
                patch=draft.get("patch"),
                prompt=draft.get("prompt"),
            ),
            sentinel_policy=sentinel,
            reasoning=draft.get("reasoning", ""),
        )
