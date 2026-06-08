import type { EvidenceLevel } from "./risk";
import type { MissionType } from "./routeCard";

export type BofaIntegrationMode = "disabled" | "gated" | "enabled";

/** A predefined bundle of mode, checks, evidence level and BOFA mode for a class of work. */
export interface RoutePack {
  id: string;
  name: string;
  description: string;
  target_user: string;
  enabled_checks: string[];
  required_confirmations: string[];
  osint_categories: string[];
  evidence_level: EvidenceLevel;
  bofa_integration_mode: BofaIntegrationMode;
  safety_warnings: string[];
  default_mission_types: MissionType[];
}
