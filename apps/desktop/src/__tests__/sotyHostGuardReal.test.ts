import { describe, it, expect } from "vitest";
import { mapSignalsToHostGuardInput, type HostGuardSignals } from "../lib/sotyHostGuardReal";

const BASE: HostGuardSignals = {
  os_detected: true,
  elevated: false,
  firewall_enabled: true,
  defender_enabled: true,
  proxy_configured: false,
  known_tunnel_process_running: false,
  generated_at: "2026-01-01T00:00:00.000Z",
};

describe("mapSignalsToHostGuardInput", () => {
  it("maps os_detected and elevated straight through", () => {
    const input = mapSignalsToHostGuardInput(BASE);
    expect(input.os_detected).toBe(true);
    expect(input.elevated).toBe(false);
  });

  it("maps firewall_enabled straight through", () => {
    expect(mapSignalsToHostGuardInput(BASE).firewall_enabled).toBe(true);
    expect(mapSignalsToHostGuardInput({ ...BASE, firewall_enabled: null }).firewall_enabled).toBeNull();
  });

  it("maps defender_enabled straight through", () => {
    expect(mapSignalsToHostGuardInput(BASE).defender_enabled).toBe(true);
    expect(mapSignalsToHostGuardInput({ ...BASE, defender_enabled: null }).defender_enabled).toBeNull();
  });

  it("maps proxy_configured to suspicious_proxy_settings", () => {
    expect(mapSignalsToHostGuardInput({ ...BASE, proxy_configured: true }).suspicious_proxy_settings).toBe(true);
    expect(mapSignalsToHostGuardInput({ ...BASE, proxy_configured: null }).suspicious_proxy_settings).toBeNull();
  });

  it("maps known_tunnel_process_running to known_tunnel_process_detected", () => {
    expect(
      mapSignalsToHostGuardInput({ ...BASE, known_tunnel_process_running: true }).known_tunnel_process_detected
    ).toBe(true);
    expect(
      mapSignalsToHostGuardInput({ ...BASE, known_tunnel_process_running: null }).known_tunnel_process_detected
    ).toBeNull();
  });

  it("always maps suspicious_route_warning to null — not yet implemented in real mode", () => {
    expect(mapSignalsToHostGuardInput(BASE).suspicious_route_warning).toBeNull();
  });
});
