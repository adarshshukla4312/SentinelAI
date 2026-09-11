export type TierStatus = "pass" | "fail" | "review" | "unavailable";
export type Decision = "CLEAR" | "REVIEW" | "FLAG" | "HARD_REJECT";

export interface TierResult {
  tier: number;
  title: string;
  status: TierStatus;
  score: number | null;
  summary: string;
  details: Record<string, unknown>;
}

export interface ScreeningResponse {
  screening_id: string;
  created_at: string;
  decision: Decision;
  risk_score: number;
  reasons: string[];
  tiers: TierResult[];
  audit: {
    sequence: number;
    receipt_hash: string;
    previous_hash: string;
    chain_hash: string;
    ledger_verified: boolean;
    polygon: {
      status: string;
      network: string;
      transaction_hash: string | null;
    };
  };
  artifacts: {
    heatmap_url?: string;
  };
}
