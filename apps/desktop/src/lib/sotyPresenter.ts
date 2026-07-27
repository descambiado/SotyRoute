/**
 * Pure presenter helpers for SOTY Score display.
 *
 * All functions are pure (no I/O, no side-effects).
 * They translate domain types into UI-layer strings and variant tokens
 * so component files stay thin.
 *
 * Safety: read-only, no mutations.
 */
import type {
  SotyState,
  ScoreDeduction,
  ScoreSeverity,
  RecommendedFix,
} from "../types/sotyScore";

// ─── Variant token (matches StatusBadge and .hero / .status-badge CSS classes) ─

export type StatusVariant = "ok" | "warn" | "danger" | "info" | "idle";

/**
 * Maps a SotyState to the CSS StatusBadge variant.
 *   SOTY_READY   → ok     (green)
 *   SOTY_WARN    → warn   (yellow)
 *   SOTY_DIRTY   → warn   (yellow — host posture, not blocking)
 *   SOTY_EXPOSED → danger (red)
 *   SOTY_BLOCKED → danger (red)
 */
export function sotyStateToVariant(state: SotyState): StatusVariant {
  switch (state) {
    case "SOTY_READY":
      return "ok";
    case "SOTY_WARN":
      return "warn";
    case "SOTY_DIRTY":
      return "warn";
    case "SOTY_EXPOSED":
      return "danger";
    case "SOTY_BLOCKED":
      return "danger";
  }
}

/**
 * Human-readable label for a SotyState (used inside badges and headings).
 */
export function sotyStateToLabel(state: SotyState): string {
  return state; // keep the code — operators learn it; it's also the state token
}

/**
 * One-line operator-facing copy for each SotyState.
 * These appear directly below the big score number on the dashboard.
 */
export function sotyStateToCopy(state: SotyState): string {
  switch (state) {
    case "SOTY_READY":
      return "Ready to operate. Your route, scope, host and evidence posture look clean.";
    case "SOTY_WARN":
      return "Almost ready. Review the warnings before operating.";
    case "SOTY_EXPOSED":
      return "Route exposure detected. Fix route, DNS or tunnel posture before operating.";
    case "SOTY_DIRTY":
      return "Host posture warning. Review local system signals before operating.";
    case "SOTY_BLOCKED":
      return "Blocked. Scope or policy violations must be fixed before operating.";
  }
}

// ─── Score → variant ──────────────────────────────────────────────────────────

/**
 * Maps a numeric sub-score (0–100) to a CSS variant.
 * Thresholds mirror the SOTY_EXPOSED / SOTY_DIRTY trigger at < 60.
 *
 *   ≥ 80 → ok
 *   60–79 → warn
 *   < 60 → danger  (includes 0 = "fully deducted")
 */
export function scoreToVariant(score: number): StatusVariant {
  if (score >= 80) return "ok";
  if (score >= 60) return "warn";
  return "danger";
}

// ─── Severity → variant ───────────────────────────────────────────────────────

/**
 * Maps a ScoreSeverity to a CSS variant for severity badges.
 */
export function severityToVariant(severity: ScoreSeverity): StatusVariant {
  switch (severity) {
    case "info":
      return "info";
    case "low":
      return "idle";
    case "medium":
      return "warn";
    case "high":
      return "danger";
    case "critical":
      return "danger";
  }
}

// ─── Sub-score hint text ──────────────────────────────────────────────────────

/**
 * Short human-readable hint for a sub-score value shown below the number
 * in the sub-score grid. Thresholds aligned with scoreToVariant.
 *
 *   = 0        → "Not assessed"
 *   ≥ 80       → "Clean"
 *   60–79      → "Minor issues"
 *   < 60 (> 0) → "Poor posture"
 */
export function subscoreHint(score: number): string {
  if (score === 0) return "Not assessed";
  if (score >= 80) return "Clean";
  if (score >= 60) return "Minor issues";
  return "Poor posture";
}

// ─── Fix deduplication ────────────────────────────────────────────────────────

/**
 * Returns a de-duplicated list of RecommendedFix objects from a deduction list,
 * preserving the order of first occurrence. The same fix can appear in multiple
 * deductions (e.g. "enable your VPN" is recommended by both tunnel-missing and
 * IPv6-leak rules), so we surface it once.
 */
export function dedupFixes(deductions: ScoreDeduction[]): RecommendedFix[] {
  const seen = new Set<string>();
  const result: RecommendedFix[] = [];
  for (const d of deductions) {
    if (!seen.has(d.recommended_fix.id)) {
      seen.add(d.recommended_fix.id);
      result.push(d.recommended_fix);
    }
  }
  return result;
}
