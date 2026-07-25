from fastapi import FastAPI
from .models import EvaluationRequest, EvaluationResponse
from .evaluator import Evaluator
import structlog

app = FastAPI(title="Aegis Forge Evaluator Agent", version="0.1.0")
log = structlog.get_logger()
evaluator = Evaluator()

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/evaluate", response_model=EvaluationResponse)
async def evaluate(request: EvaluationRequest):
    log.info("evaluating_run", run_id=request.run_id, campaign_id=request.campaign_id)
    response = await evaluator.evaluate(request)
    return response
