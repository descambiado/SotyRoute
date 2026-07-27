/**
 * BOFA Gate decision engine — PR 11.
 *
 * Deterministic, pure-function gate: accepts the current SOTY score and the
 * selected route pack and emits a BofaGateDecision. No external calls; no I/O;
 * no system mutations. Never launches BOFA. Never runs BOFA modules.
 */
import type { SotyScore } from "../types/sotyScore";
import type { RoutePack } from "../types/routePack";
import type {
  BofaGateDecision,
  BofaGateVerdict,
  BofaAllowedModule,
} from "../types/bofaGate";
import { BOFA_ALLOWED_MODULES, BOFA_DISALLOWED_MODULES } from "../types/bofaGate";

const GATED_MODULES: readonly BofaAllowedModule[] = [
  "evidence_review",
  "defensive_mapping",
  "detection_mapping",
  "ioc_enrichment_placeholder",
  "report_generation",
];

const ENABLED_MODULES: readonly BofaAllowedModule[] = BOFA_ALLOWED_MODULES.slice();

function allowedModulesFor(
  mode: RoutePack["bofa_integration_mode"] | null,
  verdict: BofaGateVerdict,
): readonly BofaAllowedModule[] {
  if (verdict === "blocked") return [];
  if (mode === "enabled") return ENABLED_MODULES;
  if (mode === "gated") return GATED_MODULES;
  return [];
}

function requiredPreflightChecks(verdict: BofaGateVerdict): string[] {
  switch (verdict) {
    case "allowed":
      return [
        "evidence_snapshot_present",
        "route_pack_selected",
        "host_guard_run",
      ];
    case "warning":
      return [
        "evidence_snapshot_present",
        "route_pack_selected",
        "host_guard_run",
        "warnings_reviewed",
        "scope_confirmed",
      ];
    case "blocked":
      return [
        "evidence_snapshot_present",
        "route_pack_selected",
        "host_guard_run",
        "warnings_reviewed",
        "scope_confirmed",
        "blocking_issues_remediated",
        "operator_confirmation",
      ];
  }
}

export function buildBofaGateDecision(
  score: SotyScore,
  routePack: RoutePack | null,
  evidenceSnapshotId: string | null,
  options: { timestamp?: string } = {},
): BofaGateDecision {
  const generatedAt = options.timestamp ?? new Date().toISOString();
  const state = score.state;
  const mode = routePack?.bofa_integration_mode ?? null;
  const evidenceLevel = routePack?.evidence_level ?? "off";

  const blockingReasons: string[] = [];
  const warningReasons: string[] = [];
  let verdict: BofaGateVerdict;

  if (!routePack || mode === "disabled") {
    blockingReasons.push(
      routePack
        ? "Route pack BOFA integration mode is disabled"
        : "No route pack selected",
    );
    verdict = "blocked";
  } else if (state === "SOTY_BLOCKED") {
    blockingReasons.push(
      "SOTY state is SOTY_BLOCKED — one or more critical blocking deductions prevent operation",
    );
    verdict = "blocked";
  } else if (state === "SOTY_EXPOSED") {
    blockingReasons.push(
      "SOTY state is SOTY_EXPOSED — host exposure detected, route not safe for BOFA",
    );
    verdict = "blocked";
  } else if (state === "SOTY_DIRTY") {
    blockingReasons.push(
      "SOTY state is SOTY_DIRTY — dirty host posture detected, remediate before BOFA",
    );
    verdict = "blocked";
  } else if (state === "SOTY_WARN") {
    warningReasons.push(
      "SOTY state is SOTY_WARN — non-blocking deductions require operator review before proceeding",
    );
    verdict = "warning";
  } else {
    verdict = "allowed";
  }

  const preflight_passed = verdict === "allowed";
  const allowed_modules = allowedModulesFor(mode, verdict);
  const reasons = verdict === "blocked" ? blockingReasons : warningReasons;

  return {
    verdict,
    route_pack_id: routePack?.id ?? null,
    soty_state: state,
    required_evidence_level: mode === "enabled" ? "full" : "standard",
    current_evidence_level: evidenceLevel,
    allowed_modules,
    disallowed_modules: BOFA_DISALLOWED_MODULES,
    blocking_reasons: blockingReasons,
    warning_reasons: warningReasons,
    required_preflight_checks: requiredPreflightChecks(verdict),
    evidence_snapshot_id: evidenceSnapshotId,
    generated_at: generatedAt,
    preflight_passed,
    // Legacy flat aliases
    allowed: verdict === "allowed",
    blocked: verdict === "blocked",
    warn: verdict === "warning",
    reasons,
    required_fixes: blockingReasons,
  };
}
