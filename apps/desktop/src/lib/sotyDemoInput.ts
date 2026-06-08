/**
 * Demo presets for the PR 4 SOTY Dashboard.
 *
 * Each preset calls computeSotyScore() with a crafted SotyScoreInput so the
 * dashboard can display all four meaningful states without touching the
 * real system. These are static, read-only, display-only values — no system
 * checks are run and no mutations occur.
 *
 * Safety: no I/O, no side-effects, no external calls.
 */
import { computeSotyScore, type SotyScoreInput } from "./sotyScoreEngine";
import type { SotyScore } from "../types/sotyScore";

// ─── Base signal objects (all signals nominal) ────────────────────────────────

const BASE_ROUTE: SotyScoreInput["route"] = {
  public_ip_detected: true,
  dns_detected: true,
  dns_matches_profile: true,
  tunnel_detected: true,
  tunnel_expected: true,
  ipv6_leak_risk: false,
  proxy_detected: false,
  suspicious_proxy: false,
  route_table_snapshot_available: true,
  kill_switch_available: true,
  kill_switch_enabled: true,
};

const BASE_HOST: SotyScoreInput["host"] = {
  os_detected: true,
  elevated: false,
  firewall_enabled: true,
  defender_enabled: true,
  suspicious_proxy_settings: false,
  suspicious_route_warning: false,
  known_tunnel_process_detected: false,
  host_guard_available: true,
};

const BASE_SCOPE: SotyScoreInput["scope"] = {
  profile_loaded: true,
  profile_valid: true,
  target_declared: true,
  target_in_allowed_scope: true,
  blocked_target_match: false,
  authorized_use_confirmed: true,
};

const BASE_INTEL: SotyScoreInput["intel"] = {
  route_pack_selected: true,
  osint_categories_selected: true,
  high_risk_resource_enabled: false,
  blocked_resource_requested: false,
  query_logging_disabled: true,
};

const BASE_EVIDENCE: SotyScoreInput["evidence"] = {
  evidence_enabled: true,
  evidence_directory_ready: true,
  session_id_available: true,
  evidence_level: "full",
  bofa_export_enabled: true,
  sotyhub_export_enabled: true,
};

// ─── Demo inputs ──────────────────────────────────────────────────────────────

/**
 * SOTY_READY — all signals nominal, no deductions.
 * route=100 host=100 scope=100 intel=100 evidence=100 overall=100
 */
const READY_INPUT: SotyScoreInput = {
  route: BASE_ROUTE,
  host: BASE_HOST,
  scope: BASE_SCOPE,
  intel: BASE_INTEL,
  evidence: BASE_EVIDENCE,
  route_pack: { route_pack_id: "lab_route" },
};

/**
 * SOTY_WARN — non-blocking, high-severity host deduction; medium route deduction.
 * HOST_FIREWALL_DISABLED (-20, high) + ROUTE_KILL_SWITCH_DISABLED (-10, medium)
 * route=90 host=80 scope=100 intel=100 evidence=100 overall=93
 * SOTY_WARN because overall≥70 but high-severity deduction blocks SOTY_READY.
 */
const WARN_INPUT: SotyScoreInput = {
  route: { ...BASE_ROUTE, kill_switch_enabled: false },
  host: { ...BASE_HOST, firewall_enabled: false },
  scope: BASE_SCOPE,
  intel: BASE_INTEL,
  evidence: BASE_EVIDENCE,
  route_pack: { route_pack_id: "lab_route" },
};

/**
 * SOTY_EXPOSED — tunnel missing + IPv6 leak risk.
 * ROUTE_TUNNEL_MISSING (-30, high) + ROUTE_IPV6_LEAK (-20, high)
 * route=50 everything else=100 overall=85
 * SOTY_EXPOSED because route_score < 60.
 */
const EXPOSED_INPUT: SotyScoreInput = {
  route: {
    ...BASE_ROUTE,
    tunnel_detected: false,
    tunnel_expected: true,
    ipv6_leak_risk: true,
  },
  host: BASE_HOST,
  scope: BASE_SCOPE,
  intel: BASE_INTEL,
  evidence: BASE_EVIDENCE,
  route_pack: { route_pack_id: "osint_route" },
};

/**
 * SOTY_BLOCKED — target outside allowed scope (SCOPE_OUT_OF_SCOPE, blocking).
 * One critical blocking deduction; no route_pack.
 */
const BLOCKED_INPUT: SotyScoreInput = {
  route: BASE_ROUTE,
  host: BASE_HOST,
  scope: { ...BASE_SCOPE, target_in_allowed_scope: false },
  intel: BASE_INTEL,
  evidence: BASE_EVIDENCE,
  route_pack: { route_pack_id: null },
};

// ─── Preset key type ──────────────────────────────────────────────────────────

export type DemoPresetKey = "ready" | "warn" | "exposed" | "blocked";

export const DEMO_PRESET_LABELS: Record<DemoPresetKey, string> = {
  ready: "SOTY_READY",
  warn: "SOTY_WARN",
  exposed: "SOTY_EXPOSED",
  blocked: "SOTY_BLOCKED",
};

export const DEMO_PRESET_KEYS: readonly DemoPresetKey[] = [
  "ready",
  "warn",
  "exposed",
  "blocked",
];

// ─── Computed scores (module-level, recomputed fresh each session load) ───────

export const DEMO_PRESETS: Record<DemoPresetKey, SotyScore> = {
  ready: computeSotyScore(READY_INPUT, { profileName: "authorized-lab" }),
  warn: computeSotyScore(WARN_INPUT, { profileName: "lab-profile" }),
  exposed: computeSotyScore(EXPOSED_INPUT, { profileName: "osint-session" }),
  blocked: computeSotyScore(BLOCKED_INPUT, { profileName: "out-of-scope" }),
};
