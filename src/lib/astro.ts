export type AstroStatus = "NOT_STARTED" | "AWAITING_CONSENT" | "COLLECTING" | "CALCULATING" | "INTERPRETING" | "READY" | "PARTIAL" | "FAILED" | "DECLINED" | "WITHDRAWN";
export type AstroState =
  | { available: false }
  | {
      available: true;
      configured: boolean;
      eligible: boolean;
      conversationId: string | null;
      status: AstroStatus;
      failure: string | null;
      myState: "INTERESTED" | "CONSENTED" | "DECLINED" | "WITHDRAWN" | null;
      theirState: "INTERESTED" | "CONSENTED" | "NOT_PARTICIPATING" | null;
      hasSavedBirth: boolean;
      hasReport: boolean;
      canRetry: boolean;
    };
export type ChartSummary = { name: string; sun: string | null; moon: string | null; nakshatra: string | null; pada: number | null; lagna: string | null; accuracy: "EXACT" | "APPROXIMATE" | "UNKNOWN"; unavailable: { field: string; reason: string }[] };
export type Interpretation = { overview: string; chartInsights: { personA: string; personB: string }; emotionalConnection: string; communication: string; attraction: string; harmony: string[]; differences: string[]; reflectionPrompts: string[]; narrative: string; starters: string[] };
export type AstroReport = {
  status: AstroStatus;
  failure: string | null;
  conversationId: string | null;
  version: string;
  me: ChartSummary;
  them: ChartSummary;
  guna: { method: string; total: number; max: number; kootas: { key: string; label: string; meaning: string; score: number; max: number }[] } | null;
  gunaUnavailableReason: string | null;
  themes: string[];
  interpretation: Interpretation | null;
  interpretationMine: "personA" | "personB";
  model: string | null;
};
