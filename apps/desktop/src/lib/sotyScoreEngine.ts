/**
 * SotyRoute deterministic scoring engine.
 *
 * computeSotyScore() accepts a SotyScoreInput and returns a fully-explained
 * SotyScore. The function is pure: no I/O, no side-effects, deterministic
 * for the same input (timestamp aside).
 *
 * No external API calls. No AI inference. No system mutations.
 */
import type { SotyScore } from "../types/sotyScore";
import {
  type SotyScoreInput,
  routeRules,
  hostRules,
  scopeRules,
  intelRules,
  evidenceRules,
  applyDeductions,
} from "./sotyScoreRules";
import { weightedOverall, determineSotyState } from "./sotyScoreState";

export type { SotyScoreInput } from "./sotyScoreRules";
export { applyDeductions } from "./sotyScoreRules";

// ─── Options ─────────────────────────────────────────────────────────────────

interface ComputeOptions {
  /** Profile name to embed in the score record. */
  profileName?: string | null;
  /**
   * ISO-8601 timestamp for generated_at.
   * Defaults to now. Provide a fixed value in tests to make output fully deterministic.
   */
  timestamp?: string;
}

// ─── Engine ───────────────────────────────────────────────────────────────────

/**
 * Compute a SOTY Score from a set of input signals.
 *
 * The returned SotyScore contains:
 *  - Five explainable sub-scores (0–100)
 *  - An overall score (weighted average, 0–100)
 *  - A SotyState
 *  - Every applicable ScoreDeduction with reason and recommended_fix
 */
export function computeSotyScore(
  input: SotyScoreInput,
  options: ComputeOptions = {}
): SotyScore {
  // 1. Collect deductions per category
  const routeDeductions = routeRules(input);
  const hostDeductions = hostRules(input);
  const scopeDeductions = scopeRules(input);
  const intelDeductions = intelRules(input);
  const evidenceDeductions = evidenceRules(input);

  // 2. Apply deductions to sub-scores (start at 100, clamp 0–100)
  const route_score = applyDeductions(100, routeDeductions);
  const host_score = applyDeductions(100, hostDeductions);
  const scope_score = applyDeductions(100, scopeDeductions);
  const intel_score = applyDeductions(100, intelDeductions);
  const evidence_score = applyDeductions(100, evidenceDeductions);

  // 3. Weighted overall
  const overall_score = weightedOverall({
    route_score,
    host_score,
    scope_score,
    intel_score,
    evidence_score,
  });

  // 4. Flatten all deductions for state determination
  const allDeductions = [
    ...routeDeductions,
    ...hostDeductions,
    ...scopeDeductions,
    ...intelDeductions,
    ...evidenceDeductions,
  ];

  // 5. Determine state
  const state = determineSotyState(
    { route_score, host_score, scope_score, intel_score, evidence_score, overall_score },
    allDeductions
  );

  return {
    route_score,
    host_score,
    scope_score,
    intel_score,
    evidence_score,
    overall_score,
    state,
    deductions: allDeductions,
    generated_at: options.timestamp ?? new Date().toISOString(),
    profile_name: options.profileName ?? null,
    route_pack_id: input.route_pack.route_pack_id,
  };
}
