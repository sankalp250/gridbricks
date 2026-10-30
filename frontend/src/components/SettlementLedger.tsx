import React, { useState } from "react";
import type { SettlementPeriod } from "../types";
import { DownloadIcon } from "./Icons";

interface SettlementLedgerProps {
  periods: SettlementPeriod[];
  deliveryDate: string;
  decisionDate: string;
}

export const SettlementLedger: React.FC<SettlementLedgerProps> = ({
  periods,
  deliveryDate,
  decisionDate,
}) => {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "over" | "under">("all");

  const filteredPeriods = periods.filter((p) => {
    if (search && !p.timeLabel.includes(search) && !p.settlementPeriod.toString().includes(search)) {
      return false;
    }
    if (filterType === "over") return p.errorMW !== null && p.errorMW > 0;
    if (filterType === "under") return p.errorMW !== null && p.errorMW < 0;
    return true;
  });

  const handleExportCSV = () => {
    const headers = [
      "SettlementPeriod",
      "StartTime",
      "TimeLabel",
      "ForecastMW",
      "ActualMW",
      "ErrorMW",
      "PercentageError",
      "IsInterpolated",
      "ForecastPublishTime",
    ];

    const rows = periods.map((p) => [
      p.settlementPeriod,
      p.startTime,
      p.timeLabel,
      p.forecastMW ?? "",
      p.actualMW ?? "",
      p.errorMW ?? "",
      p.percentageError ?? "",
      p.isInterpolated ? "TRUE" : "FALSE",
      p.forecastPublishTime ?? "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `gridbricks_settlement_${deliveryDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-surface rounded-lg border border-borderline overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-borderline flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-charcoal">
            Settlement Period Ledger (48 Half-Hours)
          </h3>
          <p className="text-xs text-muted">
            Detailed half-hourly breakdown for delivery date {deliveryDate} (Decision: {decisionDate})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Filter */}
          <div className="flex items-center gap-1 bg-bone p-1 rounded-md border border-borderline text-xs">
            <button
              onClick={() => setFilterType("all")}
              className={`px-2 py-0.5 rounded font-medium ${
                filterType === "all" ? "bg-surface text-charcoal shadow-sm border border-borderline" : "text-muted"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType("over")}
              className={`px-2 py-0.5 rounded font-medium ${
                filterType === "over" ? "bg-surface text-charcoal shadow-sm border border-borderline" : "text-muted"
              }`}
            >
              Overforecast
            </button>
            <button
              onClick={() => setFilterType("under")}
              className={`px-2 py-0.5 rounded font-medium ${
                filterType === "under" ? "bg-surface text-charcoal shadow-sm border border-borderline" : "text-muted"
              }`}
            >
              Underforecast
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search period / time..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-2.5 py-1 text-xs bg-bone border border-borderline rounded-md font-mono focus:outline-none focus:border-charcoal w-36"
          />

          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-md bg-charcoal text-white hover:bg-neutral-800 transition font-medium"
          >
            <DownloadIcon className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Element */}
      <div className="overflow-x-auto max-h-[420px]">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-bone text-muted uppercase text-[10px] tracking-wider sticky top-0 border-b border-borderline">
            <tr>
              <th className="px-4 py-2.5">Period</th>
              <th className="px-4 py-2.5">Time</th>
              <th className="px-4 py-2.5 text-right">Forecast (MW)</th>
              <th className="px-4 py-2.5 text-right">Actual (MW)</th>
              <th className="px-4 py-2.5 text-right">Error (Δ MW)</th>
              <th className="px-4 py-2.5 text-right">% Error</th>
              <th className="px-4 py-2.5 text-center">Type</th>
              <th className="px-4 py-2.5">Publish Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borderline">
            {filteredPeriods.map((p) => {
              const isOver = p.errorMW !== null && p.errorMW > 0;
              return (
                <tr key={p.settlementPeriod} className="hover:bg-bone transition-colors">
                  <td className="px-4 py-2 font-semibold text-charcoal">
                    SP {p.settlementPeriod}
                  </td>
                  <td className="px-4 py-2 text-muted">{p.timeLabel}</td>
                  <td className="px-4 py-2 text-right font-medium text-charcoal tabular-nums">
                    {p.forecastMW !== null ? p.forecastMW.toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-2 text-right font-medium text-pastel-blueText tabular-nums">
                    {p.actualMW !== null ? p.actualMW.toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {p.errorMW !== null ? (
                      <span
                        className={`font-semibold ${
                          isOver ? "text-pastel-redText" : "text-pastel-blueText"
                        }`}
                      >
                        {p.errorMW > 0 ? `+${p.errorMW.toLocaleString()}` : p.errorMW.toLocaleString()}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {p.percentageError !== null ? (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${
                          isOver
                            ? "bg-pastel-red text-pastel-redText"
                            : "bg-pastel-blue text-pastel-blueText"
                        }`}
                      >
                        {p.percentageError > 0 ? `+` : ""}
                        {p.percentageError.toFixed(1)}%
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {p.isInterpolated ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-bone text-muted border border-borderline">
                        Trading 30m
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface text-charcoal border border-borderline font-semibold">
                        Native Node
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-muted text-[11px]">
                    {p.forecastPublishTime
                      ? p.forecastPublishTime.replace("T", " ").replace("Z", " UTC")
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
