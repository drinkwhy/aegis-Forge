# Compliance Evidence Automation

Aegis removes manual questionnaire fatigue by intelligently mapping technical evidence to compliance controls.

## Evidence Reuse Graph
When an evidence artifact is collected (e.g., an AegisAgent blocking a prohibited tool), the `ControlEvaluationEngine` evaluates all active frameworks (SOC 2, NIST, ISO 42001).
- The single evidence artifact is automatically linked to multiple controls.
- Controls are marked `PASS` with an `AUTOMATIC_VERIFIED` confidence score.
- Customers only review exceptions.
