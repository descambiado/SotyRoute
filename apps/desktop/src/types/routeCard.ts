import type { Mode } from "../lib/types";
import type { EvidenceLevel } from "./risk";

export type MissionType =
  | "investigate_domain"
  | "analyze_ip"
  | "check_hash"
  | "open_osint_sources"
  | "connect_to_lab"
  | "launch_bofa"
  | "public_wifi"
  | "breach_exposure_self_check"
  | "privacy_route"
  | "defensive_workstation_check";

export const MISSION_TYPES: readonly MissionType[] = [
  "investigate_domain",
  "analyze_ip",
  "check_hash",
  "open_osint_sources",
  "connect_to_lab",
  "launch_bofa",
  "public_wifi",
  "breach_exposure_self_check",
  "privacy_route",
  "defensive_workstation_check",
];

/** Output of the Soty Agent for one mission. */
export interface RouteCard {
  id: string;
  mission_type: MissionType;
  title: string;
  summary: string;
  recommended_mode: Mode;
  required_checks: string[];
  recommended_resources: string[];
  risk_warnings: string[];
  scope_requirements: string[];
  evidence_settings: EvidenceLevel;
  bofa_allowed_modules: string[];
  bofa_disallowed_modules: string[];
  next_safe_actions: string[];
  created_at: string;
}
