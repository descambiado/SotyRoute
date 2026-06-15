/**
 * Maps a HostGuardSummary back to a SotyScoreInput["host"]-compatible shape.
 *
 * Used to propagate Host Guard results into the SOTY scoring context.
 * Read-only — no mutations occur here.
 */
import type { HostGuardCheck, HostGuardCheckId, HostGuardSummary } from "../types/hostGuard";

type HostSignals = {
  os_detected: boolean;
  elevated: boolean | null;
  firewall_enabled: boolean | null;
  defender_enabled: boolean | null;
  suspicious_proxy_settings: boolean;
  suspicious_route_warning: boolean;
  known_tunnel_process_detected: boolean;
  host_guard_available: boolean;
};

function get(checks: HostGuardCheck[], id: HostGuardCheckId): HostGuardCheck | undefined {
  return checks.find(c => c.id === id);
}

export function hostGuardToHostInput(summary: HostGuardSummary): HostSignals {
  const { checks } = summary;

  const osCheck = get(checks, "HG_OS_DETECTED");
  const elevCheck = get(checks, "HG_ELEVATED");
  const fwCheck = get(checks, "HG_FIREWALL");
  const avCheck = get(checks, "HG_DEFENDER");
  const proxyCheck = get(checks, "HG_SUSPICIOUS_PROXY");
  const routeCheck = get(checks, "HG_SUSPICIOUS_ROUTE");
  const tunnelCheck = get(checks, "HG_KNOWN_TUNNEL");

  return {
    host_guard_available: true,
    os_detected: osCheck?.status === "fail" ? false : true,
    elevated: elevCheck?.status === "pass" ? false : elevCheck?.status === "fail" ? true : null,
    firewall_enabled: fwCheck?.status === "pass" ? true : fwCheck?.status === "fail" ? false : null,
    defender_enabled: avCheck?.status === "pass" ? true : avCheck?.status === "fail" ? false : null,
    suspicious_proxy_settings: proxyCheck?.status === "fail",
    suspicious_route_warning: routeCheck?.status === "fail",
    known_tunnel_process_detected: tunnelCheck?.status !== "pass",
  };
}
