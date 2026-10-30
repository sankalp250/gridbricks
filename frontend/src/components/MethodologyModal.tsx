import React from "react";

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface rounded-xl border border-borderline max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-borderline">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-charcoal">
              GridBricks Methodology & Trading Mathematics
            </h3>
            <p className="text-xs text-muted">
              UK Day-Ahead Market Rules, Cutoff Enforcements & Quantitative Metric Definitions
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md border border-borderline flex items-center justify-center text-muted hover:text-charcoal hover:bg-bone transition font-mono text-sm"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 text-xs leading-relaxed text-charcoal">
          {/* 1. Point-in-Time & Gate Closure */}
          <div>
            <h4 className="font-semibold text-charcoal uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pastel-yellowText"></span>
              1. The Day-Ahead Market Gate Closure (09:50 GMT)
            </h4>
            <p className="text-muted">
              In Great Britain's wholesale electricity market (N2EX / EPEX SPOT auctions), the trading desk
              must submit final purchase commitments for delivery day <code className="font-mono bg-bone px-1 py-0.5 rounded border border-borderline text-charcoal">D</code> by{" "}
              <strong className="text-charcoal">09:50 GMT on day D-1</strong>.
            </p>
            <div className="mt-2 p-3 rounded-lg bg-bone border border-borderline font-mono text-[11px]">
              <strong>Strict Lookahead Ban:</strong> Any forecast published after 09:50 GMT is strictly
              excluded. The system filters for:
              <br />
              <code className="text-pastel-blueText font-semibold">
                publishTime &le; DecisionDate + 09:50:00Z
              </code>
              <br />
              and chooses the latest eligible forecast for each settlement period.
            </div>
          </div>

          {/* 2. Elexon Datasets */}
          <div>
            <h4 className="font-semibold text-charcoal uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pastel-blueText"></span>
              2. Data Sources (Elexon BMRS)
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-muted">
              <li>
                <strong className="text-charcoal">FUELHH:</strong> Half-hourly outturn generation by fuel type.
                Filtered specifically for <code className="font-mono bg-bone px-1 rounded text-charcoal">fuelType == 'WIND'</code>.
              </li>
              <li>
                <strong className="text-charcoal">WINDFOR:</strong> National wind generation forecasts published
                by National Grid ESO at hourly resolution for the day-ahead horizon.
              </li>
              <li>
                <strong className="text-charcoal">Trading 30m Resampling:</strong> Half-hourly settlement periods
                between hourly nodes are linearly interpolated to match UK market settlement standards.
              </li>
            </ul>
          </div>

          {/* 3. Mathematical Metric Definitions */}
          <div>
            <h4 className="font-semibold text-charcoal uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pastel-greenText"></span>
              3. Quantitative Error Formulas
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <div className="p-3 rounded-lg bg-bone border border-borderline">
                <span className="font-mono font-bold text-charcoal">MAE (Mean Absolute Error)</span>
                <p className="mt-1 text-[11px] text-muted">
                  Mean absolute magnitude of forecast error:
                </p>
                <div className="font-mono font-semibold text-charcoal text-[11px] mt-1">
                  MAE = (1 / n) &Sigma; |F - A|
                </div>
              </div>

              <div className="p-3 rounded-lg bg-bone border border-borderline">
                <span className="font-mono font-bold text-charcoal">RMSE (Root Mean Squared Error)</span>
                <p className="mt-1 text-[11px] text-muted">
                  Penalizes extreme deviations / severe volatility:
                </p>
                <div className="font-mono font-semibold text-charcoal text-[11px] mt-1">
                  RMSE = &radic;((1 / n) &Sigma; (F - A)&sup2;)
                </div>
              </div>

              <div className="p-3 rounded-lg bg-bone border border-borderline">
                <span className="font-mono font-bold text-charcoal">Forecast Bias</span>
                <p className="mt-1 text-[11px] text-muted">
                  Directional tendency (positive = overforecasting):
                </p>
                <div className="font-mono font-semibold text-charcoal text-[11px] mt-1">
                  Bias = (1 / n) &Sigma; (F - A)
                </div>
              </div>

              <div className="p-3 rounded-lg bg-bone border border-borderline">
                <span className="font-mono font-bold text-charcoal">WAPE (Weighted Abs % Error)</span>
                <p className="mt-1 text-[11px] text-muted">
                  Error normalized against total wind volume:
                </p>
                <div className="font-mono font-semibold text-charcoal text-[11px] mt-1">
                  WAPE = (&Sigma; |F - A| / &Sigma; A) &times; 100%
                </div>
              </div>
            </div>
          </div>

          {/* 4. Commercial Procurement Rule */}
          <div className="p-3 rounded-lg bg-pastel-green border border-borderline text-pastel-greenText">
            <strong className="block font-semibold mb-1">Commercial Procurement Recommendation:</strong>
            When <code className="font-mono font-bold">Bias &gt; 0</code> (systematic overforecasting), the utility risks
            wind shortfalls during delivery. The trading desk should contract a thermal buffer equal to{" "}
            <code className="font-mono font-bold">Bias + 0.5 &times; RMSE</code> to prevent expensive cash-out imbalance penalties.
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-borderline flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs rounded-md bg-charcoal text-white hover:bg-neutral-800 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

