export type HostGuardStatus = "pass" | "warn" | "fail" | "skip";

export type HostGuardCheckId =
  | "HG_OS_DETECTED"
  | "HG_ELEVATED"
  | "HG_FIREWALL"
  | "HG_DEFENDER"
  | "HG_SUSPICIOUS_PROXY"
  | "HG_SUSPICIOUS_ROUTE"
  | "HG_KNOWN_TUNNEL";

export type HostGuardCheckPhase = "host" | "route" | "process";

export interface HostGuardCheck {
  id: HostGuardCheckId;
  phase: HostGuardCheckPhase;
  label: string;
  status: HostGuardStatus;
  detail: string;
}

/**
 * Raw posture signals fed to the engine. Mirrors SotyScoreInput["host"] minus
 * host_guard_available. Every field is nullable: `null` means the signal
 * could not be determined (e.g. the underlying check is unsupported on this
 * OS, or not yet implemented) — the engine surfaces that as an honest "skip"
 * status rather than fabricating a pass or fail.
 */
export interface HostGuardInput {
  os_detected: boolean;
  elevated: boolean | null;
  firewall_enabled: boolean | null;
  defender_enabled: boolean | null;
  suspicious_proxy_settings: boolean | null;
  suspicious_route_warning: boolean | null;
  known_tunnel_process_detected: boolean | null;
}

export interface HostGuardSummary {
  overall: HostGuardStatus;
  checks: HostGuardCheck[];
  run_at: string;
  limitation_copy: string;
}
