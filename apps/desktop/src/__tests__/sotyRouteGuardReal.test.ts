import { describe, it, expect } from "vitest";
import { mapRouteSignalsToScoreInput, type RouteGuardSignals } from "../lib/sotyRouteGuardReal";
import type { RoutePack } from "../types/routePack";

const BASE: RouteGuardSignals = {
  dns_servers: ["1.1.1.1"],
  public_ip: "203.0.113.1",
  tunnel_installed: true,
  tunnel_process_running: true,
  proxy_configured: false,
  route_table_available: true,
  generated_at: "2026-01-01T00:00:00.000Z",
};

function makePack(enabledChecks: string[]): RoutePack {
  return {
    id: "test_pack",
    name: "Test Pack",
    description: "",
    target_user: "",
    enabled_checks: enabledChecks,
    required_confirmations: [],
    osint_categories: [],
    evidence_level: "standard",
    bofa_integration_mode: "disabled",
    safety_warnings: [],
    default_mission_types: [],
  };
}

describe("mapRouteSignalsToScoreInput", () => {
  it("maps dns_detected from a non-empty dns_servers list", () => {
    expect(mapRouteSignalsToScoreInput(BASE, null).dns_detected).toBe(true);
    expect(
      mapRouteSignalsToScoreInput({ ...BASE, dns_servers: [] }, null).dns_detected
    ).toBe(false);
  });

  it("maps public_ip_detected to true only for a real, non-error IP string", () => {
    expect(mapRouteSignalsToScoreInput(BASE, null).public_ip_detected).toBe(true);
    expect(
      mapRouteSignalsToScoreInput({ ...BASE, public_ip: null }, null).public_ip_detected
    ).toBe(false);
    expect(
      mapRouteSignalsToScoreInput(
        { ...BASE, public_ip: "error: PowerShell request failed" },
        null
      ).public_ip_detected
    ).toBe(false);
  });

  it("dns_matches_profile is always null — not yet wired to Scope", () => {
    expect(mapRouteSignalsToScoreInput(BASE, null).dns_matches_profile).toBeNull();
  });

  it("tunnel_detected reflects the real running-process check only", () => {
    expect(mapRouteSignalsToScoreInput(BASE, null).tunnel_detected).toBe(true);
    expect(
      mapRouteSignalsToScoreInput({ ...BASE, tunnel_process_running: false }, null)
        .tunnel_detected
    ).toBe(false);
    expect(
      mapRouteSignalsToScoreInput({ ...BASE, tunnel_process_running: null }, null)
        .tunnel_detected
    ).toBe(false);
  });

  it("tunnel_expected is false with no pack selected", () => {
    expect(mapRouteSignalsToScoreInput(BASE, null).tunnel_expected).toBe(false);
  });

  it("tunnel_expected is true when the selected pack enables tunnel_detection", () => {
    const pack = makePack(["public_ip", "tunnel_detection"]);
    expect(mapRouteSignalsToScoreInput(BASE, pack).tunnel_expected).toBe(true);
  });

  it("tunnel_expected is false when the selected pack does not enable tunnel_detection", () => {
    const pack = makePack(["public_ip", "dns_servers"]);
    expect(mapRouteSignalsToScoreInput(BASE, pack).tunnel_expected).toBe(false);
  });

  it("ipv6_leak_risk is always false — not yet implemented", () => {
    expect(mapRouteSignalsToScoreInput(BASE, null).ipv6_leak_risk).toBe(false);
  });

  it("proxy_detected and suspicious_proxy both reflect the real proxy check", () => {
    const withProxy = mapRouteSignalsToScoreInput({ ...BASE, proxy_configured: true }, null);
    expect(withProxy.proxy_detected).toBe(true);
    expect(withProxy.suspicious_proxy).toBe(true);

    const unknown = mapRouteSignalsToScoreInput({ ...BASE, proxy_configured: null }, null);
    expect(unknown.proxy_detected).toBe(false);
    expect(unknown.suspicious_proxy).toBe(false);
  });

  it("route_table_snapshot_available reflects the real check directly", () => {
    expect(mapRouteSignalsToScoreInput(BASE, null).route_table_snapshot_available).toBe(true);
    expect(
      mapRouteSignalsToScoreInput({ ...BASE, route_table_available: false }, null)
        .route_table_snapshot_available
    ).toBe(false);
  });

  it("kill_switch_available and kill_switch_enabled are always null — not generically detectable", () => {
    const input = mapRouteSignalsToScoreInput(BASE, null);
    expect(input.kill_switch_available).toBeNull();
    expect(input.kill_switch_enabled).toBeNull();
  });
});
