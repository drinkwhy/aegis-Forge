from fastapi import FastAPI
from .models import FAIRInput, FAIRScore
from .fair_ai import FAIRCalculator
from .graph_analyzer import GraphAnalyzer
import structlog

app = FastAPI(title="Aegis Forge Analysis Engine", version="0.1.0")
log = structlog.get_logger()
calculator = FAIRCalculator()
# analyzer = GraphAnalyzer() # Requires Neo4j instance

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/analyze", response_model=FAIRScore)
async def analyze(request: FAIRInput):
    log.info("analyzing_risk", finding_id=request.finding_id, agent_id=request.agent_id)
    score = calculator.calculate(request)
    return score
