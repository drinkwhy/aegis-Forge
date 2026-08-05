from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    anthropic_api_key: str = ""
    openrouter_api_key: str = ""
    control_plane_url: str = "http://control-plane:8080"
    port: int = 8004

    class Config:
        env_file = ".env"

settings = Settings()
