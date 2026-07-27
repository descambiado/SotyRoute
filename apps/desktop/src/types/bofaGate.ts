import type { SotyState } from "./sotyScore";
import type { EvidenceLevel } from "./risk";

export type BofaGateVerdict = "allowed" | "warning" | "blocked";

export const BOFA_ALLOWED_MODULES = [
  "evidence_review",
  "defensive_mapping",
  "detection_mapping",
  "ioc_enrichment_placeholder",
  "report_generation",
  "lab_only_validation",
] as const;

export type BofaAllowedModule = (typeof BOFA_ALLOWED_MODULES)[number];

export const BOFA_DISALLOWED_MODULES = [
  "exploit_execution",
  "credential_access",
  "persistence",
  "lateral_movement",
  "evasion",
  "destructive_actions",
  "unauthorized_scanning",
] as const;

export type BofaDisallowedModule = (typeof BOFA_DISALLOWED_MODULES)[number];

/** Decision record emitted by the BOFA Gate for a given score + route pack. */
export interface BofaGateDecision {
  /** Summary verdict. */
  verdict: BofaGateVerdict;
  route_pack_id: string | null;
  soty_state: SotyState;
  required_evidence_level: EvidenceLevel;
  current_evidence_level: EvidenceLevel;
  allowed_modules: readonly BofaAllowedModule[];
  disallowed_modules: readonly BofaDisallowedModule[];
  blocking_reasons: string[];
  warning_reasons: string[];
  required_preflight_checks: string[];
  evidence_snapshot_id: string | null;
  generated_at: string;
  preflight_passed: boolean;
  /** Legacy flat-boolean aliases kept for existing callers. */
  allowed: boolean;
  blocked: boolean;
  warn: boolean;
  reasons: string[];
  required_fixes: string[];
}
