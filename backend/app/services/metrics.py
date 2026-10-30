import math
from typing import Sequence, Dict, Any

def calculate_mae(forecasts: Sequence[float], actuals: Sequence[float]) -> float:
    """
    Mean Absolute Error (MAE):
    Average magnitude of errors in MW, without considering direction.
    MAE = (1 / n) * sum(|F_i - A_i|)
    """
    if not forecasts or not actuals or len(forecasts) != len(actuals):
        return 0.0
    n = len(forecasts)
    total_abs_error = sum(abs(f - a) for f, a in zip(forecasts, actuals))
    return round(total_abs_error / n, 2)

def calculate_rmse(forecasts: Sequence[float], actuals: Sequence[float]) -> float:
    """
    Root Mean Squared Error (RMSE):
    Gives relatively higher weight to large forecasting errors.
    RMSE = sqrt((1 / n) * sum((F_i - A_i)^2))
    """
    if not forecasts or not actuals or len(forecasts) != len(actuals):
        return 0.0
    n = len(forecasts)
    total_sq_error = sum((f - a) ** 2 for f, a in zip(forecasts, actuals))
    return round(math.sqrt(total_sq_error / n), 2)

def calculate_bias(forecasts: Sequence[float], actuals: Sequence[float]) -> float:
    """
    Forecast Bias (Mean Error):
    Indicates whether the forecast systematically overpredicts (> 0) or underpredicts (< 0).
    Bias = (1 / n) * sum(F_i - A_i)
    """
    if not forecasts or not actuals or len(forecasts) != len(actuals):
        return 0.0
    n = len(forecasts)
    total_error = sum(f - a for f, a in zip(forecasts, actuals))
    return round(total_error / n, 2)

def calculate_wape(forecasts: Sequence[float], actuals: Sequence[float]) -> float:
    """
    Weighted Absolute Percentage Error (WAPE):
    Total absolute error divided by total actual generation:
    WAPE = (sum(|F_i - A_i|) / sum(A_i)) * 100%
    Avoids division by zero or extreme outliers when actual generation is close to zero.
    """
    if not forecasts or not actuals or len(forecasts) != len(actuals):
        return 0.0
    total_actual = sum(actuals)
    if total_actual == 0:
        return 0.0
    total_abs_error = sum(abs(f - a) for f, a in zip(forecasts, actuals))
    return round((total_abs_error / total_actual) * 100.0, 2)

def compute_kpi_summary(forecasts: Sequence[float], actuals: Sequence[float]) -> Dict[str, Any]:
    """Computes all key quantitative error metrics for a given pair of series."""
    if not forecasts or not actuals or len(forecasts) != len(actuals):
        return {
            "count": 0,
            "mae": 0.0,
            "rmse": 0.0,
            "bias": 0.0,
            "wape": 0.0,
            "totalForecastMWh": 0.0,
            "totalActualMWh": 0.0,
            "netVolumeDeviationMWh": 0.0,
            "biasInterpretation": "Neutral"
        }
    
    mae = calculate_mae(forecasts, actuals)
    rmse = calculate_rmse(forecasts, actuals)
    bias = calculate_bias(forecasts, actuals)
    wape = calculate_wape(forecasts, actuals)
    
    # In UK half-hour settlement periods, MWh = sum(MW) * 0.5 hours
    total_forecast_mwh = round(sum(forecasts) * 0.5, 2)
    total_actual_mwh = round(sum(actuals) * 0.5, 2)
    net_vol_dev_mwh = round(total_forecast_mwh - total_actual_mwh, 2)
    
    if bias > 200:
        bias_interp = "Significant Overforecasting (Thermal shortfall / imbalance buy risk)"
    elif bias > 50:
        bias_interp = "Mild Overforecasting"
    elif bias < -200:
        bias_interp = "Significant Underforecasting (Excess thermal procured / spill risk)"
    elif bias < -50:
        bias_interp = "Mild Underforecasting"
    else:
        bias_interp = "Well-Balanced / Neutral"
        
    return {
        "count": len(forecasts),
        "mae": mae,
        "rmse": rmse,
        "bias": bias,
        "wape": wape,
        "totalForecastMWh": total_forecast_mwh,
        "totalActualMWh": total_actual_mwh,
        "netVolumeDeviationMWh": net_vol_dev_mwh,
        "biasInterpretation": bias_interp
    }

