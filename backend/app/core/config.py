import os
from pathlib import Path
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "GridBricks API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Elexon BMRS Configuration
    ELEXON_BASE_URL: str = "https://data.elexon.co.uk/bmrs/api/v1"
    
    # Market Trading Gate Closure Configuration
    # N2EX / EPEX SPOT UK Day-Ahead auction gate closure is 09:50 GMT/UTC on D-1
    GATE_CLOSURE_TIME: str = os.getenv("GATE_CLOSURE_TIME", "09:50:00")
    SETTLEMENT_PERIODS_PER_DAY: int = 48
    
    # Default target evaluation dates for January 2026 purchasing decisions
    EVALUATION_START_DATE: str = "2026-01-01"
    EVALUATION_END_DATE: str = "2026-01-31"
    
    # Cache / Data Storage
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    
    # CORS
    CORS_ORIGINS: list[str] = ["*"]

settings = Settings()

