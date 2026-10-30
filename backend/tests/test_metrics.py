import pytest
from app.services.metrics import (
    calculate_mae,
    calculate_rmse,
    calculate_bias,
    calculate_wape,
    compute_kpi_summary
)

def test_calculate_mae():
    # Errors: |5000 - 4600| = 400, |5200 - 5500| = 300, |5400 - 4900| = 500
    # Mean: (400 + 300 + 500) / 3 = 1200 / 3 = 400.0
    forecasts = [5000.0, 5200.0, 5400.0]
    actuals = [4600.0, 5500.0, 4900.0]
    mae = calculate_mae(forecasts, actuals)
    assert mae == 400.0

def test_calculate_rmse():
    # Squared errors: 400^2 = 160000, (-300)^2 = 90000, 500^2 = 250000
    # Mean sq: 500000 / 3 = 166666.67 -> sqrt = 408.25
    forecasts = [5000.0, 5200.0, 5400.0]
    actuals = [4600.0, 5500.0, 4900.0]
    rmse = calculate_rmse(forecasts, actuals)
    assert round(rmse, 2) == 408.25

def test_calculate_bias():
    # Errors: +400, -300, +500 -> sum = 600 -> mean = 200.0 (overforecasting)
    forecasts = [5000.0, 5200.0, 5400.0]
    actuals = [4600.0, 5500.0, 4900.0]
    bias = calculate_bias(forecasts, actuals)
    assert bias == 200.0

def test_calculate_wape():
    # Total abs error = 400 + 300 + 500 = 1200
    # Total actual = 4600 + 5500 + 4900 = 15000
    # WAPE = (1200 / 15000) * 100% = 8.0%
    forecasts = [5000.0, 5200.0, 5400.0]
    actuals = [4600.0, 5500.0, 4900.0]
    wape = calculate_wape(forecasts, actuals)
    assert wape == 8.0

def test_empty_or_mismatched_inputs():
    assert calculate_mae([], []) == 0.0
    assert calculate_rmse([100], [100, 200]) == 0.0
    assert calculate_bias([], [100]) == 0.0
    assert calculate_wape([], []) == 0.0

def test_compute_kpi_summary():
    forecasts = [6000.0, 7000.0]
    actuals = [5500.0, 6500.0]
    # Errors: +500, +500 -> Bias = 500.0, MAE = 500.0, RMSE = 500.0
    # Total actual = 12000 -> WAPE = 1000 / 12000 * 100 = 8.33%
    # MWh = sum * 0.5 -> 13000 * 0.5 = 6500 MWh forecast, 6000 MWh actual
    summary = compute_kpi_summary(forecasts, actuals)
    assert summary["count"] == 2
    assert summary["mae"] == 500.0
    assert summary["rmse"] == 500.0
    assert summary["bias"] == 500.0
    assert summary["wape"] == 8.33
    assert summary["totalForecastMWh"] == 6500.0
    assert summary["totalActualMWh"] == 6000.0
    assert summary["netVolumeDeviationMWh"] == 500.0
    assert "Overforecasting" in summary["biasInterpretation"]
