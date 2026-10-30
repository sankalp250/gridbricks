import React from "react";
import { ClockIcon, InfoIcon, RefreshCwIcon } from "./Icons";

interface HeaderProps {
  dates: string[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  activeTab: "overview" | "decision" | "analysis";
  onChangeTab: (tab: "overview" | "decision" | "analysis") => void;
  onOpenMethodology: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  deliveryDate?: string;
}

export const Header: React.FC<HeaderProps> = ({
  dates,
  selectedDate,
  onSelectDate,
  activeTab,
  onChangeTab,
  onOpenMethodology,
  onRefresh,
  isRefreshing,
  deliveryDate,
}) => {
  return (
    <header className="border-b border-borderline bg-surface sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand & Market Context */}
            <div
              onClick={() => onChangeTab("overview")}
              className="flex items-center gap-3 cursor-pointer group"
              title="Return to Product Overview"
            >
              <div className="w-9 h-9 rounded-md bg-charcoal text-white flex items-center justify-center font-mono font-bold text-sm tracking-wider group-hover:bg-neutral-800 transition">
                GB
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-semibold text-base tracking-tight text-charcoal">
                    GridBricks
                  </h1>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-pastel-blue text-pastel-blueText font-medium tracking-wide">
                    N2EX Day-Ahead
                  </span>
                </div>
                <p className="text-xs text-muted">
                  UK National Wind Forecast Accuracy Platform · Elexon BMRS
                </p>
              </div>
            </div>

            {/* View Switcher & Date Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Tab Selector */}
              <div className="flex bg-bone p-1 rounded-md border border-borderline">
                <button
                  onClick={() => onChangeTab("overview")}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${activeTab === "overview"
                      ? "bg-surface text-charcoal shadow-sm border border-borderline"
                      : "text-muted hover:text-charcoal"
                    }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => onChangeTab("decision")}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${activeTab === "decision"
                      ? "bg-surface text-charcoal shadow-sm border border-borderline"
                      : "text-muted hover:text-charcoal"
                    }`}
                >
                  Day-Ahead Decision
                </button>
                <button
                  onClick={() => onChangeTab("analysis")}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${activeTab === "analysis"
                      ? "bg-surface text-charcoal shadow-sm border border-borderline"
                      : "text-muted hover:text-charcoal"
                    }`}
                >
                  January 2026 Review
                </button>
              </div>

              {activeTab === "decision" && (
                <div className="flex items-center gap-2 bg-bone px-3 py-1.5 rounded-md border border-borderline text-xs">
                  <span className="text-muted">Decision Date:</span>
                  <select
                    value={selectedDate}
                    onChange={(e) => onSelectDate(e.target.value)}
                    className="bg-transparent font-mono font-medium text-charcoal focus:outline-none cursor-pointer"
                  >
                    {dates.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  {deliveryDate && (
                    <span className="text-muted border-l border-borderline pl-2">
                      Delivery: <strong className="font-mono text-charcoal">{deliveryDate}</strong>
                    </span>
                  )}
                </div>
              )}

              {/* Gate Closure Cutoff Pill */}
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-pastel-yellow text-pastel-yellowText text-xs font-mono">
                <ClockIcon className="w-3.5 h-3.5" />
                <span>Gate Closure: 09:50 GMT</span>
              </div>

              {/* Methodology & Refresh Buttons */}
              <button
                onClick={onOpenMethodology}
                title="View Trading Methodology & Error Formulas"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-borderline text-muted hover:text-charcoal hover:bg-bone transition"
              >
                <InfoIcon className="w-3.5 h-3.5" />
                <span>Methodology</span>
              </button>

              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                title="Refresh Data from Elexon BMRS"
                className="p-1.5 rounded-md border border-borderline text-muted hover:text-charcoal hover:bg-bone transition disabled:opacity-50"
              >
                <RefreshCwIcon className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </header>
        );
};
