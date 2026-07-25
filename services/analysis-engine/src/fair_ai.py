from pydantic import BaseModel
from typing import Literal

class FAIRInput(BaseModel):
    finding_id: str
    agent_id: str
    workspace_id: str
    vulnerability_class: str  # LLM01-LLM10
    severity: Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    agent_exposure: Literal["external", "internal_broad", "internal_restricted"]
    blast_radius_nodes: list[dict]  # From Neo4j
    industry: Literal["saas", "fintech", "healthcare", "defense", "other"]

class FAIRScore(BaseModel):
    loss_event_frequency: float  # Annual rate
    loss_magnitude_low: float    # P10 single loss (USD)
    loss_magnitude_high: float   # P90 single loss (USD)
    annualized_risk_low: float   # LEF × LM P10
    annualized_risk_high: float  # LEF × LM P90
    primary_risk_factor: str
    blast_radius_summary: str

# Exposure frequency tables
EXPOSURE_FREQUENCY = {
    "external": 52.0,      # ~Weekly attack attempts
    "internal_broad": 12.0, # ~Monthly
    "internal_restricted": 2.0,  # ~Biannually
}

# Severity-based loss magnitude ranges (USD)
SEVERITY_LOSS = {
    "CRITICAL": (250_000, 5_000_000),
    "HIGH": (50_000, 500_000),
    "MEDIUM": (10_000, 100_000),
    "LOW": (1_000, 25_000),
}

# Industry multipliers
INDUSTRY_MULTIPLIER = {
    "fintech": 3.5,
    "healthcare": 3.0,
    "defense": 4.0,
    "saas": 1.5,
    "other": 1.0,
}

class FAIRCalculator:
    def calculate(self, inp: FAIRInput) -> FAIRScore:
        lef = EXPOSURE_FREQUENCY[inp.agent_exposure]
        base_low, base_high = SEVERITY_LOSS[inp.severity]
        multiplier = INDUSTRY_MULTIPLIER[inp.industry]
        
        # Blast radius amplification: each additional critical system doubles risk
        critical_systems = sum(1 for n in inp.blast_radius_nodes 
                               if n.get("sensitivity") in ["HIGH", "CRITICAL"])
        blast_multiplier = 1.0 + (critical_systems * 0.5)
        
        lm_low = base_low * multiplier * blast_multiplier
        lm_high = base_high * multiplier * blast_multiplier
        
        return FAIRScore(
            loss_event_frequency=lef,
            loss_magnitude_low=lm_low,
            loss_magnitude_high=lm_high,
            annualized_risk_low=lef * lm_low,
            annualized_risk_high=lef * lm_high,
            primary_risk_factor=f"LEF={lef:.1f}/yr × LM=${lm_low:,.0f}-${lm_high:,.0f}",
            blast_radius_summary=f"{len(inp.blast_radius_nodes)} downstream systems, {critical_systems} critical"
        )
