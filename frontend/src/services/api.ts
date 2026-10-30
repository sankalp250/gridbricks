import type { DecisionResponse, MonthAnalysisResponse } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export async function fetchAvailableDates(): Promise<string[]> {
  const resp = await fetch(`${API_BASE}/api/dates`);
  if (!resp.ok) {
    throw new Error(`Failed to fetch dates: ${resp.statusText}`);
  }
  const data = await resp.json();
  return data.dates;
}

export async function fetchDecisionAnalysis(
  date: string,
  cutoff?: string
): Promise<DecisionResponse> {
  const params = new URLSearchParams({ date });
  if (cutoff) params.append("cutoff", cutoff);

  const resp = await fetch(`${API_BASE}/api/decision?${params.toString()}`);
  if (!resp.ok) {
    throw new Error(`Failed to load decision analysis for ${date}: ${resp.statusText}`);
  }
  return resp.json();
}

export async function fetchMonthAnalysis(
  fromDate: string = "2026-01-01",
  toDate: string = "2026-01-31",
  cutoff?: string
): Promise<MonthAnalysisResponse> {
  const params = new URLSearchParams({ from: fromDate, to: toDate });
  if (cutoff) params.append("cutoff", cutoff);

  const resp = await fetch(`${API_BASE}/api/analysis?${params.toString()}`);
  if (!resp.ok) {
    throw new Error(`Failed to load month analysis: ${resp.statusText}`);
  }
  return resp.json();
}

export async function triggerSync(force: boolean = false): Promise<{ actualsCount: number; forecastsCount: number }> {
  const resp = await fetch(`${API_BASE}/api/sync?force=${force}`, { method: "POST" });
  if (!resp.ok) {
    throw new Error(`Failed to sync data: ${resp.statusText}`);
  }
  return resp.json();
}
