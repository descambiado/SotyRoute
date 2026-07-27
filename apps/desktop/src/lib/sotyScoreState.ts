/**
 * SOTY state determination.
 *
 * determineSotyState() maps computed sub-scores and deductions to a SotyState.
 * weightedOverall() computes the overall score from five sub-scores.
 *
 * Both functions are pure and side-effect free.
 */
import type { SotyState, ScoreDeduction } from "../types/sotyScore";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SubScores {
  route_score: number;
  host_score: number;
  scope_score: number;
  intel_score: number;
  evidence_score: number;
  overall_score: number;
}

// ─── Weights ─────────────────────────────────────────────────────────────────

export const SCORE_WEIGHTS = {
  route: 0.30,
  host: 0.20,
  scope: 0.25,
  intel: 0.10,
  evidence: 0.15,
} as const;

// ─── Functions ───────────────────────────────────────────────────────────────

/**
 * Compute the overall score as a weighted average of the five sub-scores.
 * Result is rounded and clamped to [0, 100].
 *
 * Weights: route 30% · host 20% · scope 25% · intel 10% · evidence 15%
 */
export function weightedOverall(
  scores: Omit<SubScores, "overall_score">
): number {
  const raw =
    scores.route_score * SCORE_WEIGHTS.route +
    scores.host_score * SCORE_WEIGHTS.host +
    scores.scope_score * SCORE_WEIGHTS.scope +
    scores.intel_score * SCORE_WEIGHTS.intel +
    scores.evidence_score * SCORE_WEIGHTS.evidence;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

/**
 * Map a set of sub-scores and all deductions to a SotyState.
 *
 * Precedence (highest to lowest):
 *   1. Any blocking deduction → SOTY_BLOCKED (regardless of score)
 *   2. overall ≥ 90 AND no high/critical severity → SOTY_READY
 *   3. route_score < 60 → SOTY_EXPOSED
 *   4. host_score < 60 → SOTY_DIRTY
 *   5. overall ≥ 70 → SOTY_WARN
 *   6. default → SOTY_EXPOSED
 */
export function determineSotyState(
  scores: SubScores,
  deductions: ScoreDeduction[]
): SotyState {
  // 1. Hard block: any blocking deduction wins
  if (deductions.some((d) => d.blocking)) {
    return "SOTY_BLOCKED";
  }

  // 2. Ready: high score AND no high/critical issues
  const hasHighOrCritical = deductions.some(
    (d) => d.severity === "high" || d.severity === "critical"
  );
  if (scores.overall_score >= 90 && !hasHighOrCritical) {
    return "SOTY_READY";
  }

  // 3. Route exposure
  if (scores.route_score < 60) {
    return "SOTY_EXPOSED";
  }

  // 4. Host posture
  if (scores.host_score < 60) {
    return "SOTY_DIRTY";
  }

  // 5. Generally operational but with issues
  if (scores.overall_score >= 70) {
    return "SOTY_WARN";
  }

  // 6. Default: exposure
  return "SOTY_EXPOSED";
}
