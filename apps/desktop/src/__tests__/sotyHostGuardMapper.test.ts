import { describe, it, expect } from "vitest";
import { runHostGuard } from "../lib/sotyHostGuardEngine";
import { hostGuardToHostInput } from "../lib/sotyHostGuardMapper";
import type { HostGuardInput } from "../types/hostGuard";

const CLEAN: HostGuardInput = {
  os_detected: true,
  elevated: false,
  firewall_enabled: true,
  defender_enabled: true,
  suspicious_proxy_settings: false,
  suspicious_route_warning: false,
  known_tunnel_process_detected: false,
};

describe("hostGuardToHostInput — known_tunnel_process_detected", () => {
  it("is false when no tunnel process was detected", () => {
    const summary = runHostGuard(CLEAN);
    expect(hostGuardToHostInput(summary).known_tunnel_process_detected).toBe(false);
  });

  it("is true when a tunnel process was detected (HG_KNOWN_TUNNEL = warn)", () => {
    const summary = runHostGuard({ ...CLEAN, known_tunnel_process_detected: true });
    expect(hostGuardToHostInput(summary).known_tunnel_process_detected).toBe(true);
  });

  it("is false — not true — when the check could not be determined (HG_KNOWN_TUNNEL = skip)", () => {
    // Regression test: a naive `status !== "pass"` mapping would incorrectly
    // treat "skip" (unknown) as "true, a tunnel process is running", which
    // would falsely feed a scoring deduction for a check that never ran.
    const summary = runHostGuard({ ...CLEAN, known_tunnel_process_detected: null });
    expect(hostGuardToHostInput(summary).known_tunnel_process_detected).toBe(false);
  });
});
