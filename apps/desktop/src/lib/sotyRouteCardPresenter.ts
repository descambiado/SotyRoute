/**
 * Pure presenter helpers for Route Card display.
 *
 * All functions are pure (no I/O, no side-effects).
 * They translate domain types into UI-layer strings and summaries
 * so component files stay thin.
 *
 * Safety: read-only, no mutations.
 */
import type { MissionType, RouteCard } from "../types/routeCard";
import type { Mode } from "./types";
import type { EvidenceLevel } from "../types/risk";
import { MISSION_CATALOG } from "./sotyMissionCatalog";

// ─── Mission labels ───────────────────────────────────────────────────────────

/** Human-readable title for a MissionType (from the catalog). */
export function missionTypeToLabel(missionType: MissionType): string {
  return MISSION_CATALOG[missionType].title;
}

/**
 * Full selector description for a MissionType.
 * Shown below the mission grid when a mission is highlighted.
 */
export function missionTypeToDescription(missionType: MissionType): string {
  return MISSION_CATALOG[missionType].description;
}

/** Recommended Route Pack ID for a mission (for UI cross-reference only). */
export function recommendedRoutePackId(missionType: MissionType): string {
  return MISSION_CATALOG[missionType].recommended_route_pack_id;
}

// ─── Mode labels ──────────────────────────────────────────────────────────────

/** Human-readable label for a routing Mode value. */
export function modeToLabel(mode: Mode): string {
  switch (mode) {
    case "observe":   return "Observe (passive)";
    case "tor":       return "Tor";
    case "wireguard": return "WireGuard";
    case "socks5":    return "SOCKS5 proxy";
    case "lab":       return "Lab";
  }
}

// ─── Evidence level hints ─────────────────────────────────────────────────────

/** One-line operator hint for an EvidenceLevel. */
export function evidenceLevelToHint(level: EvidenceLevel): string {
  switch (level) {
    case "off":      return "Evidence disabled — lookups will not be logged.";
    case "minimal":  return "Minimal evidence — session metadata only.";
    case "standard": return "Standard evidence — session metadata, checks, and summaries.";
    case "full":     return "Full evidence — complete session record including all query targets.";
  }
}

// ─── BOFA status helpers ──────────────────────────────────────────────────────

/**
 * Returns true if the card has any disallowed BOFA modules
 * (i.e. the mission imposes BOFA restrictions).
 */
export function routeCardHasBofaRestrictions(card: RouteCard): boolean {
  return card.bofa_disallowed_modules.length > 0;
}

/**
 * Returns true when BOFA is fully blocked for this mission:
 * no allowed modules and at least one disallowed module.
 */
export function routeCardBofaIsBlocked(card: RouteCard): boolean {
  return (
    card.bofa_allowed_modules.length === 0 &&
    card.bofa_disallowed_modules.length > 0
  );
}

/**
 * Short human-readable summary of BOFA status for a Route Card.
 * Used in the card panel header row.
 */
export function routeCardBofaSummary(card: RouteCard): string {
  if (routeCardBofaIsBlocked(card)) {
    return "BOFA blocked for this mission.";
  }
  const allowed = card.bofa_allowed_modules.length;
  const blocked = card.bofa_disallowed_modules.length;
  if (allowed > 0 && blocked > 0) {
    return `${allowed} module type${allowed !== 1 ? "s" : ""} allowed · ${blocked} blocked.`;
  }
  if (allowed > 0) {
    return `${allowed} module type${allowed !== 1 ? "s" : ""} allowed.`;
  }
  return "No BOFA modules configured for this mission.";
}
