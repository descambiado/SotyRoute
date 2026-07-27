import { describe, it, expect } from "vitest";
import { runHostGuard, DEMO_HOST_GUARD_INPUTS, HOST_GUARD_LIMITATION_COPY } from "../lib/sotyHostGuardEngine";
import type { HostGuardInput } from "../types/hostGuard";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const CLEAN: HostGuardInput = {
  os_detected: true,
  elevated: false,
  firewall_enabled: true,
  defender_enabled: true,
  suspicious_proxy_settings: false,
  suspicious_route_warning: false,
  known_tunnel_process_detected: false,
};

// ─── Overall status derivation ────────────────────────────────────────────────

describe("runHostGuard — overall status", () => {
  it("returns pass when all signals are nominal", () => {
    expect(runHostGuard(CLEAN).overall).toBe("pass");
  });

  it("returns fail when firewall is disabled", () => {
    expect(runHostGuard({ ...CLEAN, firewall_enabled: false }).overall).toBe("fail");
  });

  it("returns fail when defender is disabled", () => {
    expect(runHostGuard({ ...CLEAN, defender_enabled: false }).overall).toBe("fail");
  });

  it("returns fail when elevated is true", () => {
    expect(runHostGuard({ ...CLEAN, elevated: true }).overall).toBe("fail");
  });

  it("returns fail when os_detected is false", () => {
    expect(runHostGuard({ ...CLEAN, os_detected: false }).overall).toBe("fail");
  });

  it("returns fail when suspicious_proxy_settings is true", () => {
    expect(runHostGuard({ ...CLEAN, suspicious_proxy_settings: true }).overall).toBe("fail");
  });

  it("returns fail when suspicious_route_warning is true", () => {
    expect(runHostGuard({ ...CLEAN, suspicious_route_warning: true }).overall).toBe("fail");
  });

  it("returns warn when firewall status is null (unknown)", () => {
    expect(runHostGuard({ ...CLEAN, firewall_enabled: null }).overall).toBe("warn");
  });

  it("returns warn when defender status is null (unknown)", () => {
    expect(runHostGuard({ ...CLEAN, defender_enabled: null }).overall).toBe("warn");
  });

  it("returns warn when elevated status is null (unknown)", () => {
    expect(runHostGuard({ ...CLEAN, elevated: null }).overall).toBe("warn");
  });

  it("returns warn when a tunnel process is detected", () => {
    expect(runHostGuard({ ...CLEAN, known_tunnel_process_detected: true }).overall).toBe("warn");
  });

  it("fail takes precedence over warn", () => {
    expect(runHostGuard({ ...CLEAN, firewall_enabled: false, defender_enabled: null }).overall).toBe("fail");
  });

  it("returns pass when suspicious_proxy_settings is null (unknown, no other findings)", () => {
    expect(runHostGuard({ ...CLEAN, suspicious_proxy_settings: null }).overall).toBe("pass");
  });

  it("returns pass when suspicious_route_warning is null (unknown, no other findings)", () => {
    expect(runHostGuard({ ...CLEAN, suspicious_route_warning: null }).overall).toBe("pass");
  });

  it("returns pass when known_tunnel_process_detected is null (unknown, no other findings)", () => {
    expect(runHostGuard({ ...CLEAN, known_tunnel_process_detected: null }).overall).toBe("pass");
  });
});

// ─── Individual check results ─────────────────────────────────────────────────

