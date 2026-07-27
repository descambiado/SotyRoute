/**
 * Route Pack presenter helpers — PR 6.
 *
 * Pure UI-facing utilities: labels, status variants, focus bar percentages,
 * BOFA mode labels, and the pack mismatch warning.
 *
 * Safety: pure functions, no I/O, no mutations. All copy follows the PR 6
 *         safety constraint — no "anonymize", "bypass", "undetectable", etc.
 */
import type { BofaIntegrationMode } from "../types/routePack";
import type { RoutePack } from "../types/routePack";
import type { RouteCard } from "../types/routeCard";
import { type FocusLevel, type ScoreFocus } from "./sotyRoutePackContext";
import { MISSION_CATALOG } from "./sotyMissionCatalog";

// ─── Types ────────────────────────────────────────────────────────────────────

export type StatusVariant = "ok" | "warn" | "danger" | "info" | "idle";

/** Ordered list of ScoreFocus keys for rendering focus bars in a consistent order. */
export const FOCUS_CATEGORIES: readonly (keyof ScoreFocus)[] = [
  "route_focus",
  "host_focus",
  "scope_focus",
  "intel_focus",
  "evidence_focus",
] as const;

// ─── Focus level helpers ──────────────────────────────────────────────────────

/** Maps a FocusLevel to a StatusBadge/CSS variant. */
export function focusLevelToVariant(level: FocusLevel): StatusVariant {
  if (level === "high") return "ok";
  if (level === "medium") return "warn";
  return "idle";
}

/** Human-readable label for a focus level. */
export function focusLevelToLabel(level: FocusLevel): string {
  if (level === "high") return "High";
  if (level === "medium") return "Medium";
  return "Low";
}

/**
 * Percentage width (0–100) for a focus bar fill element.
 * low → 22%, medium → 55%, high → 88% (leaves visible gap at max).
 */
export function focusLevelToPercent(level: FocusLevel): number {
  if (level === "high") return 88;
  if (level === "medium") return 55;
  return 22;
}

/** CSS class suffix matching the focus level (used as .focus-bar-fill.{class}). */
export function focusLevelToClass(level: FocusLevel): string {
  return level; // "low" | "medium" | "high" — matches CSS class names directly
}

// ─── ScoreFocus category helpers ─────────────────────────────────────────────

/** Human-readable label for a ScoreFocus category key. */
export function focusCategoryToLabel(category: keyof ScoreFocus): string {
  const MAP: Record<keyof ScoreFocus, string> = {
    route_focus: "Route",
    host_focus: "Host",
    scope_focus: "Scope",
    intel_focus: "Intel",
    evidence_focus: "Evidence",
  };
  return MAP[category];
}

// ─── BOFA mode helpers ────────────────────────────────────────────────────────

/** Operator-facing label for a BOFA integration mode. */
export function bofaModeToLabel(mode: BofaIntegrationMode): string {
  if (mode === "enabled") return "BOFA Enabled (gated)";
  if (mode === "gated") return "BOFA Gated";
  return "BOFA Disabled";
}

/** CSS tag variant for a BOFA mode badge. */
export function bofaModeToTagClass(mode: BofaIntegrationMode): string {
  if (mode === "enabled") return "allowed";
  if (mode === "gated") return "resource";
  return ""; // neutral / blocked appearance
}

// ─── Pack mismatch warning ────────────────────────────────────────────────────

/**
 * Returns a soft mismatch warning when the built Route Card recommends a
 * different route pack than the one currently selected in the dashboard.
 *
 * Example: selecting "OSINT Route" then building a "Connect to Lab" card
 * (which recommends "Lab Route") produces:
 *   'This mission usually works best with "Lab Route", but you are previewing "OSINT Route".'
 *
 * Returns null when packs match, or when the mission has no recommended pack.
 */
export function packMismatchWarning(
  card: RouteCard,
  selectedPackId: string,
  allPacks: readonly RoutePack[],
): string | null {
  const recommended =
    MISSION_CATALOG[card.mission_type]?.recommended_route_pack_id ?? null;
  if (!recommended || recommended === selectedPackId) return null;

  const recommendedPack = allPacks.find((p) => p.id === recommended);
  const selectedPack = allPacks.find((p) => p.id === selectedPackId);

  const recommendedName = recommendedPack?.name ?? recommended;
  const selectedName = selectedPack?.name ?? selectedPackId;

  return `This mission usually works best with "${recommendedName}", but you are previewing "${selectedName}".`;
}
