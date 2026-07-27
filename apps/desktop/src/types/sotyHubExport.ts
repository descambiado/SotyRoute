import type { SotyState } from "./sotyScore";
import type { EvidenceLevel } from "./risk";
import type { BofaIntegrationMode } from "./routePack";
import type { MissionType } from "./routeCard";
import type { HostGuardStatus } from "./hostGuard";

export interface SotyHubExportPayload {
  export_schema_version: "soty_hub_v1";
  generated_at: string;
  evidence_snapshot_id: string;
  soty_score_summary: {
    overall_score: number;
    state: SotyState;
    route_score: number;
    host_score: number;
    scope_score: number;
    intel_score: number;
    evidence_score: number;
    deductions_count: number;
    blocking_deductions_count: number;
  };
  route_pack_summary: {
    id: string;
    name: string;
    evidence_level: EvidenceLevel;
    bofa_integration_mode: BofaIntegrationMode;
  } | null;
  mission_summary: {
    mission_type: MissionType;
    recommended_mode: string;
  } | null;
  host_guard_summary: {
    status: HostGuardStatus;
    checks_count: number;
    warning_count: number;
    fail_count: number;
  } | null;
  osint_summary: {
    resources_total: number;
    low_risk_count: number;
    medium_risk_count: number;
    high_risk_count: number;
    blocked_count: number;
  };
  bofa_gate_summary: {
    gate_decision: "allowed" | "warning" | "blocked";
    preflight_passed: boolean;
    allowed_modules_count: number;
    disallowed_modules_count: number;
  };
  public_shareable_summary: string;
  redaction: {
    readonly query_content_logged: false;
    readonly credentials_logged: false;
    readonly tokens_logged: false;
    readonly cookies_logged: false;
    readonly external_page_content_logged: false;
    readonly raw_host_data_logged: false;
    readonly osint_query_content_logged: false;
  };
  never_exported: string[];
  limitations: string[];
}
