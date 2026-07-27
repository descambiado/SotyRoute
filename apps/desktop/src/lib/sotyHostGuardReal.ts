/**
 * Real Host Guard signal fetch — PR 15.
 *
 * Invokes the Tauri `run_host_guard_signals` command to read real, read-only
 * posture signals from the local machine (firewall, Defender, proxy, known
 * tunnel processes, elevation) and maps them into the shape the existing
 * deterministic `runHostGuard()` engine already understands.
 *
 * Safety: read-only. No system mutation. No external network call. No data
 * leaves the local process. Only runs inside the packaged Tauri app —
 * throws when invoked from a plain browser preview.
 */
import { invoke } from "@tauri-apps/api/tauri";
import type { HostGuardInput } from "../types/hostGuard";

export interface HostGuardSignals {
  os_detected: boolean;
  elevated: boolean;
  firewall_enabled: boolean | null;
  defender_enabled: boolean | null;
  proxy_configured: boolean | null;
  known_tunnel_process_running: boolean | null;
  generated_at: string;
}

export function mapSignalsToHostGuardInput(signals: HostGuardSignals): HostGuardInput {
  return {
    os_detected: signals.os_detected,
    elevated: signals.elevated,
    firewall_enabled: signals.firewall_enabled,
    defender_enabled: signals.defender_enabled,
    suspicious_proxy_settings: signals.proxy_configured,
    suspicious_route_warning: null,
    known_tunnel_process_detected: signals.known_tunnel_process_running,
  };
}

export async function fetchRealHostGuardSignals(): Promise<HostGuardSignals> {
  return invoke<HostGuardSignals>("run_host_guard_signals");
}
