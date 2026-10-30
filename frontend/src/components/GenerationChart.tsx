import React, { useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import type { SettlementPeriod } from "../types";

interface GenerationChartProps {
  periods: SettlementPeriod[];
  deliveryDate: string;
}

export const GenerationChart: React.FC<GenerationChartProps> = ({
  periods,
  deliveryDate,
}) => {
  const [filterMode, setFilterMode] = useState<"all" | "hourly">("all");

  const chartData = (filterMode === "hourly"
    ? periods.filter((p) => p.isHourlyNode)
    : periods
  ).map((p) => ({
    timeLabel: p.timeLabel,
    period: p.settlementPeriod,
    forecast: p.forecastMW,
    actual: p.actualMW,
    error: p.errorMW,
    pctError: p.percentageError,
    isInterpolated: p.isInterpolated,
  }));

  return (
    <div className="bg-surface p-6 rounded-lg border border-borderline">
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-borderline gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-charcoal">
            Generation Profile · Delivery Day: {deliveryDate}
          </h2>
          <p className="text-xs text-muted">
            Point-in-Time Day-Ahead Forecast (locked at 09:50 GMT D-1) vs Metered Actual Wind Generation
          </p>
        </div>

        {/* Granularity Switcher */}
        <div className="flex items-center gap-1 bg-bone p-1 rounded-md border border-borderline text-xs">
          <button
            onClick={() => setFilterMode("all")}
            className={`px-2.5 py-1 rounded font-medium transition ${
              filterMode === "all"
                ? "bg-surface text-charcoal shadow-sm border border-borderline"
                : "text-muted hover:text-charcoal"
            }`}
          >
            All 48 Periods (Trading)
          </button>
          <button
            onClick={() => setFilterMode("hourly")}
            className={`px-2.5 py-1 rounded font-medium transition ${
              filterMode === "hourly"
                ? "bg-surface text-charcoal shadow-sm border border-borderline"
                : "text-muted hover:text-charcoal"
            }`}
          >
            24 Hourly Nodes (Native)
          </button>
        </div>
      </div>

      {/* Recharts Canvas */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EAEAEA" vertical={false} />
            <XAxis
              dataKey="timeLabel"
              tickLine={false}
              axisLine={{ stroke: "#EAEAEA" }}
              tick={{ fill: "#787774", fontSize: 11, fontFamily: "monospace" }}
              interval={filterMode === "all" ? 3 : 1}
            />
            <YAxis
              tickLine={false}
              axisLine={{ stroke: "#EAEAEA" }}
              tick={{ fill: "#787774", fontSize: 11, fontFamily: "monospace" }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              unit=" MW"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="plainline"
              wrapperStyle={{ paddingBottom: 16, fontSize: 12, fontFamily: "sans-serif" }}
            />
            {/* Forecast Line */}
            <Line
              type="monotone"
              dataKey="forecast"
              name="Day-Ahead Forecast (MW)"
              stroke="#111111"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: "#111111", fill: "#FFFFFF", strokeWidth: 2 }}
            />
            {/* Actual Generation Line */}
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual Generation (MW)"
              stroke="#1F6C9F"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: "#1F6C9F", fill: "#FFFFFF", strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label: _label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isOver = data.error > 0;

    return (
      <div className="bg-surface p-3.5 rounded-lg border border-borderline shadow-sm text-xs font-mono">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-borderline gap-4">
          <span className="font-semibold text-charcoal">
            Period {data.period} ({data.timeLabel})
          </span>
          {data.isInterpolated && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-bone text-muted">
              Interpolated
            </span>
          )}
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between gap-4">
            <span className="text-muted">Forecast:</span>
            <span className="font-semibold text-charcoal tabular-nums">
              {data.forecast !== null ? `${data.forecast.toLocaleString()} MW` : "N/A"}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted">Actual:</span>
            <span className="font-semibold text-pastel-blueText tabular-nums">
              {data.actual !== null ? `${data.actual.toLocaleString()} MW` : "N/A"}
            </span>
          </div>
          <div className="flex justify-between gap-4 pt-1.5 border-t border-borderline">
            <span className="text-muted">Error (Δ):</span>
            <span
              className={`font-bold tabular-nums ${
                isOver ? "text-pastel-redText" : "text-pastel-blueText"
              }`}
            >
              {data.error > 0 ? `+${data.error.toLocaleString()}` : data.error?.toLocaleString()} MW
              {data.pctError !== null && ` (${data.pctError > 0 ? `+` : ""}${data.pctError.toFixed(1)}%)`}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};
