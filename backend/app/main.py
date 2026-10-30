import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import router, engine

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing GridBricks DataEngine...")
    try:
        engine.initialize_data()
    except Exception as e:
        logger.warning(f"Initial data load deferred: {e}")
    yield

app = FastAPI(
    title="GridBricks - UK Wind Forecasting & Accuracy Intelligence API",
    description="Quantitative Day-Ahead renewable generation forecast evaluation for UK electricity trading desks.",
    version=settings.VERSION,
    lifespan=lifespan
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
def root():
    return {
        "service": "GridBricks API",
        "description": "UK Day-Ahead Wind Forecasting & Accuracy Evaluation Platform",
        "docs": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
