import os
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Any, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

class ElexonClient:
    """
    Client for interacting with Elexon BMRS API streams:
    - FUELHH/stream: Half-hourly generation by fuel type (filtered for fuelType == 'WIND')
    - WINDFOR/stream: Half-hourly wind generation forecasts with publication timestamps
    """
    def __init__(self, base_url: Optional[str] = None, data_dir: Optional[Path] = None):
        self.base_url = (base_url or settings.ELEXON_BASE_URL).rstrip("/")
        self.data_dir = data_dir or settings.DATA_DIR
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.cache_file = self.data_dir / "january_2026_dataset.json"

    def get_actuals_file_path(self) -> Path:
        return self.data_dir / "actuals_wind_jan2026.json"

    def get_forecasts_file_path(self) -> Path:
        return self.data_dir / "forecasts_wind_jan2026.json"

    def fetch_actuals_stream(
        self,
        publish_from: str = "2026-01-01T00:00:00Z",
        publish_to: str = "2026-02-02T12:00:00Z"
    ) -> List[Dict[str, Any]]:
        """
        Fetch actual wind generation from FUELHH/stream in chunks to ensure resilience.
        Only keeps records where fuelType == 'WIND'.
        """
        start_dt = datetime.fromisoformat(publish_from.replace("Z", "+00:00"))
        end_dt = datetime.fromisoformat(publish_to.replace("Z", "+00:00"))
        
        all_records: List[Dict[str, Any]] = []
        chunk_days = 7
        curr_dt = start_dt

        with httpx.Client(timeout=60.0) as client:
            while curr_dt < end_dt:
                next_dt = min(curr_dt + timedelta(days=chunk_days), end_dt)
                p_from = curr_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
                p_to = next_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
                
                url = f"{self.base_url}/datasets/FUELHH/stream"
                params = {"publishDateTimeFrom": p_from, "publishDateTimeTo": p_to}
                logger.info(f"Fetching FUELHH: {p_from} -> {p_to}")
                
                try:
                    response = client.get(url, params=params)
                    response.raise_for_status()
                    raw = response.json()
                    items = raw.get("data", raw) if isinstance(raw, dict) else raw
                    
                    for item in items:
                        if item.get("fuelType") == "WIND":
                            all_records.append({
                                "startTime": item.get("startTime"),
                                "settlementDate": item.get("settlementDate"),
                                "settlementPeriod": item.get("settlementPeriod"),
                                "generation": float(item.get("generation", 0)),
                                "publishTime": item.get("publishTime")
                            })
                except Exception as e:
                    logger.error(f"Error fetching FUELHH chunk {p_from} - {p_to}: {e}")
                    raise
                    
                curr_dt = next_dt

        logger.info(f"Total FUELHH wind records collected: {len(all_records)}")
        return all_records

    def fetch_forecasts_stream(
        self,
        publish_from: str = "2026-01-01T00:00:00Z",
        publish_to: str = "2026-02-02T12:00:00Z"
    ) -> List[Dict[str, Any]]:
        """
        Fetch wind generation forecasts from WINDFOR/stream in chunks.
        Pulls published forecast runs including superseded historical iterations.
        """
        start_dt = datetime.fromisoformat(publish_from.replace("Z", "+00:00"))
        end_dt = datetime.fromisoformat(publish_to.replace("Z", "+00:00"))
        
        all_records: List[Dict[str, Any]] = []
        chunk_days = 5
        curr_dt = start_dt

        with httpx.Client(timeout=90.0) as client:
            while curr_dt < end_dt:
                next_dt = min(curr_dt + timedelta(days=chunk_days), end_dt)
                p_from = curr_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
                p_to = next_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
                
                url = f"{self.base_url}/datasets/WINDFOR/stream"
                params = {"publishDateTimeFrom": p_from, "publishDateTimeTo": p_to}
                logger.info(f"Fetching WINDFOR: {p_from} -> {p_to}")
                
                try:
                    response = client.get(url, params=params)
                    response.raise_for_status()
                    raw = response.json()
                    items = raw.get("data", raw) if isinstance(raw, dict) else raw
                    
                    for item in items:
                        all_records.append({
                            "publishTime": item.get("publishTime"),
                            "startTime": item.get("startTime"),
                            "generation": float(item.get("generation", 0))
                        })
                except Exception as e:
                    logger.error(f"Error fetching WINDFOR chunk {p_from} - {p_to}: {e}")
                    raise
                    
                curr_dt = next_dt

        logger.info(f"Total WINDFOR forecast records collected: {len(all_records)}")
        return all_records

    def sync_and_cache(self, force: bool = False) -> Dict[str, int]:
        """
        Synchronize January 2026 actuals and forecasts from Elexon BMRS and save to local JSON cache.
        """
        actuals_path = self.get_actuals_file_path()
        forecasts_path = self.get_forecasts_file_path()

        if not force and actuals_path.exists() and forecasts_path.exists():
            logger.info("Local cached datasets already exist. Skipping re-fetch.")
            with open(actuals_path, "r", encoding="utf-8") as f:
                actuals = json.load(f)
            with open(forecasts_path, "r", encoding="utf-8") as f:
                forecasts = json.load(f)
            return {"actuals_count": len(actuals), "forecasts_count": len(forecasts)}

        logger.info("Synchronizing January 2026 datasets from Elexon BMRS...")
        actuals = self.fetch_actuals_stream("2026-01-01T00:00:00Z", "2026-02-02T12:00:00Z")
        forecasts = self.fetch_forecasts_stream("2026-01-01T00:00:00Z", "2026-02-01T12:00:00Z")

        with open(actuals_path, "w", encoding="utf-8") as f:
            json.dump(actuals, f)

        with open(forecasts_path, "w", encoding="utf-8") as f:
            json.dump(forecasts, f)

        return {"actuals_count": len(actuals), "forecasts_count": len(forecasts)}

    def load_cached_data(self) -> Dict[str, List[Dict[str, Any]]]:
        """Load datasets from local cache or auto-sync if missing."""
        actuals_path = self.get_actuals_file_path()
        forecasts_path = self.get_forecasts_file_path()

        if not actuals_path.exists() or not forecasts_path.exists():
            self.sync_and_cache()

        with open(actuals_path, "r", encoding="utf-8") as f:
            actuals = json.load(f)
        with open(forecasts_path, "r", encoding="utf-8") as f:
            forecasts = json.load(f)

        return {"actuals": actuals, "forecasts": forecasts}