describe("runHostGuard — check results", () => {
  it("always emits exactly 7 checks", () => {
    expect(runHostGuard(CLEAN).checks).toHaveLength(7);
  });

  it("includes HG_FIREWALL", () => {
    expect(runHostGuard(CLEAN).checks.map(c => c.id)).toContain("HG_FIREWALL");
  });

  it("HG_FIREWALL is pass when enabled", () => {
    const check = runHostGuard(CLEAN).checks.find(c => c.id === "HG_FIREWALL");
    expect(check?.status).toBe("pass");
  });

  it("HG_FIREWALL is fail when disabled", () => {
    const check = runHostGuard({ ...CLEAN, firewall_enabled: false }).checks.find(c => c.id === "HG_FIREWALL");
    expect(check?.status).toBe("fail");
  });

  it("HG_FIREWALL is warn when null", () => {
    const check = runHostGuard({ ...CLEAN, firewall_enabled: null }).checks.find(c => c.id === "HG_FIREWALL");
    expect(check?.status).toBe("warn");
  });

  it("HG_DEFENDER is fail when disabled", () => {
    const check = runHostGuard({ ...CLEAN, defender_enabled: false }).checks.find(c => c.id === "HG_DEFENDER");
    expect(check?.status).toBe("fail");
  });

  it("HG_ELEVATED is fail when true", () => {
    const check = runHostGuard({ ...CLEAN, elevated: true }).checks.find(c => c.id === "HG_ELEVATED");
    expect(check?.status).toBe("fail");
  });

  it("HG_KNOWN_TUNNEL is pass when not detected", () => {
    const check = runHostGuard(CLEAN).checks.find(c => c.id === "HG_KNOWN_TUNNEL");
    expect(check?.status).toBe("pass");
  });

  it("HG_KNOWN_TUNNEL is warn when detected", () => {
    const check = runHostGuard({ ...CLEAN, known_tunnel_process_detected: true }).checks.find(c => c.id === "HG_KNOWN_TUNNEL");
    expect(check?.status).toBe("warn");
  });

  it("HG_SUSPICIOUS_PROXY is skip when null", () => {
    const check = runHostGuard({ ...CLEAN, suspicious_proxy_settings: null }).checks.find(c => c.id === "HG_SUSPICIOUS_PROXY");
    expect(check?.status).toBe("skip");
  });

  it("HG_SUSPICIOUS_ROUTE is skip when null", () => {
    const check = runHostGuard({ ...CLEAN, suspicious_route_warning: null }).checks.find(c => c.id === "HG_SUSPICIOUS_ROUTE");
    expect(check?.status).toBe("skip");
  });

  it("HG_KNOWN_TUNNEL is skip when null", () => {
    const check = runHostGuard({ ...CLEAN, known_tunnel_process_detected: null }).checks.find(c => c.id === "HG_KNOWN_TUNNEL");
    expect(check?.status).toBe("skip");
  });
});

// ─── Summary shape ────────────────────────────────────────────────────────────

describe("runHostGuard — summary shape", () => {
  it("includes run_at as an ISO timestamp string", () => {
    expect(runHostGuard(CLEAN).run_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("includes limitation_copy equal to HOST_GUARD_LIMITATION_COPY", () => {
    expect(runHostGuard(CLEAN).limitation_copy).toBe(HOST_GUARD_LIMITATION_COPY);
  });

  it("limitation_copy does not contain banned phrases", () => {
    const copy = HOST_GUARD_LIMITATION_COPY.toLowerCase();
    const banned = ["guaranteed clean", "antivirus replacement", "edr replacement", "undetectable", "bypass", "evade"];
    for (const phrase of banned) {
      expect(copy).not.toContain(phrase);
    }
  });
});

// ─── Demo inputs ──────────────────────────────────────────────────────────────

describe("DEMO_HOST_GUARD_INPUTS", () => {
  it("ready preset produces overall pass", () => {
    expect(runHostGuard(DEMO_HOST_GUARD_INPUTS.ready).overall).toBe("pass");
  });

  it("warn preset produces overall fail (firewall disabled)", () => {
    expect(runHostGuard(DEMO_HOST_GUARD_INPUTS.warn).overall).toBe("fail");
  });

  it("dirty preset produces overall fail (firewall + defender disabled)", () => {
    expect(runHostGuard(DEMO_HOST_GUARD_INPUTS.dirty).overall).toBe("fail");
  });

  it("exposed preset produces overall pass (host is nominal in EXPOSED)", () => {
    expect(runHostGuard(DEMO_HOST_GUARD_INPUTS.exposed).overall).toBe("pass");
  });

  it("blocked preset produces overall pass (host is nominal in BLOCKED)", () => {
    expect(runHostGuard(DEMO_HOST_GUARD_INPUTS.blocked).overall).toBe("pass");
  });

  it("dirty preset: HG_FIREWALL is fail", () => {
    const check = runHostGuard(DEMO_HOST_GUARD_INPUTS.dirty).checks.find(c => c.id === "HG_FIREWALL");
    expect(check?.status).toBe("fail");
  });

  it("dirty preset: HG_DEFENDER is fail", () => {
    const check = runHostGuard(DEMO_HOST_GUARD_INPUTS.dirty).checks.find(c => c.id === "HG_DEFENDER");
    expect(check?.status).toBe("fail");
  });
});
