import { describe, it, expect } from "vitest";
import { buildBofaGateDecision } from "../lib/sotyBofaGate";
import { BOFA_DISALLOWED_MODULES } from "../types/bofaGate";
import type { SotyScore } from "../types/sotyScore";
import type { RoutePack } from "../types/routePack";

const FIXED_TS = "2026-06-17T12:00:00.000Z";

function makeScore(state: SotyScore["state"]): SotyScore {
  return {
    overall_score: state === "SOTY_READY" ? 85 : state === "SOTY_WARN" ? 65 : 40,
    state,
    route_score: 80,
    host_score: 80,
    scope_score: 80,
    intel_score: 80,
    evidence_score: 80,
    deductions: [],
    generated_at: FIXED_TS,
    profile_name: "test",
    route_pack_id: null,
  };
}

function makePack(mode: RoutePack["bofa_integration_mode"]): RoutePack {
  return {
    id: `${mode}_pack`,
    name: `${mode} pack`,
    description: "test",
    target_user: "operator",
    enabled_checks: [],
    required_confirmations: [],
    osint_categories: [],
    evidence_level: mode === "enabled" ? "full" : "standard",
    bofa_integration_mode: mode,
    safety_warnings: [],
    default_mission_types: [],
  };
}

describe("buildBofaGateDecision", () => {
  it("returns blocked when no route pack provided", () => {
    const gate = buildBofaGateDecision(makeScore("SOTY_READY"), null, null, {
      timestamp: FIXED_TS,
    });
    expect(gate.verdict).toBe("blocked");
    expect(gate.blocked).toBe(true);
    expect(gate.allowed).toBe(false);
    expect(gate.warn).toBe(false);
  });

  it("returns blocked when pack integration mode is disabled", () => {
    const gate = buildBofaGateDecision(
      makeScore("SOTY_READY"),
      makePack("disabled"),
      null,
      { timestamp: FIXED_TS },
    );
    expect(gate.verdict).toBe("blocked");
    expect(gate.blocking_reasons.length).toBeGreaterThan(0);
  });

  it("returns blocked for SOTY_BLOCKED state", () => {
    const gate = buildBofaGateDecision(makeScore("SOTY_BLOCKED"), makePack("gated"), null, {
      timestamp: FIXED_TS,
    });
    expect(gate.verdict).toBe("blocked");
    expect(gate.blocking_reasons.some((r) => r.includes("SOTY_BLOCKED"))).toBe(true);
  });

  it("returns blocked for SOTY_EXPOSED state", () => {
    const gate = buildBofaGateDecision(makeScore("SOTY_EXPOSED"), makePack("gated"), null, {
      timestamp: FIXED_TS,
    });
    expect(gate.verdict).toBe("blocked");
    expect(gate.blocking_reasons.some((r) => r.includes("SOTY_EXPOSED"))).toBe(true);
  });

  it("returns blocked for SOTY_DIRTY state", () => {
    const gate = buildBofaGateDecision(makeScore("SOTY_DIRTY"), makePack("gated"), null, {
      timestamp: FIXED_TS,
    });
    expect(gate.verdict).toBe("blocked");
    expect(gate.blocking_reasons.some((r) => r.includes("SOTY_DIRTY"))).toBe(true);
  });

  it("returns warning for SOTY_WARN with gated pack", () => {
    const gate = buildBofaGateDecision(makeScore("SOTY_WARN"), makePack("gated"), null, {
      timestamp: FIXED_TS,
    });
    expect(gate.verdict).toBe("warning");
    expect(gate.warn).toBe(true);
    expect(gate.warning_reasons.length).toBeGreaterThan(0);
  });

  it("returns allowed for SOTY_READY with gated pack", () => {
    const gate = buildBofaGateDecision(makeScore("SOTY_READY"), makePack("gated"), null, {
      timestamp: FIXED_TS,
    });
    expect(gate.verdict).toBe("allowed");
    expect(gate.allowed).toBe(true);
    expect(gate.preflight_passed).toBe(true);
  });

  it("returns allowed for SOTY_READY with enabled pack", () => {
    const gate = buildBofaGateDecision(
      makeScore("SOTY_READY"),
      makePack("enabled"),
      null,
      { timestamp: FIXED_TS },
    );
    expect(gate.verdict).toBe("allowed");
    expect(gate.preflight_passed).toBe(true);
  });

  it("returns warning for SOTY_WARN with enabled pack", () => {
    const gate = buildBofaGateDecision(makeScore("SOTY_WARN"), makePack("enabled"), null, {
      timestamp: FIXED_TS,
    });
    expect(gate.verdict).toBe("warning");
  });

  it("disallowed_modules always includes all 7 unsafe categories", () => {
    for (const state of ["SOTY_READY", "SOTY_WARN", "SOTY_BLOCKED"] as const) {
      const gate = buildBofaGateDecision(makeScore(state), makePack("enabled"), null, {
        timestamp: FIXED_TS,
      });
      expect(gate.disallowed_modules).toEqual(BOFA_DISALLOWED_MODULES);
    }
  });

  it("allowed_modules never includes exploit_execution", () => {
    const gate = buildBofaGateDecision(makeScore("SOTY_READY"), makePack("enabled"), null, {
      timestamp: FIXED_TS,
    });
    expect(gate.allowed_modules).not.toContain("exploit_execution");
  });

  it("allowed_modules never includes credential_access", () => {
    const gate = buildBofaGateDecision(makeScore("SOTY_READY"), makePack("enabled"), null, {
      timestamp: FIXED_TS,
    });
    expect(gate.allowed_modules).not.toContain("credential_access");
  });

  it("allowed_modules never includes persistence", () => {
    const gate = buildBofaGateDecision(makeScore("SOTY_READY"), makePack("enabled"), null, {
      timestamp: FIXED_TS,
    });
    expect(gate.allowed_modules).not.toContain("persistence");
  });

  it("allowed_modules never includes lateral_movement", () => {
    const gate = buildBofaGateDecision(makeScore("SOTY_READY"), makePack("enabled"), null, {
      timestamp: FIXED_TS,
    });
    expect(gate.allowed_modules).not.toContain("lateral_movement");
  });

  it("allowed_modules never includes evasion", () => {
    const gate = buildBofaGateDecision(makeScore("SOTY_READY"), makePack("enabled"), null, {
      timestamp: FIXED_TS,
    });
    expect(gate.allowed_modules).not.toContain("evasion");
  });

  it("allowed_modules never includes destructive_actions", () => {
    const gate = buildBofaGateDecision(makeScore("SOTY_READY"), makePack("enabled"), null, {
      timestamp: FIXED_TS,
    });
    expect(gate.allowed_modules).not.toContain("destructive_actions");
  });

  it("allowed_modules never includes unauthorized_scanning", () => {
    const gate = buildBofaGateDecision(makeScore("SOTY_READY"), makePack("enabled"), null, {
      timestamp: FIXED_TS,
    });
    expect(gate.allowed_modules).not.toContain("unauthorized_scanning");
  });

  it("disabled pack has empty allowed_modules", () => {
    const gate = buildBofaGateDecision(makeScore("SOTY_READY"), makePack("disabled"), null, {
      timestamp: FIXED_TS,
    });
    expect(gate.allowed_modules).toHaveLength(0);
  });

  it("gated pack includes evidence_review in allowed_modules when verdict is allowed", () => {
    const gate = buildBofaGateDecision(makeScore("SOTY_READY"), makePack("gated"), null, {
      timestamp: FIXED_TS,
    });
    expect(gate.allowed_modules).toContain("evidence_review");
  });

  it("blocked verdict always has empty allowed_modules", () => {
    const gate = buildBofaGateDecision(makeScore("SOTY_BLOCKED"), makePack("enabled"), null, {
      timestamp: FIXED_TS,
    });
    expect(gate.allowed_modules).toHaveLength(0);
  });

  it("includes evidence_snapshot_id from input", () => {
    const gate = buildBofaGateDecision(makeScore("SOTY_READY"), makePack("gated"), "snap-123", {
      timestamp: FIXED_TS,
    });
    expect(gate.evidence_snapshot_id).toBe("snap-123");
  });

  it("has required_preflight_checks for each verdict", () => {
    for (const [state, mode] of [
      ["SOTY_READY", "gated"],
      ["SOTY_WARN", "gated"],
      ["SOTY_BLOCKED", "gated"],
    ] as const) {
      const gate = buildBofaGateDecision(makeScore(state), makePack(mode), null, {
        timestamp: FIXED_TS,
      });
      expect(gate.required_preflight_checks.length).toBeGreaterThan(0);
    }
  });

  it("preflight_passed is true only for allowed verdict", () => {
    const ready = buildBofaGateDecision(makeScore("SOTY_READY"), makePack("gated"), null, {
      timestamp: FIXED_TS,
    });
    const warn = buildBofaGateDecision(makeScore("SOTY_WARN"), makePack("gated"), null, {
      timestamp: FIXED_TS,
    });
    const blocked = buildBofaGateDecision(
      makeScore("SOTY_BLOCKED"),
      makePack("gated"),
      null,
      { timestamp: FIXED_TS },
    );
    expect(ready.preflight_passed).toBe(true);
    expect(warn.preflight_passed).toBe(false);
    expect(blocked.preflight_passed).toBe(false);
  });

  it("uses provided timestamp in generated_at", () => {
    const gate = buildBofaGateDecision(makeScore("SOTY_READY"), makePack("gated"), null, {
      timestamp: FIXED_TS,
    });
    expect(gate.generated_at).toBe(FIXED_TS);
  });
});
