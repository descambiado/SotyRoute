import type { SotyScore } from "../types/sotyScore";

/**
 * Returns an unassessed score with all sub-scores at 0 and state SOTY_BLOCKED.
 * Used as the initial value before any checks run — fail-closed by design.
 */
export function createEmptySotyScore(
  profileName: string | null = null,
  routePackId: string | null = null
): SotyScore {
  return {
    route_score: 0,
    host_score: 0,
    scope_score: 0,
    intel_score: 0,
    evidence_score: 0,
    overall_score: 0,
    state: "SOTY_BLOCKED",
    deductions: [],
    generated_at: new Date().toISOString(),
    profile_name: profileName,
    route_pack_id: routePackId,
  };
}

export const SCORE_RANGE = { min: 0, max: 100 } as const;

/** Sub-score field names, in display order. */
export const SUB_SCORE_FIELDS = [
  "route_score",
  "host_score",
  "scope_score",
  "intel_score",
  "evidence_score",
] as const satisfies ReadonlyArray<keyof SotyScore>;
