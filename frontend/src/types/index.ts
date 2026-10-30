export interface SettlementPeriod {
  settlementPeriod: number;
  startTime: string;
  timeLabel: string;
  forecastMW: number | null;
  actualMW: number | null;
  errorMW: number | null;
  percentageError: number | null;
  isInterpolated: boolean;
  isHourlyNode: boolean;
  forecastPublishTime: string | null;
}

export interface KPIs {
  count: number;
  mae: number;
  rmse: number;
  bias: number;
  wape: number;
  totalForecastMWh: number;
  totalActualMWh: number;
  netVolumeDeviationMWh: number;
  biasInterpretation: string;
}

export interface DecisionResponse {
  decisionDate: string;
  deliveryDate: string;
  gateClosureCutoff: string;
  periodsCount: number;
  matchedPeriodsCount: number;
  matchedHourlyCount: number;
  kpis: KPIs;
  hourlyKpis: KPIs;
  settlementPeriods: SettlementPeriod[];
}

export interface DailySummary {
  decisionDate: string;
  deliveryDate: string;
  mae: number;
  rmse: number;
  bias: number;
  wape: number;
  matchedCount: number;
  totalForecastMWh: number;
  totalActualMWh: number;
  biasInterpretation: string;
}

export interface MonthAnalysisResponse {
  period: { from: string; to: string };
  gateClosureTime: string;
  totalDays: number;
  monthlyKPIs: KPIs;
  bestForecastDay: DailySummary | null;
  worstForecastDay: DailySummary | null;
  dailyBreakdown: DailySummary[];
}

