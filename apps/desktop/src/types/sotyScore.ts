/**
 * SOTY Score types.
 * These are frontend-only types for the v0.3.0 direction.
 * The Rust scoring engine and serde structs arrive in PR 3.
 */

export type SotyState =
  | "SOTY_READY"
  | "SOTY_WARN"
  | "SOTY_EXPOSED"
  | "SOTY_DIRTY"
  | "SOTY_BLOCKED";

export const SOTY_STATES: readonly SotyState[] = [
  "SOTY_READY",
  "SOTY_WARN",
  "SOTY_EXPOSED",
  "SOTY_DIRTY",
  "SOTY_BLOCKED",
];

export type ScoreCategory =
  | "route"
  | "host"
  | "scope"
  | "intel"
  | "evidence"
  | "overall";

export type ScoreSeverity = "info" | "low" | "medium" | "high" | "critical";

export type ActionType =
  | "manual"
  | "open_page"
  | "run_check"
  | "enable_setting"
  | "configure_profile"
  | "review_warning";

export interface RecommendedFix {
  id: string;
  title: string;
  description: string;
  action_type: ActionType;
  /** True only for non-destructive, non-system-mutating actions. */
  safe_to_autorun: boolean;
  requires_confirmation: boolean;
}

/** One explainable deduction subtracted from a sub-score. */
export interface ScoreDeduction {
  id: string;
  category: ScoreCategory;
  severity: ScoreSeverity;
  points_lost: number;
  reason: string;
  recommended_fix: RecommendedFix;
  /** The signal/check ID that triggered this deduction, e.g. "public_ip". */
  related_signal: string;
  /** Blocking deductions prevent SOTY_READY regardless of the numeric score. */
  blocking: boolean;
}

/** Full readiness score for one operator session. */
export interface SotyScore {
  route_score: number;
  host_score: number;
  scope_score: number;
  intel_score: number;
  evidence_score: number;
  overall_score: number;
  state: SotyState;
  deductions: ScoreDeduction[];
  generated_at: string;
  profile_name: string | null;
  route_pack_id: string | null;
}
