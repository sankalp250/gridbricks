import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { OverviewView } from "./components/OverviewView";
import { KpiGrid } from "./components/KpiGrid";
import { GenerationChart } from "./components/GenerationChart";
import { SettlementLedger } from "./components/SettlementLedger";
import { MonthAnalysisView } from "./components/MonthAnalysisView";
import { MethodologyModal } from "./components/MethodologyModal";
import {
  fetchAvailableDates,
  fetchDecisionAnalysis,
  fetchMonthAnalysis,
  triggerSync,
} from "./services/api";
import type { DecisionResponse, MonthAnalysisResponse } from "./types";
import { AlertTriangleIcon, RefreshCwIcon } from "./components/Icons";

export function App() {
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("2026-01-14");
  const [activeTab, setActiveTab] = useState<"overview" | "decision" | "analysis">("overview");
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  const [decisionData, setDecisionData] = useState<DecisionResponse | null>(null);
  const [monthData, setMonthData] = useState<MonthAnalysisResponse | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize available dates
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const availableDates = await fetchAvailableDates();
        setDates(availableDates);
        if (availableDates.length > 0 && !availableDates.includes(selectedDate)) {
          setSelectedDate(availableDates[0]);
        }
      } catch (err: any) {
        console.error("Failed to fetch dates:", err);
        setError("Could not connect to GridBricks API. Please ensure the backend is running on port 8000.");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Fetch decision data when selectedDate changes
  useEffect(() => {
    if (!selectedDate) return;

    let isMounted = true;
    async function loadDecision() {
      try {
        setError(null);
        const data = await fetchDecisionAnalysis(selectedDate);
        if (isMounted) {
          setDecisionData(data);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Failed to load decision data:", err);
          setError(`Error loading decision for ${selectedDate}: ${err.message}`);
        }
      }
    }

    loadDecision();
    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  // Fetch month data when switching to analysis tab
  useEffect(() => {
    if (activeTab === "analysis" && !monthData) {
      async function loadMonth() {
        try {
          const data = await fetchMonthAnalysis("2026-01-01", "2026-01-31");
          setMonthData(data);
        } catch (err: any) {
          console.error("Failed to load month analysis:", err);
        }
      }
      loadMonth();
    }
  }, [activeTab, monthData]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await triggerSync(true);
      // Reload current views
      const d = await fetchDecisionAnalysis(selectedDate);
      setDecisionData(d);
      if (activeTab === "analysis" || monthData) {
        const m = await fetchMonthAnalysis("2026-01-01", "2026-01-31");
        setMonthData(m);
      }
    } catch (err: any) {
      console.error("Refresh failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSelectDayFromMonth = (date: string) => {
    setSelectedDate(date);
    setActiveTab("decision");
  };

  return (
    <div className="min-h-screen bg-bone text-charcoal flex flex-col font-sans">
      {/* Header */}
      <Header
        dates={dates}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        deliveryDate={decisionData?.deliveryDate}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-pastel-red border border-borderline text-pastel-redText text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangleIcon className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => {
                setError(null);
                window.location.reload();
              }}
              className="font-mono underline font-medium hover:text-charcoal"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && !decisionData ? (
          <div className="h-96 flex flex-col items-center justify-center text-center">
            <RefreshCwIcon className="w-6 h-6 animate-spin text-muted mb-3" />
            <span className="text-xs font-mono text-muted">
              Loading GridBricks Energy Analytics Engine...
            </span>
          </div>
        ) : (
          <>
            {activeTab === "overview" && (
              <OverviewView
                onGoToDecision={(date) => {
                  if (date) setSelectedDate(date);
                  setActiveTab("decision");
                }}
                onGoToAnalysis={() => setActiveTab("analysis")}
                onOpenMethodology={() => setIsMethodologyOpen(true)}
              />
            )}

            {activeTab === "decision" && decisionData && (
              <div className="space-y-6">
                {/* 1. Executive Quantitative KPIs */}
                <KpiGrid
                  kpis={decisionData.kpis}
                  matchedCount={decisionData.matchedPeriodsCount}
                  deliveryDate={decisionData.deliveryDate}
                />

                {/* 2. Forecast vs Actual Synchronized Chart */}
                <GenerationChart
                  periods={decisionData.settlementPeriods}
                  deliveryDate={decisionData.deliveryDate}
                />

                {/* 3. Detailed Settlement Periods Table */}
                <SettlementLedger
                  periods={decisionData.settlementPeriods}
                  deliveryDate={decisionData.deliveryDate}
                  decisionDate={decisionData.decisionDate}
                />
              </div>
            )}

            {activeTab === "analysis" && monthData && (
              <MonthAnalysisView
                data={monthData}
                onSelectDay={handleSelectDayFromMonth}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-borderline bg-surface py-5 mt-12 text-center text-xs text-muted font-mono">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>
            GridBricks v1.0.0 · UK Day-Ahead Renewable Procurement Decision Portal
          </span>
          <span>
            Data Source: Elexon BMRS (FUELHH &amp; WINDFOR Streams) · 09:50 GMT Cutoff Enforced
          </span>
        </div>
      </footer>

      {/* Trading Methodology Drawer */}
      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />
    </div>
  );
}

export default App;
