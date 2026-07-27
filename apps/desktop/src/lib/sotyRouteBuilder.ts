/**
 * Deterministic Soty Agent — Mission-to-Route Card builder.
 *
 * buildRouteCard() accepts a MissionType and converts it into a fully-populated
 * RouteCard using the static MISSION_CATALOG. The function is pure: no I/O, no
 * side-effects, deterministic for fixed options.timestamp.
 *
 * Safety: no external API calls, no AI inference, no system mutations.
 *         For authorized labs, owned assets, and written-scope engagements only.
 */
import type { MissionType, RouteCard } from "../types/routeCard";
import { MISSION_CATALOG } from "./sotyMissionCatalog";

// ─── Options ─────────────────────────────────────────────────────────────────

export interface BuildRouteCardOptions {
  /**
   * ISO-8601 timestamp for created_at and ID generation.
   * Defaults to now. Provide a fixed value in tests for full determinism.
   */
  timestamp?: string;
  /** Optional profile name — not embedded in the RouteCard but useful for logging. */
  profileName?: string | null;
}

// ─── ID generation ────────────────────────────────────────────────────────────

/**
 * Generates a deterministic, human-readable Route Card ID.
 * Format: rc_<mission_type>_<compact_timestamp>
 * e.g.  "rc_investigate_domain_20260101T000000"
 */
function generateRouteCardId(missionType: MissionType, timestamp: string): string {
  // Strip punctuation from ISO timestamp, keep date+time portion (15 chars)
  const compact = timestamp.replace(/[^0-9TZ]/g, "").slice(0, 15);
  return `rc_${missionType}_${compact}`;
}

// ─── Builder ──────────────────────────────────────────────────────────────────

/**
 * Build a Route Card from a mission type.
 *
 * Returns a RouteCard populated from the static MISSION_CATALOG.
 * All array fields are shallow-copied so the returned card is independent
 * of the catalog definition.
 *
 * The returned card is a recommendation only — no system action is taken.
 * All outputs require explicit operator confirmation before use.
 */
export function buildRouteCard(
  missionType: MissionType,
  options: BuildRouteCardOptions = {}
): RouteCard {
  const def = MISSION_CATALOG[missionType];
  const ts = options.timestamp ?? new Date().toISOString();

  return {
    id: generateRouteCardId(missionType, ts),
    mission_type: def.mission_type,
    title: def.title,
    summary: def.summary,
    recommended_mode: def.recommended_mode,
    required_checks: [...def.required_checks],
    recommended_resources: [...def.recommended_resources],
    risk_warnings: [...def.risk_warnings],
    scope_requirements: [...def.scope_requirements],
    evidence_settings: def.evidence_settings,
    bofa_allowed_modules: [...def.bofa_allowed_modules],
    bofa_disallowed_modules: [...def.bofa_disallowed_modules],
    next_safe_actions: [...def.next_safe_actions],
    created_at: ts,
  };
}
