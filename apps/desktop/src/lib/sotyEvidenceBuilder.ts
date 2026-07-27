/**
 * Evidence snapshot builder for the SOTY Dashboard — PR 9.
 *
 * Assembles a SotyEvidenceSnapshot from current dashboard state.
 *
 * Safety:
 * - No query content, credentials, tokens, cookies, or external page content logged.
 * - All redaction guarantee fields are structurally false at the type level.
 * - No external API calls. No system mutations. No filesystem writes (PR 9 is UI-only).
 * - Filesystem persistence is planned for a later PR.
 */
import type { SotyScore } from "../types/sotyScore";
import type { RoutePack } from "../types/routePack";
import type { RouteCard } from "../types/routeCard";
import type { HostGuardSummary } from "../types/hostGuard";
import type {
  SotyEvidenceSnapshot,
  SotyEvidenceScoreSummary,
  SotyEvidenceRoutePackSummary,
  SotyEvidenceRouteCardSummary,
  SotyEvidenceHostGuardSummary,
  SotyEvidenceOsintSummary,
  SotyEvidenceRedactionGuarantees,
} from "../types/sotyEvidence";
import { OSINT_CATALOG } from "./osintCatalog";

// ─── Structural guarantee — never reassigned, always false ────────────────────

const REDACTION_GUARANTEES: SotyEvidenceRedactionGuarantees = {
  query_content_logged: false,
  external_page_content_logged: false,
  credentials_logged: false,
  tokens_logged: false,
  cookies_logged: false,
};

const LIMITATIONS = [
  "This evidence snapshot was generated in demo mode. No real system checks were performed.",
  "Host Guard checks are demo signals only. Real Tauri-based host checks are planned for a later PR.",
  "OSINT Navigator does not log query content. Opened-resource metadata is recorded by risk level only.",
  "Filesystem persistence is planned for a later PR. This snapshot exists in memory only.",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `soty-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildScoreSummary(score: SotyScore): SotyEvidenceScoreSummary {
  return {
    overall_score: score.overall_score,
    state: score.state,
    route_score: score.route_score,
    host_score: score.host_score,
    scope_score: score.scope_score,
    intel_score: score.intel_score,
    evidence_score: score.evidence_score,
    deductions_count: score.deductions.length,
    blocking_deductions_count: score.deductions.filter((d) => d.blocking).length,
  };
}

function buildRoutePackSummary(pack: RoutePack): SotyEvidenceRoutePackSummary {
  return {
    id: pack.id,
    name: pack.name,
    evidence_level: pack.evidence_level,
    bofa_integration_mode: pack.bofa_integration_mode,
    safety_warnings_count: pack.safety_warnings.length,
  };
}

function buildRouteCardSummary(card: RouteCard): SotyEvidenceRouteCardSummary {
  return {
    id: card.id,
    mission_type: card.mission_type,
    title: card.title,
    recommended_mode: card.recommended_mode,
    required_checks: card.required_checks,
    risk_warnings_count: card.risk_warnings.length,
    scope_requirements: card.scope_requirements,
    bofa_allowed_modules_count: card.bofa_allowed_modules.length,
    bofa_disallowed_modules_count: card.bofa_disallowed_modules.length,
    next_safe_actions: card.next_safe_actions,
  };
}

function buildHostGuardSummary(summary: HostGuardSummary): SotyEvidenceHostGuardSummary {
  return {
    status: summary.overall,
    checks_count: summary.checks.length,
    warning_count: summary.checks.filter((c) => c.status === "warn").length,
    fail_count: summary.checks.filter((c) => c.status === "fail").length,
    demo_mode: true,
    source: "demo",
  };
}

function buildOsintSummary(): SotyEvidenceOsintSummary {
  return {
    resources_total: OSINT_CATALOG.length,
    low_risk_count: OSINT_CATALOG.filter((r) => r.risk === "low").length,
    medium_risk_count: OSINT_CATALOG.filter((r) => r.risk === "medium").length,
    high_risk_count: OSINT_CATALOG.filter((r) => r.risk === "high").length,
    blocked_count: OSINT_CATALOG.filter((r) => r.risk === "blocked").length,
    opened_resources: [],
  };
}

function extractWarnings(score: SotyScore): string[] {
  return score.deductions
    .filter((d) => d.severity === "high" || d.severity === "critical")
    .map((d) => `[${d.category.toUpperCase()}] ${d.reason}`);
}

function extractFixes(score: SotyScore): string[] {
  const seen = new Set<string>();
  const fixes: string[] = [];
  for (const d of score.deductions) {
    const title = d.recommended_fix.title;
    if (!seen.has(title)) {
      seen.add(title);
      fixes.push(title);
    }
  }
  return fixes;
}

// ─── Public API ────────────────────────────────────────────────────────────────

export interface BuildEvidenceSnapshotOptions {
  operatorLabel?: string | null;
  /**
   * ISO-8601 timestamp for generated_at.
   * Defaults to now. Provide a fixed value in tests for deterministic output.
   */
  timestamp?: string;
  demoPreset?: string | null;
}

/**
 * Build a SotyEvidenceSnapshot from current SOTY Dashboard state.
 *
 * Pure function. No I/O. No external API calls. No filesystem writes.
 * No query content, credentials, tokens, cookies, or external page content
 * is captured in the returned snapshot.
 */
export function buildEvidenceSnapshot(
  score: SotyScore,
  routePack: RoutePack | null,
  routeCard: RouteCard | null,
  hostGuardSummary: HostGuardSummary | null,
  options: BuildEvidenceSnapshotOptions = {}
): SotyEvidenceSnapshot {
  return {
    id: generateId(),
    generated_at: options.timestamp ?? new Date().toISOString(),
    schema_version: "1",
    source: "soty_dashboard",
    operator_label: options.operatorLabel ?? null,
    demo_mode: true,
    demo_preset: options.demoPreset ?? null,
    soty_score: buildScoreSummary(score),
    route_pack: routePack ? buildRoutePackSummary(routePack) : null,
    route_card: routeCard ? buildRouteCardSummary(routeCard) : null,
    host_guard: hostGuardSummary ? buildHostGuardSummary(hostGuardSummary) : null,
    osint: buildOsintSummary(),
    warnings: extractWarnings(score),
    recommended_fixes: extractFixes(score),
    limitations: LIMITATIONS,
    redaction: REDACTION_GUARANTEES,
  };
}
