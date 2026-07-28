/**
 * Real Route Guard signal fetch — PR 19.
 *
 * Invokes the Tauri `run_route_guard_signals` command to read real,
 * read-only route posture signals from the local machine (DNS servers,
 * public IP if opted in, tunnel installation/process state, proxy
 * configuration, route table availability) and maps them into the shape
 * `computeSotyScore()` already understands (`SotyScoreInput["route"]`).
 *
 * Safety: read-only. No system mutation. The public-IP lookup only runs if
 * the operator already enabled it in Settings — no new external call is
 * introduced here. Only runs inside the packaged Tauri app — throws when
 * invoked from a plain browser preview.
 */
import { invoke } from "@tauri-apps/api/tauri";
import type { SotyScoreInput } from "./sotyScoreRules";
import type { RoutePack } from "../types/routePack";

export interface RouteGuardSignals {
  dns_servers: string[];
  public_ip: string | null;
  tunnel_installed: boolean;
  tunnel_process_running: boolean | null;
  proxy_configured: boolean | null;
  route_table_available: boolean;
  generated_at: string;
}

/**
 * Maps real route signals into `SotyScoreInput["route"]`.
 *
 * `dns_matches_profile` is always `null` — comparing against a declared
 * profile's expected DNS servers is Scope-sub-score work, not yet wired.
 * `ipv6_leak_risk` is always `false` — real IPv6 leak detection is not yet
 * implemented; this never fabricates a leak finding.
 * `kill_switch_available`/`kill_switch_enabled` are always `null` — there is
 * no generic Windows API for an arbitrary third-party VPN client's
 * kill-switch state.
 */
export function mapRouteSignalsToScoreInput(
  signals: RouteGuardSignals,
  selectedPack: RoutePack | null,
): SotyScoreInput["route"] {
  const publicIpDetected =
    signals.public_ip !== null && !signals.public_ip.startsWith("error:");
  return {
    public_ip_detected: publicIpDetected,
    dns_detected: signals.dns_servers.length > 0,
    dns_matches_profile: null,
    tunnel_detected: signals.tunnel_process_running === true,
    tunnel_expected: selectedPack?.enabled_checks.includes("tunnel_detection") ?? false,
    ipv6_leak_risk: false,
    proxy_detected: signals.proxy_configured ?? false,
    suspicious_proxy: signals.proxy_configured ?? false,
    route_table_snapshot_available: signals.route_table_available,
    kill_switch_available: null,
    kill_switch_enabled: null,
  };
}

export async function fetchRealRouteGuardSignals(): Promise<RouteGuardSignals> {
  return invoke<RouteGuardSignals>("run_route_guard_signals");
}
