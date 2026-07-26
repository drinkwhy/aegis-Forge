from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    openai_api_key: str = ""
    openrouter_api_key: str = ""
    control_plane_url: str = "http://control-plane:8080"
    clickhouse_url: str = "http://clickhouse:8123"
    port: int = 8002
    
    class Config:
        env_file = ".env"

settings = Settings()
