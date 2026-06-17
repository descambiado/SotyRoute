import type { MissionType } from "./routeCard";

export type OsintRiskLevel = "low" | "medium" | "high" | "blocked";

export type OsintCategory =
  | "threat_intelligence"
  | "ioc_lookup"
  | "domain_ip_reputation"
  | "malware_analysis"
  | "vulnerability_intelligence"
  | "privacy_self_check"
  | "breach_exposure_own_assets"
  | "reporting_abuse"
  | "training"
  | "documentation"
  | "security_communities";

export interface OsintResource {
  id: string;
  name: string;
  /** Empty string for blocked resources — never rendered or copyable. */
  url: string;
  categories: OsintCategory[];
  risk: OsintRiskLevel;
  description: string;
  /** Operator-facing authorized-use statement. Must not contain banned phrases. */
  allowed_use: string;
  /** true for medium/high resources — triggers the full confirmation modal. */
  requires_confirmation: boolean;
  relevant_missions: MissionType[];
  /** IDs of route packs this resource is relevant to. */
  relevant_pack_ids: string[];
}

export interface OsintFilterState {
  categories: OsintCategory[];
  risks: OsintRiskLevel[];
}

export type OsintConfirmationStatus = "idle" | "pending" | "copied";

export interface OsintConfirmationState {
  status: OsintConfirmationStatus;
  resource: OsintResource | null;
}
