/**
 * BOFA export builder and renderer — PR 11.
 *
 * Builds a SotyBofaExportPayload from a gate decision + evidence snapshot.
 * Renders it to deterministic JSON (sorted keys, deepStrip applied).
 *
 * Safety: no external calls; no I/O; no system mutations. Never launches BOFA.
 * Does not write credentials, tokens, cookies, query content, or external page content.
 */
import type { SotyEvidenceSnapshot } from "../types/sotyEvidence";
import type { BofaGateDecision } from "../types/bofaGate";
import type { SotyBofaExportPayload } from "../types/sotyBofaExport";
import { deepStripUnsafeFields } from "./sotyEvidenceRedaction";

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

export function buildBofaExportPayload(
  gate: BofaGateDecision,
  snapshot: SotyEvidenceSnapshot,
): SotyBofaExportPayload {
  return {
    schema: "soty_bofa_v1",
    producer: "sotyroute-desktop",
    generated_at: new Date().toISOString(),
    evidence_snapshot_id: snapshot.id,
    soty_state: snapshot.soty_score.state,
    preflight_passed: gate.preflight_passed,
    gate_decision: gate.verdict,
    route_pack_id: gate.route_pack_id,
    bofa_integration_mode: snapshot.route_pack?.bofa_integration_mode ?? null,
    allowed_modules: gate.allowed_modules,
    disallowed_modules: gate.disallowed_modules,
    blocking_reasons: gate.blocking_reasons,
    warning_reasons: gate.warning_reasons,
    required_preflight_checks: gate.required_preflight_checks,
    local_evidence_path_note: "see soty_evidence.json in the same run directory",
    redaction: {
      query_content_logged: false,
      credentials_logged: false,
      tokens_logged: false,
      cookies_logged: false,
      external_page_content_logged: false,
    },
  };
}

export function renderBofaExportJson(payload: SotyBofaExportPayload): string {
  const safe = deepStripUnsafeFields(payload as unknown as Record<string, unknown>);
  return JSON.stringify(safe, sortedReplacer, 2);
}
