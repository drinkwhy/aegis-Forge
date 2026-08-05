from fastapi import FastAPI
from .models import RemediationRequest, RemediationResponse
from .remediator import RemediationAgent
import structlog

app = FastAPI(title="Aegis Forge Remediation Agent", version="0.1.0")
log = structlog.get_logger()
agent = RemediationAgent()

@app.get("/health")
async def health():
    return {"status": "ok", "service": "remediation-agent"}

@app.post("/remediate", response_model=RemediationResponse)
async def remediate(request: RemediationRequest):
    log.info("remediation_requested", finding_id=request.finding_id, campaign_id=request.campaign_id)
    return await agent.remediate(request)
