import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.services.data_engine import DataEngine
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["GridBricks Analytics"])

# Singleton DataEngine instance
engine = DataEngine()

@router.get("/health")
def health_check():
    """Healthcheck endpoint reporting server and dataset cache status."""
    actuals_loaded = len(engine._actuals_df) if engine._actuals_df is not None else 0
    forecasts_loaded = len(engine._forecasts_df) if engine._forecasts_df is not None else 0
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "gateClosureDefault": settings.GATE_CLOSURE_TIME,
        "cacheStatus": {
            "actualsCount": actuals_loaded,
            "forecastsCount": forecasts_loaded,
            "isReady": actuals_loaded > 0 and forecasts_loaded > 0
        }
    }

@router.get("/dates")
def get_available_dates():
    """Returns valid purchasing decision dates in January 2026."""
    dates = engine.get_available_decision_dates()
    return {
        "count": len(dates),
        "dates": dates,
        "defaultDate": "2026-01-14",
        "description": "Purchasing decision dates in January 2026 (Delivery: Jan 2 - Feb 1, 2026)"
    }

@router.get("/decision")
def get_decision_analysis(
    date: str = Query("2026-01-14", description="Decision date in YYYY-MM-DD format (e.g. 2026-01-14)"),
    cutoff: Optional[str] = Query(None, description="Gate closure cutoff time (HH:MM:SS, default 09:50:00)")
):
    """
    Get point-in-time renewable generation forecast and actuals comparison for a single decision date.
    Strictly filters out forecasts published after Gate Closure on D-1.
    """
    try:
        res = engine.evaluate_decision_date(date, cutoff_time_str=cutoff)
        return res
    except Exception as e:
        logger.error(f"Error evaluating decision date {date}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analysis")
def get_month_analysis(
    from_date: str = Query("2026-01-01", alias="from", description="Start decision date (YYYY-MM-DD)"),
    to_date: str = Query("2026-01-31", alias="to", description="End decision date (YYYY-MM-DD)"),
    cutoff: Optional[str] = Query(None, description="Gate closure cutoff time (HH:MM:SS)")
):
    """
    Get aggregate forecast accuracy analysis across January 2026 decisions.
    Computes overall MAE, RMSE, Bias, WAPE, and daily error breakdown.
    """
    try:
        res = engine.evaluate_month_summary(from_date, to_date, cutoff_time_str=cutoff)
        return res
    except Exception as e:
        logger.error(f"Error computing monthly analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sync")
def trigger_data_sync(force: bool = Query(False, description="Force re-download from Elexon")):
    """Trigger data download and synchronization from Elexon BMRS API streams."""
    try:
        engine.initialize_data(force_refresh=force)
        return {
            "status": "success",
            "message": "Data synchronized successfully",
            "actualsCount": len(engine._actuals_df),
            "forecastsCount": len(engine._forecasts_df)
        }
    except Exception as e:
        logger.error(f"Sync failed: {e}")
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")
