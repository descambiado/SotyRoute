// Shared TypeScript types mirrored from the Rust backend.
// Keep this file in lockstep with `apps/desktop/src-tauri/src/*` serde structs.

export type Mode = "observe" | "tor" | "wireguard" | "socks5" | "lab";
export type SessionStatus = "completed" | "failed" | "partial";
export type WarningSeverity = "info" | "warn" | "error";

export interface Warning {
  code: string;
  severity: WarningSeverity;
  message: string;
}

export interface Profile {
  name: string;
  mode: Mode;
  owner?: string;
  purpose?: string;
  transport: Mode | "observe";
  allowed_targets?: string[];
  blocked_targets?: string[];
  kill_switch?: boolean;
  dns_check?: boolean;
  evidence?: boolean;
  notes?: string;
  tags?: string[];
  socks5?: { host: string; port: number; auth?: "none" | "userpass" };
  wireguard?: { tunnel_name?: string; expected_endpoint?: string };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  normalized?: Profile;
}

export interface NetworkInterface {
  name: string;
  description: string;
  addresses: string[];
  is_up: boolean;
}

export interface DoctorReport {
  os_name: string;
  os_version: string;
  hostname: string;
  user: string;
  admin: boolean;
  interfaces: NetworkInterface[];
  dns_servers: string[];
  tor_installed: boolean;
  tor_hint: string;
  wireguard_installed: boolean;
  wireguard_hint: string;
  /** Present only when public_ip_check_enabled is true in settings. */
  public_ip?: string;
  generated_at: string;
}

/** Result of a TCP reachability probe (#19). */
export interface TcpProbeResult {
  host: string;
  port: number;
  reachable: boolean;
  latency_ms?: number;
  error?: string;
}

export interface PlanStep {
  step: string;
  detail: string;
  reversible: boolean;
  executes_in_v0_1_0: boolean;
}

export interface SessionSummary {
  session_id: string;
  mode: Mode;
  profile_name: string;
  started_at: string;
  ended_at: string;
  dry_run: boolean;
  admin: boolean;
  status: SessionStatus;
  warnings_count: number;
  evidence_dir: string;
}

export interface SessionDetail extends SessionSummary {
  warnings: Warning[];
  checks: DoctorReport;
  plan: PlanStep[];
  evidence_md: string;
  bofa_export_path: string | null;
  sotyhub_export_path: string | null;
}

export interface AppSettings {
  evidence_dir: string;
  default_mode: Mode;
  telemetry_enabled: boolean;
  public_ip_check_enabled: boolean;
  theme: "dark" | "light";
  export_bofa_default: boolean;
  export_sotyhub_default: boolean;
}
