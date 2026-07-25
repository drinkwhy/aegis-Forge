import uvicorn
from .config import settings
import structlog

structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ]
)

if __name__ == "__main__":
    uvicorn.run("src.api:app", host="0.0.0.0", port=settings.port, reload=False)
