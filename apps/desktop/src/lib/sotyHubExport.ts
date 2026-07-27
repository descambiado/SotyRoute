/**
 * SotyHUB export builder and renderer — PR 11.
 *
 * Builds a SotyHubExportPayload from a gate decision + evidence snapshot.
 * Contains counts and summaries only; no query content, credentials, tokens,
 * cookies, raw host data, or OSINT query content is captured.
 *
 * Safety: no external calls; no I/O; no SotyHUB upload; no network.
 */
import type { SotyEvidenceSnapshot } from "../types/sotyEvidence";
import type { BofaGateDecision } from "../types/bofaGate";
import type { SotyHubExportPayload } from "../types/sotyHubExport";
import { deepStripUnsafeFields } from "./sotyEvidenceRedaction";

const NEVER_EXPORTED: string[] = [
  "query_content",
  "search_terms",
  "credentials",
  "tokens",
  "cookies",
  "api_keys",
  "external_page_content",
  "response_bodies",
  "downloaded_content",
  "clipboard_content",
  "raw_osint_queries",
  "raw_html",
  "session_auth_headers",
  "user_secrets",
];

const LIMITATIONS: string[] = [
  "All scores are demo-mode only — no real system checks were performed",
  "Host Guard signals are simulated; no actual OS state is captured",
  "OSINT resource catalog counts reflect the navigator catalog, not operator activity",
  "Evidence snapshot is generated from UI state; no external data was collected",
  "This export is for local review only — do not transmit without operator review",
];

function sortedReplacer(_key: string, value: unknown): unknown {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
        a.localeCompare(b),
      ),
    );
  }
  return value;
}

export function buildSotyhubExportPayload(
  gate: BofaGateDecision,
  snapshot: SotyEvidenceSnapshot,
): SotyHubExportPayload {
  const s = snapshot.soty_score;
  const pack = snapshot.route_pack;
  const card = snapshot.route_card;
  const hg = snapshot.host_guard;
  const osint = snapshot.osint;

  const publicSummary = [
    `SOTY Score: ${s.overall_score}/100 (${s.state})`,
    pack ? `Route Pack: ${pack.name}` : "Route Pack: none",
    card ? `Mission: ${card.mission_type}` : "Mission: none",
    `BOFA Gate: ${gate.verdict}`,
    `Preflight: ${gate.preflight_passed ? "passed" : "not passed"}`,
  ].join(" | ");

  return {
    export_schema_version: "soty_hub_v1",
    generated_at: new Date().toISOString(),
    evidence_snapshot_id: snapshot.id,
    soty_score_summary: {
      overall_score: s.overall_score,
      state: s.state,
      route_score: s.route_score,
      host_score: s.host_score,
      scope_score: s.scope_score,
      intel_score: s.intel_score,
      evidence_score: s.evidence_score,
      deductions_count: s.deductions_count,
      blocking_deductions_count: s.blocking_deductions_count,
    },
    route_pack_summary: pack
      ? {
          id: pack.id,
          name: pack.name,
          evidence_level: pack.evidence_level,
          bofa_integration_mode: pack.bofa_integration_mode,
        }
      : null,
    mission_summary: card
      ? { mission_type: card.mission_type, recommended_mode: card.recommended_mode }
      : null,
    host_guard_summary: hg
      ? {
          status: hg.status,
          checks_count: hg.checks_count,
          warning_count: hg.warning_count,
          fail_count: hg.fail_count,
        }
      : null,
    osint_summary: {
      resources_total: osint.resources_total,
      low_risk_count: osint.low_risk_count,
      medium_risk_count: osint.medium_risk_count,
      high_risk_count: osint.high_risk_count,
      blocked_count: osint.blocked_count,
    },
    bofa_gate_summary: {
      gate_decision: gate.verdict,
      preflight_passed: gate.preflight_passed,
      allowed_modules_count: gate.allowed_modules.length,
      disallowed_modules_count: gate.disallowed_modules.length,
    },
    public_shareable_summary: publicSummary,
    redaction: {
      query_content_logged: false,
      credentials_logged: false,
      tokens_logged: false,
      cookies_logged: false,
      external_page_content_logged: false,
      raw_host_data_logged: false,
      osint_query_content_logged: false,
    },
    never_exported: NEVER_EXPORTED,
    limitations: LIMITATIONS,
  };
}

export function renderSotyhubExportJson(payload: SotyHubExportPayload): string {
  const safe = deepStripUnsafeFields(payload as unknown as Record<string, unknown>);
  return JSON.stringify(safe, sortedReplacer, 2);
}
