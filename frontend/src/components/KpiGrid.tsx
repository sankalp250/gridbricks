import React from "react";
import type { KPIs } from "../types";

interface KpiGridProps {
  kpis: KPIs;
  matchedCount: number;
  deliveryDate?: string;
}

export const KpiGrid: React.FC<KpiGridProps> = ({ kpis, matchedCount }) => {
  const isOverforecast = kpis.bias > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. MAE Card */}
      <div className="bg-surface p-5 rounded-lg border border-borderline flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-muted mb-1">
            <span className="uppercase tracking-wider font-medium">Mean Absolute Error</span>
            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-bone border border-borderline">MAE</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-charcoal tabular-nums">
              {kpis.mae.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-muted">MW</span>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-borderline text-xs text-muted">
          Avg absolute volume deviation across {matchedCount} settlement periods
        </div>
      </div>

      {/* 2. RMSE Card */}
      <div className="bg-surface p-5 rounded-lg border border-borderline flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-muted mb-1">
            <span className="uppercase tracking-wider font-medium">Root Mean Squared Error</span>
            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-bone border border-borderline">RMSE</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-charcoal tabular-nums">
              {kpis.rmse.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-muted">MW</span>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-borderline text-xs text-muted">
          Penalizes peak volatility & severe single-period forecasting errors
        </div>
      </div>

      {/* 3. Bias Card with Directional Badge */}
      <div className="bg-surface p-5 rounded-lg border border-borderline flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-muted mb-1">
            <span className="uppercase tracking-wider font-medium">Forecast Bias</span>
            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-bone border border-borderline">BIAS</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl font-bold font-mono tabular-nums ${
                isOverforecast ? "text-pastel-redText" : "text-pastel-blueText"
              }`}
            >
              {kpis.bias > 0 ? `+${kpis.bias.toLocaleString()}` : kpis.bias.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-muted">MW</span>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-borderline flex items-center justify-between">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium tracking-wide ${
              isOverforecast
                ? "bg-pastel-red text-pastel-redText"
                : "bg-pastel-blue text-pastel-blueText"
            }`}
          >
            {isOverforecast ? "Overforecasting" : "Underforecasting"}
          </span>
          <span className="text-[11px] font-mono text-muted">
            Net: {kpis.netVolumeDeviationMWh > 0 ? `+${kpis.netVolumeDeviationMWh.toLocaleString()}` : kpis.netVolumeDeviationMWh.toLocaleString()} MWh
          </span>
        </div>
      </div>

      {/* 4. WAPE Card */}
      <div className="bg-surface p-5 rounded-lg border border-borderline flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-muted mb-1">
            <span className="uppercase tracking-wider font-medium">Weighted Abs Error</span>
            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-bone border border-borderline">WAPE</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-charcoal tabular-nums">
              {kpis.wape.toFixed(1)}%
            </span>
            <span className="text-xs font-mono text-muted">of total generation</span>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-borderline flex items-center justify-between">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              kpis.wape < 15
                ? "bg-pastel-green text-pastel-greenText"
                : kpis.wape < 30
                ? "bg-pastel-yellow text-pastel-yellowText"
                : "bg-pastel-red text-pastel-redText"
            }`}
          >
            {kpis.wape < 15 ? "High Precision" : kpis.wape < 30 ? "Moderate Deviation" : "Elevated Risk"}
          </span>
          <span className="text-[11px] font-mono text-muted">
            Act: {kpis.totalActualMWh.toLocaleString()} MWh
          </span>
        </div>
      </div>
    </div>
  );
};
