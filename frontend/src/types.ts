export interface CallSummary {
  id: string;
  prospect_name: string;
  company: string;
  role?: string | null;
  started_at: string;
  ended_at?: string | null;
  outcome?: string | null;
  summary?: string | null;
  current_stage: number;
  stage_reached: number;
}

export interface StageRecord {
  stage: number;
  tap_choices: string[];
  prospect_words: string;
}

export interface CallDetail extends CallSummary {
  stages: StageRecord[];
}

export interface CloseCheckResponse {
  suggested_outcome: string;
  summary: string;
  mismatch: boolean;
  mismatch_note: string;
}
