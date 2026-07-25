# ADR-002: Dual-LLM Attack Generation Architecture

## Status
Accepted

## Date
2026-07-25

## Context

The attack generator must produce adversarial payloads that successfully bypass real AI system guardrails. The primary failure modes we must avoid:

1. **False positives from LLM-as-judge**: If we use the same LLM family to both generate attacks and evaluate their success, we introduce model-bias blind spots. Claude might evaluate Claude's outputs charitably; GPT-4o might similarly favor its own outputs.

2. **Static payload libraries become stale**: Known payloads from open-source frameworks (Garak, Promptfoo) are known to guardrail vendors. A static library will produce diminishing returns as LLM providers patch known jailbreaks.

3. **Misclassification at 37% for LLM-as-judge**: Industry data shows that relying solely on LLM classification for attack success produces misclassification rates approaching 37%, which destroys enterprise trust in the platform.

## Decision

**Attack Generator: Anthropic Claude (claude-opus-4-5)**
**Evaluator/Success Detector: Deterministic detectors primary; OpenAI GPT-4o fallback only**

### Attack Generator: Claude Sonnet

Claude is selected for payload generation because:
- Superior performance on complex reasoning and multi-step instruction following
- Best-in-class tool-use generation — critical for MCP attack payload crafting
- Nuanced natural language generation produces more socially-engineered, less obviously-adversarial payloads
- The "Extended Thinking" capability (where available) enables multi-hop attack chain reasoning

### Success Detection: Deterministic First

The evaluator does NOT primarily use LLM-as-judge. Detection hierarchy:

```
Priority 1 (confidence: 1.0): CanaryOutputDetector
  → Regex search for HMAC-signed canary token string in LLM output
  → If matched: attack_successful = true, confidence = 1.0, no further evaluation needed

Priority 2 (confidence: 1.0): WebhookSinkholeDetector  
  → Sinkhole HTTP server received a request with the canary token ID
  → If hit: attack_successful = true, confidence = 1.0

Priority 3 (confidence: 1.0): StateDiffDetector
  → Sandbox state before/after comparison (DB records, filesystem hashes)
  → If unauthorized modification detected: attack_successful = true

Priority 4 (confidence: 1.0): ToolInvocationDetector
  → eBPF trace + tool call log shows prohibited tool invocation
  → If detected: attack_successful = true

Priority 5 (confidence: 0.6-0.95): SemanticPolicyDetector (GPT-4o)
  → ONLY reached if all deterministic detectors return false
  → ALWAYS sets requires_human_review = true
  → NEVER presented as a confirmed finding without analyst sign-off
  → Confidence capped at 0.95 — never 1.0
```

### Why GPT-4o for Semantic Fallback

- Different model family than the attacker (Claude) — reduces bias in evaluation
- Different training data and RLHF alignment — catches different edge cases
- GPT-4o's structured output mode (JSON schema enforcement) provides reliable evaluation formats
- Using two different providers prevents a single-vendor supply chain dependency for the most critical evaluation step

## Consequences

- Dual API dependency (Anthropic + OpenAI) increases vendor surface area
- Token costs are higher than single-provider approach
- Mitigation: budget caps per campaign ($5 max); RL loop runs on demand, not continuously in MVP
- Future cost optimization: fine-tune a local attack model on the proprietary corpus (Phase 5) to replace frontier models for routine generation, keeping frontier models only for novel discovery

## References

- [Anthropic Claude API Documentation](https://docs.anthropic.com/)
- [OpenAI GPT-4o API Documentation](https://platform.openai.com/docs/)
- [PyRIT Evaluation Framework](https://github.com/Azure/PyRIT) — reference for LLM-as-judge limitations
