from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    anthropic_api_key: str
    control_plane_url: str = "http://control-plane:8080"
    corpus_path: str = "/corpus"
    max_tokens_per_payload: int = 2000
    max_budget_per_campaign_usd: float = 5.0
    port: int = 8001
    
    class Config:
        env_file = ".env"

settings = Settings()
