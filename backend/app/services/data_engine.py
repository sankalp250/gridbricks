import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional
import pandas as pd
from app.core.config import settings
from app.services.elexon import ElexonClient
from app.services.metrics import compute_kpi_summary

logger = logging.getLogger(__name__)

class DataEngine:
    """
    GridBricks Point-in-Time Analytics Engine.
    Enforces Day-Ahead Market Gate Closure cutoff (09:50 GMT on D-1) to eliminate lookahead bias,
    joins point-in-time forecasts with actual generation, and computes quantitative error metrics.
    """
    def __init__(self, elexon_client: Optional[ElexonClient] = None):
        self.client = elexon_client or ElexonClient()
        self._actuals_df: Optional[pd.DataFrame] = None
        self._forecasts_df: Optional[pd.DataFrame] = None

    def initialize_data(self, force_refresh: bool = False):
        """Loads data into memory from cache or downloads if not present."""
        data = self.client.sync_and_cache(force=force_refresh)
        cached = self.client.load_cached_data()

        actuals = cached.get("actuals", [])
        forecasts = cached.get("forecasts", [])

        if actuals:
            df_act = pd.DataFrame(actuals)
            df_act["startTime"] = pd.to_datetime(df_act["startTime"], utc=True)
            if "publishTime" in df_act.columns:
                df_act["publishTime"] = pd.to_datetime(df_act["publishTime"], utc=True)
            self._actuals_df = df_act
        else:
            self._actuals_df = pd.DataFrame(columns=["startTime", "generation", "settlementPeriod", "settlementDate"])

        if forecasts:
            df_fc = pd.DataFrame(forecasts)
            df_fc["startTime"] = pd.to_datetime(df_fc["startTime"], utc=True)
            df_fc["publishTime"] = pd.to_datetime(df_fc["publishTime"], utc=True)
            self._forecasts_df = df_fc
        else:
            self._forecasts_df = pd.DataFrame(columns=["startTime", "publishTime", "generation"])

        logger.info(f"Initialized DataEngine: {len(self._actuals_df)} actuals, {len(self._forecasts_df)} forecasts.")

    def ensure_data_loaded(self):
        if self._actuals_df is None or self._forecasts_df is None:
            self.initialize_data()

    def get_available_decision_dates(self) -> List[str]:
        """Returns all decision dates in January 2026 (2026-01-01 to 2026-01-31)."""
        start = datetime.strptime("2026-01-01", "%Y-%m-%d")
        dates = [(start + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(31)]
        return dates

    def evaluate_decision_date(
        self,
        decision_date_str: str,
        cutoff_time_str: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Evaluate a single day-ahead purchasing decision.
        
        Logic:
        1. Decision Date: D (e.g. 2026-01-14)
        2. Delivery Date: D+1 (e.g. 2026-01-15)
        3. Cutoff Timestamp: D at cutoff_time (e.g. 2026-01-14 09:50:00 UTC)
        4. Delivery Window: Delivery Date 00:00:00 UTC to 23:30:00 UTC (48 settlement periods)
        5. For each settlement period startTime:
           Filter WINDFOR where publishTime <= Cutoff Timestamp.
           Pick the latest available (max publishTime).
        6. Join with FUELHH actual generation for the delivery day.
        7. Calculate Error = Forecast - Actual and compute MAE, RMSE, Bias, WAPE.
        """
        self.ensure_data_loaded()

        cutoff_time_str = cutoff_time_str or settings.GATE_CLOSURE_TIME
        decision_dt = datetime.strptime(decision_date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        delivery_dt = decision_dt + timedelta(days=1)
        delivery_date_str = delivery_dt.strftime("%Y-%m-%d")

        # Parse cutoff time
        cutoff_hour, cutoff_min, cutoff_sec = map(int, cutoff_time_str.split(":"))
        cutoff_dt = decision_dt.replace(hour=cutoff_hour, minute=cutoff_min, second=cutoff_sec)

        # Define delivery window (00:00:00 to 23:30:00)
        window_start = delivery_dt.replace(hour=0, minute=0, second=0, microsecond=0)
        window_end = delivery_dt.replace(hour=23, minute=30, second=0, microsecond=0)

        # 1. Filter forecasts published on or before gate closure for delivery window
        fc_df = self._forecasts_df[
            (self._forecasts_df["publishTime"] <= cutoff_dt) &
            (self._forecasts_df["startTime"] >= window_start) &
            (self._forecasts_df["startTime"] <= window_end)
        ].copy()

        periods_data: List[Dict[str, Any]] = []

        # Generate expected 48 settlement periods
        expected_times = [window_start + timedelta(minutes=30 * i) for i in range(settings.SETTLEMENT_PERIODS_PER_DAY)]

        # Actuals for the delivery day
        act_df = self._actuals_df[
            (self._actuals_df["startTime"] >= window_start) &
            (self._actuals_df["startTime"] <= window_end)
        ].copy()

        # Deduplicate actuals by taking the latest publication if multiple exist
        if not act_df.empty and "publishTime" in act_df.columns:
            act_df = act_df.sort_values("publishTime").groupby("startTime").last().reset_index()
        elif not act_df.empty:
            act_df = act_df.groupby("startTime").first().reset_index()

        act_map = {row["startTime"]: row["generation"] for _, row in act_df.iterrows()}

        # Deduplicate forecasts by selecting the latest publishTime <= cutoff for each startTime
        # Also grab the next hour's forecast (e.g. next day 00:00) for clean interpolation at 23:30 if present
        extended_end = window_end + timedelta(hours=1)
        extended_fc_df = self._forecasts_df[
            (self._forecasts_df["publishTime"] <= cutoff_dt) &
            (self._forecasts_df["startTime"] >= window_start) &
            (self._forecasts_df["startTime"] <= extended_end)
        ].copy()

        if not extended_fc_df.empty:
            fc_latest = extended_fc_df.sort_values("publishTime").groupby("startTime").last().reset_index()
            fc_map = {row["startTime"]: (row["generation"], row["publishTime"]) for _, row in fc_latest.iterrows()}
        else:
            fc_map = {}

        # Build full 48 settlement periods with interpolation for half-hours
        # (WINDFOR is published at 1-hour resolution for Day-Ahead; FUELHH is 30-min resolution)
        periods_data: List[Dict[str, Any]] = []
        matched_hourly_forecasts: List[float] = []
        matched_hourly_actuals: List[float] = []
        matched_all_forecasts: List[float] = []
        matched_all_actuals: List[float] = []

        for period_idx, t in enumerate(expected_times, start=1):
            t_iso = t.strftime("%Y-%m-%dT%H:%M:%SZ")
            time_label = t.strftime("%H:%M")
            is_hourly_node = (t.minute == 0)

            act_val = act_map.get(t, None)
            fc_val = None
            fc_pub = None
            is_interpolated = False

            if t in fc_map:
                fc_val, fc_pub = fc_map[t]
                is_interpolated = False
            else:
                # Interpolate between preceding hour (:00) and following hour (:00)
                prev_t = t.replace(minute=0)
                next_t = prev_t + timedelta(hours=1)
                if prev_t in fc_map and next_t in fc_map:
                    fc_val = round((fc_map[prev_t][0] + fc_map[next_t][0]) / 2.0, 2)
                    fc_pub = max(fc_map[prev_t][1], fc_map[next_t][1])
                    is_interpolated = True
                elif prev_t in fc_map:
                    fc_val = fc_map[prev_t][0]
                    fc_pub = fc_map[prev_t][1]
                    is_interpolated = True

            error_mw = None
            pct_error = None

            if fc_val is not None and act_val is not None:
                error_mw = round(fc_val - act_val, 2)
                pct_error = round((error_mw / act_val) * 100.0, 2) if act_val > 0 else 0.0
                
                matched_all_forecasts.append(fc_val)
                matched_all_actuals.append(act_val)
                if is_hourly_node:
                    matched_hourly_forecasts.append(fc_val)
                    matched_hourly_actuals.append(act_val)

            periods_data.append({
                "settlementPeriod": period_idx,
                "startTime": t_iso,
                "timeLabel": time_label,
                "forecastMW": round(fc_val, 2) if fc_val is not None else None,
                "actualMW": round(act_val, 2) if act_val is not None else None,
                "errorMW": error_mw,
                "percentageError": pct_error,
                "isInterpolated": is_interpolated,
                "isHourlyNode": is_hourly_node,
                "forecastPublishTime": fc_pub.strftime("%Y-%m-%dT%H:%M:%SZ") if fc_pub else None
            })

        # Calculate KPIs for both full 48 settlement periods (with trading interpolation)
        # and exact native 24 hourly nodes
        kpis_48 = compute_kpi_summary(matched_all_forecasts, matched_all_actuals)
        kpis_hourly = compute_kpi_summary(matched_hourly_forecasts, matched_hourly_actuals)

        return {
            "decisionDate": decision_date_str,
            "deliveryDate": delivery_date_str,
            "gateClosureCutoff": cutoff_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "periodsCount": len(periods_data),
            "matchedPeriodsCount": len(matched_all_forecasts),
            "matchedHourlyCount": len(matched_hourly_forecasts),
            "kpis": kpis_48,
            "hourlyKpis": kpis_hourly,
            "settlementPeriods": periods_data
        }

    def evaluate_month_summary(
        self,
        start_date: str = "2026-01-01",
        end_date: str = "2026-01-31",
        cutoff_time_str: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Evaluate all day-ahead decisions across January 2026.
        Returns daily metric trajectories, overall monthly performance, and distribution stats.
        """
        self.ensure_data_loaded()
        
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_dt = datetime.strptime(end_date, "%Y-%m-%d")
        
        num_days = (end_dt - start_dt).days + 1
        daily_results: List[Dict[str, Any]] = []
        
        all_forecasts: List[float] = []
        all_actuals: List[float] = []

        for i in range(num_days):
            cur_date = (start_dt + timedelta(days=i)).strftime("%Y-%m-%d")
            res = self.evaluate_decision_date(cur_date, cutoff_time_str=cutoff_time_str)
            kpi = res["kpis"]
            
            # Extract matched series
            for p in res["settlementPeriods"]:
                if p["forecastMW"] is not None and p["actualMW"] is not None:
                    all_forecasts.append(p["forecastMW"])
                    all_actuals.append(p["actualMW"])

            daily_results.append({
                "decisionDate": cur_date,
                "deliveryDate": res["deliveryDate"],
                "mae": kpi["mae"],
                "rmse": kpi["rmse"],
                "bias": kpi["bias"],
                "wape": kpi["wape"],
                "matchedCount": res["matchedPeriodsCount"],
                "totalForecastMWh": kpi["totalForecastMWh"],
                "totalActualMWh": kpi["totalActualMWh"],
                "biasInterpretation": kpi["biasInterpretation"]
            })

        # Overall month KPI
        monthly_kpis = compute_kpi_summary(all_forecasts, all_actuals)

        # Identify best, worst, and high-risk days
        sorted_by_mae = sorted(daily_results, key=lambda x: x["mae"])
        best_day = sorted_by_mae[0] if sorted_by_mae else None
        worst_day = sorted_by_mae[-1] if sorted_by_mae else None

        return {
            "period": {"from": start_date, "to": end_date},
            "gateClosureTime": cutoff_time_str or settings.GATE_CLOSURE_TIME,
            "totalDays": len(daily_results),
            "monthlyKPIs": monthly_kpis,
            "bestForecastDay": best_day,
            "worstForecastDay": worst_day,
            "dailyBreakdown": daily_results
        }
