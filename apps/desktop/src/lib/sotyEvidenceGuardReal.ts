/**
 * Real Evidence Guard signal fetch.
 *
 * Invokes the Tauri `run_evidence_guard_signals` command to read real,
 * read-only evidence-readiness signals from the local machine (evidence
 * directory readiness, recorded session count, BOFA/SotyHUB export
 * settings) and maps them into the shape `computeSotyScore()` already
 * understands (`SotyScoreInput["evidence"]`).
 *
 * Safety: read-only. Never creates the evidence directory or writes
 * anything — a fresh install with no directory yet is reported honestly as
 * not ready, not silently fixed. Only runs inside the packaged Tauri app —
 * throws when invoked from a plain browser preview.
 */
import { invoke } from "@tauri-apps/api/tauri";
import type { SotyScoreInput } from "./sotyScoreRules";

export interface EvidenceGuardSignals {
  evidence_dir: string;
  evidence_dir_ready: boolean;
  session_count: number;
  bofa_export_enabled: boolean;
  sotyhub_export_enabled: boolean;
  generated_at: string;
}

/**
 * Maps real evidence signals into `SotyScoreInput["evidence"]`.
 *
 * `evidence_directory_ready` and `session_id_available` (proxied by "at
 * least one session has ever been recorded") are the only two fields with
 * live deduction effect today, and both map to a genuine real check.
 * `bofa_export_enabled`/`sotyhub_export_enabled` map to the real Settings
 * values — currently inert (no deduction rule references them yet), but
 * correctly wired for if one is added later.
 * `evidence_enabled` and `evidence_level` always pass through the demo
 * preset's value — neither concept has a real backing field anywhere in
 * `AppSettings` or `Profile` today, so this never guesses at one.
 */
export function mapEvidenceSignalsToScoreInput(
  signals: EvidenceGuardSignals,
  demoEvidence: SotyScoreInput["evidence"],
): SotyScoreInput["evidence"] {
  return {
    evidence_enabled: demoEvidence.evidence_enabled,
    evidence_directory_ready: signals.evidence_dir_ready,
    session_id_available: signals.session_count > 0,
    evidence_level: demoEvidence.evidence_level,
    bofa_export_enabled: signals.bofa_export_enabled,
    sotyhub_export_enabled: signals.sotyhub_export_enabled,
  };
}

export async function fetchRealEvidenceGuardSignals(): Promise<EvidenceGuardSignals> {
  return invoke<EvidenceGuardSignals>("run_evidence_guard_signals");
}
