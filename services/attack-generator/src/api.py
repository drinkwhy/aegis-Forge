from fastapi import FastAPI, HTTPException
from .models import GenerateRequest, GenerateResponse
from .attacker_agent import AttackerAgent
from .config import settings
import structlog
import yaml
import json
from pathlib import Path

app = FastAPI(title="Aegis Forge Attack Generator", version="0.1.0")
log = structlog.get_logger()

attacker = AttackerAgent()

@app.get("/health")
async def health():
    return {"status": "ok", "service": "attack-generator"}

@app.post("/generate", response_model=GenerateResponse)
async def generate_payload(request: GenerateRequest):
    # Load corpus entry
    corpus_path = Path(settings.corpus_path)
    # Search for corpus entry by ID
    corpus_entry = None
    for yaml_file in corpus_path.rglob("*.yaml"):
        with open(yaml_file) as f:
            data = yaml.safe_load(f)
            if data.get("id") == request.corpus_entry_id:
                from .models import CorpusEntry
                corpus_entry = CorpusEntry(**data)
                break
    
    if not corpus_entry:
        raise HTTPException(status_code=404, detail=f"Corpus entry {request.corpus_entry_id} not found")
    
    payload = await attacker.generate(request, corpus_entry)
    
    # Rough cost estimate (Claude Opus: $15/M input, $75/M output)
    input_cost = payload.metadata.get("input_tokens", 0) * 15 / 1_000_000
    output_cost = payload.metadata.get("output_tokens", 0) * 75 / 1_000_000
    
    return GenerateResponse(payload=payload, token_cost_usd=input_cost + output_cost)

@app.get("/corpus")
async def list_corpus():
    corpus_path = Path(settings.corpus_path)
    entries = []
    for yaml_file in corpus_path.rglob("*.yaml"):
        with open(yaml_file) as f:
            data = yaml.safe_load(f)
            if data and "id" in data:
                entries.append({"id": data["id"], "attack_class": data["attack_class"], "severity": data["severity"]})
    return {"entries": entries, "total": len(entries)}
