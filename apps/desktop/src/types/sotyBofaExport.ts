import type { SotyState } from "./sotyScore";
import type { BofaIntegrationMode } from "./routePack";
import type { BofaAllowedModule, BofaDisallowedModule } from "./bofaGate";

export interface SotyBofaExportPayload {
  schema: "soty_bofa_v1";
  producer: "sotyroute-desktop";
  generated_at: string;
  evidence_snapshot_id: string;
  soty_state: SotyState;
  preflight_passed: boolean;
  gate_decision: "allowed" | "warning" | "blocked";
  route_pack_id: string | null;
  bofa_integration_mode: BofaIntegrationMode | null;
  allowed_modules: readonly BofaAllowedModule[];
  disallowed_modules: readonly BofaDisallowedModule[];
  blocking_reasons: string[];
  warning_reasons: string[];
  required_preflight_checks: string[];
  local_evidence_path_note: "see soty_evidence.json in the same run directory";
  redaction: {
    readonly query_content_logged: false;
    readonly credentials_logged: false;
    readonly tokens_logged: false;
    readonly cookies_logged: false;
    readonly external_page_content_logged: false;
  };
}
