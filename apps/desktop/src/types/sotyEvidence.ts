/**
 * SOTY Evidence Snapshot types — PR 9.
 *
 * Captures a safe, redacted snapshot of SOTY Dashboard state for local evidence.
 * No query content, credentials, tokens, cookies, or external page content
 * is included in any field of this type.
 */
import type { SotyState } from "./sotyScore";
import type { EvidenceLevel } from "./risk";
import type { BofaIntegrationMode } from "./routePack";
import type { HostGuardStatus } from "./hostGuard";
import type { OsintRiskLevel, OsintCategory } from "./osintNavigator";
import type { MissionType } from "./routeCard";

export const SOTY_EVIDENCE_SCHEMA_VERSION = "1" as const;

export interface SotyEvidenceScoreSummary {
  overall_score: number;
  state: SotyState;
  route_score: number;
  host_score: number;
  scope_score: number;
  intel_score: number;
  evidence_score: number;
  deductions_count: number;
  blocking_deductions_count: number;
}

export interface SotyEvidenceRoutePackSummary {
  id: string;
  name: string;
  evidence_level: EvidenceLevel;
  bofa_integration_mode: BofaIntegrationMode;
  safety_warnings_count: number;
}

export interface SotyEvidenceRouteCardSummary {
  id: string;
  mission_type: MissionType;
  title: string;
  recommended_mode: string;
  required_checks: string[];
  risk_warnings_count: number;
  scope_requirements: string[];
  bofa_allowed_modules_count: number;
  bofa_disallowed_modules_count: number;
  next_safe_actions: string[];
}

export interface SotyEvidenceHostGuardSummary {
  status: HostGuardStatus;
  checks_count: number;
  warning_count: number;
  fail_count: number;
  demo_mode: boolean;
  source: "demo";
}

export interface SotyEvidenceOsintOpenedResource {
  resource_id: string;
  risk_level: OsintRiskLevel;
  categories: OsintCategory[];
  requires_confirmation: boolean;
  opened_via: "copy_url" | "planned";
  query_content_logged: false;
}

export interface SotyEvidenceOsintSummary {
  resources_total: number;
  low_risk_count: number;
  medium_risk_count: number;
  high_risk_count: number;
  blocked_count: number;
  opened_resources: SotyEvidenceOsintOpenedResource[];
}

/** All fields are structurally false — not runtime-derived. */
export interface SotyEvidenceRedactionGuarantees {
  query_content_logged: false;
  external_page_content_logged: false;
  credentials_logged: false;
  tokens_logged: false;
  cookies_logged: false;
}

export interface SotyEvidenceSnapshot {
  id: string;
  generated_at: string;
  schema_version: typeof SOTY_EVIDENCE_SCHEMA_VERSION;
  source: "soty_dashboard";
  operator_label: string | null;
  demo_mode: boolean;
  demo_preset: string | null;
  soty_score: SotyEvidenceScoreSummary;
  route_pack: SotyEvidenceRoutePackSummary | null;
  route_card: SotyEvidenceRouteCardSummary | null;
  host_guard: SotyEvidenceHostGuardSummary | null;
  osint: SotyEvidenceOsintSummary;
  warnings: string[];
  recommended_fixes: string[];
  limitations: string[];
  redaction: SotyEvidenceRedactionGuarantees;
}
