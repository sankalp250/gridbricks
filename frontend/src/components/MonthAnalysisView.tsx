import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import type { MonthAnalysisResponse } from "../types";
import { CheckCircleIcon, AlertTriangleIcon, ChevronRightIcon } from "./Icons";

interface MonthAnalysisViewProps {
  data: MonthAnalysisResponse;
  onSelectDay: (date: string) => void;
}

export const MonthAnalysisView: React.FC<MonthAnalysisViewProps> = ({
  data,
  onSelectDay,
}) => {
  const chartData = data.dailyBreakdown.map((d) => ({
    date: d.decisionDate.slice(5), // "01-14"
    fullDate: d.decisionDate,
    deliveryDate: d.deliveryDate,
    mae: d.mae,
    bias: d.bias,
    wape: d.wape,
  }));

  const { monthlyKPIs, bestForecastDay, worstForecastDay } = data;

  return (
    <div className="space-y-6">
      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface p-5 rounded-lg border border-borderline">
          <div className="text-xs text-muted font-medium uppercase tracking-wider mb-1">
            January Aggregate MAE
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-charcoal tabular-nums">
              {monthlyKPIs.mae.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-muted">MW</span>
          </div>
          <p className="mt-3 text-xs text-muted">
            Average absolute error volume over 1,488 settlement periods
          </p>
        </div>

        <div className="bg-surface p-5 rounded-lg border border-borderline">
          <div className="text-xs text-muted font-medium uppercase tracking-wider mb-1">
            January Systemic Bias
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl font-bold font-mono tabular-nums ${
                monthlyKPIs.bias > 0 ? "text-pastel-redText" : "text-pastel-blueText"
              }`}
            >
              {monthlyKPIs.bias > 0 ? `+${monthlyKPIs.bias.toLocaleString()}` : monthlyKPIs.bias.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-muted">MW</span>
          </div>
          <div className="mt-3">
            <span className="text-xs px-2 py-0.5 rounded-full bg-pastel-red text-pastel-redText font-medium">
              Overforecasting Dominant
            </span>
          </div>
        </div>

        <div className="bg-surface p-5 rounded-lg border border-borderline">
          <div className="text-xs text-muted font-medium uppercase tracking-wider mb-1">
            Aggregate WAPE
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-charcoal tabular-nums">
              {monthlyKPIs.wape.toFixed(1)}%
            </span>
            <span className="text-xs font-mono text-muted">error vs total gen</span>
          </div>
          <p className="mt-3 text-xs text-muted">
            Normalized volume error relative to total January wind production
          </p>
        </div>

        <div className="bg-surface p-5 rounded-lg border border-borderline">
          <div className="text-xs text-muted font-medium uppercase tracking-wider mb-1">
            Net Imbalance Exposure
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-pastel-redText tabular-nums">
              +{(monthlyKPIs.netVolumeDeviationMWh / 1000).toFixed(0)}k
            </span>
            <span className="text-xs font-mono text-muted">MWh</span>
          </div>
          <p className="mt-3 text-xs text-muted">
            Total wind energy over-forecasted requiring thermal dispatch compensation
          </p>
        </div>
      </div>

      {/* Best vs Worst Performance Benchmark */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bestForecastDay && (
          <div
            onClick={() => onSelectDay(bestForecastDay.decisionDate)}
            className="bg-surface p-5 rounded-lg border border-borderline hover:border-charcoal transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-pastel-greenText flex items-center gap-1.5">
                <CheckCircleIcon className="w-4 h-4" />
                Best Forecast Day
              </span>
              <span className="text-xs text-muted group-hover:text-charcoal flex items-center gap-1">
                Inspect Day <ChevronRightIcon className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <span className="font-mono font-bold text-lg text-charcoal">
                  Decision: {bestForecastDay.decisionDate}
                </span>
                <p className="text-xs text-muted">Delivery: {bestForecastDay.deliveryDate}</p>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-base text-charcoal">
                  MAE: {bestForecastDay.mae} MW
                </div>
                <div className="text-xs font-mono text-muted">WAPE: {bestForecastDay.wape}%</div>
              </div>
            </div>
          </div>
        )}

        {worstForecastDay && (
          <div
            onClick={() => onSelectDay(worstForecastDay.decisionDate)}
            className="bg-surface p-5 rounded-lg border border-borderline hover:border-charcoal transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-pastel-redText flex items-center gap-1.5">
                <AlertTriangleIcon className="w-4 h-4" />
                Peak Volatility Day (Maximum Error)
              </span>
              <span className="text-xs text-muted group-hover:text-charcoal flex items-center gap-1">
                Inspect Day <ChevronRightIcon className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <span className="font-mono font-bold text-lg text-charcoal">
                  Decision: {worstForecastDay.decisionDate}
                </span>
                <p className="text-xs text-muted">Delivery: {worstForecastDay.deliveryDate}</p>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-base text-pastel-redText">
                  MAE: {worstForecastDay.mae} MW
                </div>
                <div className="text-xs font-mono text-muted">WAPE: {worstForecastDay.wape}%</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Daily MAE & Bias Trajectory Chart */}
      <div className="bg-surface p-6 rounded-lg border border-borderline">
        <div className="pb-4 mb-4 border-b border-borderline">
          <h3 className="text-sm font-semibold tracking-tight text-charcoal">
            Daily Forecast Error Trajectory · January 2026
          </h3>
          <p className="text-xs text-muted">
            Daily Mean Absolute Error (MAE) and Forecast Bias for every Day-Ahead purchasing decision
          </p>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              onClick={(state: any) => {
                if (state && state.activePayload && state.activePayload.length) {
                  const clickedDate = state.activePayload[0].payload.fullDate;
                  onSelectDay(clickedDate);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#EAEAEA" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={{ stroke: "#EAEAEA" }}
                tick={{ fill: "#787774", fontSize: 11, fontFamily: "monospace" }}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: "#EAEAEA" }}
                tick={{ fill: "#787774", fontSize: 11, fontFamily: "monospace" }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                unit=" MW"
              />
              <Tooltip content={<MonthTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 12, fontSize: 12, fontFamily: "sans-serif" }}
              />
              <Bar dataKey="mae" name="Daily MAE (MW)" fill="#111111" radius={[3, 3, 0, 0]} />
              <Bar dataKey="bias" name="Forecast Bias (MW)" fill="#1F6C9F" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 text-center text-xs text-muted font-mono">
          Click any bar to drill down into that day's 48 settlement periods
        </div>
      </div>
    </div>
  );
};

const MonthTooltip = ({ active, payload, label: _label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-surface p-3.5 rounded-lg border border-borderline shadow-sm text-xs font-mono">
        <div className="font-semibold text-charcoal pb-2 mb-2 border-b border-borderline">
          Decision: {data.fullDate} (Delivery: {data.deliveryDate})
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between gap-4">
            <span className="text-muted">MAE:</span>
            <span className="font-bold text-charcoal tabular-nums">{data.mae} MW</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted">Bias:</span>
            <span className="font-bold text-pastel-blueText tabular-nums">
              {data.bias > 0 ? `+${data.bias}` : data.bias} MW
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted">WAPE:</span>
            <span className="font-bold text-charcoal tabular-nums">{data.wape}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};
