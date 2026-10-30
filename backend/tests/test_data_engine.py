import pytest
import pandas as pd
from datetime import datetime, timezone
from app.services.data_engine import DataEngine

class MockElexonClient:
    def sync_and_cache(self, force=False):
        pass

    def load_cached_data(self):
        # Decision Date: 2026-01-14
        # Gate Closure: 2026-01-14 09:50:00 UTC
        # Delivery Day: 2026-01-15 (00:00:00 to 23:30:00)
        
        forecasts = [
            # 1. Early forecast for 2026-01-15 00:00:00Z published on Jan 13 -> eligible
            {
                "publishTime": "2026-01-13T12:00:00Z",
                "startTime": "2026-01-15T00:00:00Z",
                "generation": 4000.0
            },
            # 2. Updated forecast for 2026-01-15 00:00:00Z published on Jan 14 at 09:00:00Z -> eligible & latest before cutoff
            {
                "publishTime": "2026-01-14T09:00:00Z",
                "startTime": "2026-01-15T00:00:00Z",
                "generation": 4500.0
            },
            # 3. Forecast published AFTER cutoff on Jan 14 at 14:00:00Z -> MUST BE EXCLUDED!
            {
                "publishTime": "2026-01-14T14:00:00Z",
                "startTime": "2026-01-15T00:00:00Z",
                "generation": 8888.0
            },
            # 4. Forecast published on delivery day Jan 15 at 02:00:00Z -> MUST BE EXCLUDED!
            {
                "publishTime": "2026-01-15T02:00:00Z",
                "startTime": "2026-01-15T00:00:00Z",
                "generation": 9999.0
            },
            # Forecast for Period 2 (00:30:00Z) published at 09:30:00Z before cutoff
            {
                "publishTime": "2026-01-14T09:30:00Z",
                "startTime": "2026-01-15T00:30:00Z",
                "generation": 4700.0
            }
        ]

        actuals = [
            {
                "startTime": "2026-01-15T00:00:00Z",
                "generation": 4200.0,
                "settlementDate": "2026-01-15",
                "settlementPeriod": 1,
                "publishTime": "2026-01-15T00:30:00Z"
            },
            {
                "startTime": "2026-01-15T00:30:00Z",
                "generation": 4800.0,
                "settlementDate": "2026-01-15",
                "settlementPeriod": 2,
                "publishTime": "2026-01-15T01:00:00Z"
            }
        ]

        return {"actuals": actuals, "forecasts": forecasts}

def test_point_in_time_gate_closure_enforcement():
    engine = DataEngine(elexon_client=MockElexonClient())
    engine.initialize_data()

    res = engine.evaluate_decision_date("2026-01-14", cutoff_time_str="09:50:00")
    
    assert res["decisionDate"] == "2026-01-14"
    assert res["deliveryDate"] == "2026-01-15"
    assert res["gateClosureCutoff"] == "2026-01-14T09:50:00Z"

    periods = res["settlementPeriods"]
    p1 = next(p for p in periods if p["settlementPeriod"] == 1)
    
    # Check that the 4500.0 forecast (published at 09:00Z) was selected, NOT 8888.0 or 9999.0!
    assert p1["forecastMW"] == 4500.0
    assert p1["actualMW"] == 4200.0
    assert p1["errorMW"] == 300.0  # 4500 - 4200
    assert p1["forecastPublishTime"] == "2026-01-14T09:00:00Z"

    p2 = next(p for p in periods if p["settlementPeriod"] == 2)
    assert p2["forecastMW"] == 4700.0
    assert p2["actualMW"] == 4800.0
    assert p2["errorMW"] == -100.0  # 4700 - 4800
    assert p2["forecastPublishTime"] == "2026-01-14T09:30:00Z"

    # Verify KPIs for the 2 matched periods:
    # Errors: +300, -100
    # MAE = (300 + 100) / 2 = 200.0
    # Bias = (300 - 100) / 2 = 100.0
    kpis = res["kpis"]
    assert kpis["mae"] == 200.0
    assert kpis["bias"] == 100.0
