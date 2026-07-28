/**
 * sotyIntelReal — maps real, local dashboard interaction state into the
 * Intel sub-score input (PR 20).
 *
 * Unlike Host/Route Guard, no system signal is involved here — Route Pack
 * selection and OSINT Navigator filters are already real, in-memory UI
 * state on SotyDashboard. This module's only job is deciding how that
 * state should override the demo baseline.
 *
 * Safety: pure function, no I/O, no side-effects.
 */
import type { SotyScoreInput } from "./sotyScoreRules";
import type { OsintFilterState } from "../types/osintNavigator";

export interface IntelRealState {
  /** True once the operator has interacted with Route Pack selection at least once this session. */
  routePackTouched: boolean;
  selectedPackId: string | null;
  /** Null until the OSINT Navigator has mounted and reported filter state at least once. */
  osintFilters: OsintFilterState | null;
}

export function mapIntelToScoreInput(
  demoIntel: SotyScoreInput["intel"],
  state: IntelRealState
): SotyScoreInput["intel"] {
  return {
    route_pack_selected: state.routePackTouched
      ? state.selectedPackId !== null
      : demoIntel.route_pack_selected,
    osint_categories_selected: state.osintFilters
      ? state.osintFilters.categories.length > 0
      : demoIntel.osint_categories_selected,
    high_risk_resource_enabled: state.osintFilters
      ? state.osintFilters.risks.includes("high")
      : demoIntel.high_risk_resource_enabled,
    // Blocked-risk resources render a static "Blocked by policy" badge with
    // no click handler (see OsintResourceCard.tsx) — there is no code path
    // by which one can ever be requested, so this is real, not a guess.
    blocked_resource_requested: false,
    // Whether the operator's own browser/OSINT tools log queries externally
    // is outside anything SotyRoute can observe — stays demo/manual until a
    // future PR adds an explicit operator attestation control.
    query_logging_disabled: demoIntel.query_logging_disabled,
  };
}
