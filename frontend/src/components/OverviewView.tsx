import React from "react";
import SplitText from "./SplitText";
import { ClockIcon, TrendingUpIcon, AlertTriangleIcon, CheckCircleIcon, ChevronRightIcon } from "./Icons";

interface OverviewViewProps {
  onGoToDecision: (date?: string) => void;
  onGoToAnalysis: () => void;
  onOpenMethodology: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onGoToDecision,
  onGoToAnalysis,
  onOpenMethodology,
}) => {
  return (
    <div className="space-y-10 py-2 max-w-5xl mx-auto">
      {/* 1. Hero Section */}
      <div className="bg-surface p-8 sm:p-10 rounded-xl border border-borderline relative overflow-hidden">
        {/* Subtle top market tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pastel-blue text-pastel-blueText text-xs font-mono font-medium mb-6">
          <ClockIcon className="w-3.5 h-3.5" />
          <span>UK Power Wholesale · Day-Ahead Market (N2EX / EPEX SPOT)</span>
        </div>

        {/* Title & Animated Heading */}
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-charcoal mb-4">
          <SplitText
            text="Wind Forecasting & Accuracy Intelligence"
            className="inline"
            delay={30}
            duration={0.6}
            splitType="words"
          />
        </h1>

        <p className="text-base text-muted max-w-3xl leading-relaxed mb-8">
          GridBricks is an energy analytics platform tailored for UK electricity utilities.
          It gives power traders the exact renewable generation forecast available at{" "}
          <strong className="text-charcoal font-semibold">Day-Ahead Gate Closure (09:50 GMT)</strong>,
          quantifies historical forecasting error (MAE, RMSE, Bias, WAPE), and enables data-backed
          decisions on thermal backup procurement with <strong className="text-charcoal font-semibold">zero lookahead bias</strong>.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onGoToDecision("2026-01-14")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-charcoal text-white hover:bg-neutral-800 transition font-medium text-xs shadow-sm hover:scale-[0.99] active:scale-[0.98]"
          >
            <span>Launch Day-Ahead Decision Desk</span>
            <ChevronRightIcon className="w-4 h-4" />
          </button>

          <button
            onClick={onGoToAnalysis}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-borderline bg-surface hover:bg-bone transition font-medium text-xs text-charcoal"
          >
            <TrendingUpIcon className="w-4 h-4 text-muted" />
            <span>Explore January 2026 Trajectory</span>
          </button>

          <button
            onClick={onOpenMethodology}
            className="px-4 py-2.5 rounded-lg border border-borderline text-muted hover:text-charcoal hover:bg-bone transition text-xs font-mono"
          >
            Trading Mathematics &amp; Cutoff Rules
          </button>
        </div>
      </div>

      {/* 2. The Core Problem & 3 Pillars Bento Grid */}
      <div>
        <div className="mb-4">
          <h2 className="text-xs font-mono uppercase tracking-wider text-muted">
            The Three Foundational Capabilities
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Pillar 1 */}
          <div className="bg-surface p-6 rounded-lg border border-borderline flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-md bg-bone border border-borderline flex items-center justify-center mb-4 text-charcoal font-mono font-bold text-xs">
                01
              </div>
              <h3 className="text-sm font-semibold text-charcoal mb-2">
                Point-in-Time "As-Of" Cutoff
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                UK Day-Ahead auction gate closure occurs at <strong className="text-charcoal">09:50 GMT on Day D-1</strong>.
                Forecasts published after this deadline are strictly disqualified to eliminate lookahead bias and reflect what the trader actually knew.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-borderline text-[11px] font-mono text-pastel-blueText">
              Zero Lookahead Enforcement
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="bg-surface p-6 rounded-lg border border-borderline flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-md bg-bone border border-borderline flex items-center justify-center mb-4 text-charcoal font-mono font-bold text-xs">
                02
              </div>
              <h3 className="text-sm font-semibold text-charcoal mb-2">
                Settlement Resolution Mapping
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                National Grid ESO publishes day-ahead wind forecasts at <strong className="text-charcoal">hourly resolution</strong>,
                while trading settlement periods (`FUELHH`) run in <strong className="text-charcoal">30-minute intervals</strong> (48 periods/day). GridBricks bridges this gap seamlessly.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-borderline text-[11px] font-mono text-muted">
              48 Periods + 24 Native Nodes
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="bg-surface p-6 rounded-lg border border-borderline flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-md bg-bone border border-borderline flex items-center justify-center mb-4 text-charcoal font-mono font-bold text-xs">
                03
              </div>
              <h3 className="text-sm font-semibold text-charcoal mb-2">
                Thermal Buffer Sizing
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Evaluating <strong className="text-charcoal">MAE, RMSE, Bias, and WAPE</strong> tells the trading desk whether
                forecasts systematically overstate or understate generation, allowing them to contract optimal thermal reserves and avoid imbalance fees.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-borderline text-[11px] font-mono text-pastel-greenText">
              Quantified Risk Mitigation
            </div>
          </div>
        </div>
      </div>

      {/* 3. Fast-Track Scenario Launchers */}
      <div className="bg-surface p-6 rounded-lg border border-borderline">
        <h3 className="text-sm font-semibold tracking-tight text-charcoal mb-1">
          Explore Specific Trading Scenarios (January 2026)
        </h3>
        <p className="text-xs text-muted mb-4">
          Click any scenario to jump directly into the decision view for that day:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => onGoToDecision("2026-01-14")}
            className="p-3.5 rounded-lg bg-bone border border-borderline hover:border-charcoal text-left transition group"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-charcoal mb-1">
              <span>Benchmark Decision</span>
              <ChevronRightIcon className="w-3.5 h-3.5 text-muted group-hover:text-charcoal" />
            </div>
            <p className="text-[11px] text-muted">
              Jan 14 decision for Jan 15 delivery. Moderate overforecasting with 9.8% WAPE.
            </p>
          </button>

          <button
            onClick={() => onGoToDecision("2026-01-18")}
            className="p-3.5 rounded-lg bg-bone border border-borderline hover:border-charcoal text-left transition group"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-pastel-greenText mb-1">
              <span>Best Forecast Accuracy</span>
              <CheckCircleIcon className="w-3.5 h-3.5" />
            </div>
            <p className="text-[11px] text-muted">
              Jan 18 decision. Exceptional forecast alignment with lowest monthly error (MAE: 767 MW).
            </p>
          </button>

          <button
            onClick={() => onGoToDecision("2026-01-27")}
            className="p-3.5 rounded-lg bg-bone border border-borderline hover:border-charcoal text-left transition group"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-pastel-redText mb-1">
              <span>Peak Volatility Day</span>
              <AlertTriangleIcon className="w-3.5 h-3.5" />
            </div>
            <p className="text-[11px] text-muted">
              Jan 27 decision. Severe wind ramp-down miss requiring heavy thermal dispatch (MAE: 5,349 MW).
            </p>
          </button>
        </div>
      </div>

      {/* 4. Live Data Source Badge */}
      <div className="p-4 rounded-lg bg-bone border border-borderline flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-muted">
        <div>
          <strong className="text-charcoal">Elexon BMRS Open Data Integration:</strong> FUELHH (WIND) + WINDFOR
        </div>
        <div className="flex items-center gap-3">
          <span>1,565 Metered Records</span>
          <span>•</span>
          <span>18,469 Forecast Records</span>
          <span>•</span>
          <span>Zero API Key Required</span>
        </div>
      </div>
    </div>
  );
};

