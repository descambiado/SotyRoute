/**
 * Route Pack scoring helpers — PR 6.
 *
 * Thin wrappers around ROUTE_PACK_CONTEXTS that provide score-related lookups
 * used by the dashboard when a route pack is selected.
 *
 * Safety: pure lookups, no I/O, no mutations.
 */
import {
  ROUTE_PACK_CONTEXTS,
  type ScoreFocus,
  type FocusLevel,
} from "./sotyRoutePackContext";
import type { DemoPresetKey } from "./sotyDemoInput";

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_PRESET: DemoPresetKey = "warn";

const DEFAULT_FOCUS: ScoreFocus = {
  route_focus: "medium",
  host_focus: "medium",
  scope_focus: "medium",
  intel_focus: "medium",
  evidence_focus: "medium",
};

// ─── Public helpers ───────────────────────────────────────────────────────────

/**
 * Returns the demo preset key that best represents this pack's expected
 * SOTY context (e.g. "dirty" for dirty_host_check, "blocked" for lab_route).
 * Falls back to "warn" for unknown pack ids.
 */
export function getPackDemoPreset(packId: string): DemoPresetKey {
  return ROUTE_PACK_CONTEXTS[packId]?.demo_preset ?? DEFAULT_PRESET;
}

/**
 * Returns the ScoreFocus for a pack, describing which sub-scores this
 * pack's workflow exercises most (route/host/scope/intel/evidence).
 * Falls back to all-medium for unknown pack ids.
 */
export function getPackScoreFocus(packId: string): ScoreFocus {
  return ROUTE_PACK_CONTEXTS[packId]?.score_focus ?? { ...DEFAULT_FOCUS };
}

/**
 * Returns the FocusLevel for one specific sub-score category within a pack.
 * Falls back to "medium" for unknown pack ids or categories.
 */
export function focusLevelForCategory(
  packId: string,
  category: keyof ScoreFocus,
): FocusLevel {
  return ROUTE_PACK_CONTEXTS[packId]?.score_focus[category] ?? "medium";
}
