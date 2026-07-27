import { describe, it, expect } from "vitest";
import { computeSotyScore, type SotyScoreInput } from "../lib/sotyScoreEngine";

// ─── Fixtures ────────────────────────────────────────────────────────────────

/** Fixed timestamp so comparisons of full SotyScore objects are stable. */
const TS = "2026-01-01T00:00:00.000Z";

/**
 * A clean, fully-passing input: no deductions fire, SOTY_READY expected.
 * host_guard_available is true to avoid the info-level HOST_GUARD_UNAVAILABLE deduction.
 */
const CLEAN_INPUT: SotyScoreInput = {
  route: {
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
  },
  host: {
    os_detected: true,
    elevated: false,
    firewall_enabled: true,
    defender_enabled: true,
    suspicious_proxy_settings: false,
    suspicious_route_warning: false,
    known_tunnel_process_detected: false,
    host_guard_available: true,
  },
  scope: {
    profile_loaded: true,
    profile_valid: true,
    target_declared: true,
    target_in_allowed_scope: true,
    blocked_target_match: false,
    authorized_use_confirmed: true,
  },
  intel: {
    route_pack_selected: true,
    osint_categories_selected: true,
    high_risk_resource_enabled: false,
    blocked_resource_requested: false,
    query_logging_disabled: true,
  },
  evidence: {
    evidence_enabled: true,
    evidence_directory_ready: true,
    session_id_available: true,
    evidence_level: "full",
    bofa_export_enabled: true,
    sotyhub_export_enabled: true,
  },
  route_pack: { route_pack_id: "lab_route" },
};

// Shallow-merge helpers for concise per-category overrides
function withRoute(overrides: Partial<SotyScoreInput["route"]>): SotyScoreInput {
  return { ...CLEAN_INPUT, route: { ...CLEAN_INPUT.route, ...overrides } };
}
function withHost(overrides: Partial<SotyScoreInput["host"]>): SotyScoreInput {
  return { ...CLEAN_INPUT, host: { ...CLEAN_INPUT.host, ...overrides } };
}
function withScope(overrides: Partial<SotyScoreInput["scope"]>): SotyScoreInput {
  return { ...CLEAN_INPUT, scope: { ...CLEAN_INPUT.scope, ...overrides } };
}
function withIntel(overrides: Partial<SotyScoreInput["intel"]>): SotyScoreInput {
  return { ...CLEAN_INPUT, intel: { ...CLEAN_INPUT.intel, ...overrides } };
}
function withEvidence(
  overrides: Partial<SotyScoreInput["evidence"]>
): SotyScoreInput {
  return { ...CLEAN_INPUT, evidence: { ...CLEAN_INPUT.evidence, ...overrides } };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("computeSotyScore — clean input", () => {
  it("returns SOTY_READY with all sub-scores at 100 and no deductions", () => {
    const result = computeSotyScore(CLEAN_INPUT, { timestamp: TS });
    expect(result.state).toBe("SOTY_READY");
    expect(result.overall_score).toBe(100);
    expect(result.route_score).toBe(100);
    expect(result.host_score).toBe(100);
    expect(result.scope_score).toBe(100);
    expect(result.intel_score).toBe(100);
    expect(result.evidence_score).toBe(100);
    expect(result.deductions).toHaveLength(0);
  });

  it("embeds the provided profileName and route_pack_id", () => {
    const result = computeSotyScore(CLEAN_INPUT, {
      timestamp: TS,
      profileName: "my-lab",
    });
    expect(result.profile_name).toBe("my-lab");
    expect(result.route_pack_id).toBe("lab_route");
  });
});

describe("computeSotyScore — route score", () => {
  it("missing profile deducts tunnel-expected check even if unrelated to profile load", () => {
    // tunnel_expected true, tunnel_detected false → ROUTE_TUNNEL_MISSING −30
    const result = computeSotyScore(
      withRoute({ tunnel_detected: false, tunnel_expected: true }),
      { timestamp: TS }
    );
    expect(result.route_score).toBe(70); // 100 − 30
    expect(result.deductions.some((d) => d.id === "ROUTE_TUNNEL_MISSING")).toBe(true);
  });

  it("IPv6 leak risk creates ROUTE_IPV6_LEAK deduction (−20)", () => {
    const result = computeSotyScore(withRoute({ ipv6_leak_risk: true }), {
      timestamp: TS,
    });
    expect(result.route_score).toBe(80);
    expect(result.deductions.some((d) => d.id === "ROUTE_IPV6_LEAK")).toBe(true);
  });

  it("suspicious proxy creates ROUTE_SUSPICIOUS_PROXY deduction (−25)", () => {
    const result = computeSotyScore(withRoute({ suspicious_proxy: true }), {
      timestamp: TS,
    });
    expect(result.route_score).toBe(75);
    expect(result.deductions.some((d) => d.id === "ROUTE_SUSPICIOUS_PROXY")).toBe(
      true
    );
  });

  it("kill-switch disabled creates ROUTE_KILL_SWITCH_DISABLED deduction", () => {
    const result = computeSotyScore(
      withRoute({ kill_switch_available: true, kill_switch_enabled: false }),
      { timestamp: TS }
    );
    expect(result.deductions.some((d) => d.id === "ROUTE_KILL_SWITCH_DISABLED")).toBe(
      true
    );
    expect(result.route_score).toBe(90); // 100 − 10
  });

  it("kill-switch unavailable fires UNAVAILABLE not DISABLED", () => {
    const result = computeSotyScore(
      withRoute({ kill_switch_available: false, kill_switch_enabled: false }),
      { timestamp: TS }
    );
    expect(
      result.deductions.some((d) => d.id === "ROUTE_KILL_SWITCH_UNAVAILABLE")
    ).toBe(true);
    expect(
      result.deductions.some((d) => d.id === "ROUTE_KILL_SWITCH_DISABLED")
    ).toBe(false); // should not double-deduct
  });
});

describe("computeSotyScore — scope score", () => {
  it("missing profile reduces scope score by 40 (SCOPE_NO_PROFILE)", () => {
    const result = computeSotyScore(
      withScope({ profile_loaded: false }),
      { timestamp: TS }
    );
    expect(result.scope_score).toBe(60); // 100 − 40
    expect(result.deductions.some((d) => d.id === "SCOPE_NO_PROFILE")).toBe(true);
  });

  it("invalid profile deducts only when profile is loaded", () => {
    // loaded but invalid → SCOPE_INVALID_PROFILE −30
    const resultLoaded = computeSotyScore(
      withScope({ profile_loaded: true, profile_valid: false }),
      { timestamp: TS }
    );
    expect(resultLoaded.deductions.some((d) => d.id === "SCOPE_INVALID_PROFILE")).toBe(
      true
    );
    expect(resultLoaded.scope_score).toBe(70); // 100 − 30

    // not loaded → only SCOPE_NO_PROFILE fires, not SCOPE_INVALID_PROFILE
    const resultNotLoaded = computeSotyScore(
      withScope({ profile_loaded: false, profile_valid: false }),
      { timestamp: TS }
    );
    expect(
      resultNotLoaded.deductions.some((d) => d.id === "SCOPE_INVALID_PROFILE")
    ).toBe(false);
  });

  it("target outside allowed scope creates blocking deduction and SOTY_BLOCKED", () => {
    const result = computeSotyScore(
      withScope({ target_in_allowed_scope: false }),
      { timestamp: TS }
    );
    const blocking = result.deductions.filter((d) => d.blocking);
    expect(blocking.length).toBeGreaterThan(0);
    expect(blocking.some((d) => d.id === "SCOPE_OUT_OF_SCOPE")).toBe(true);
    expect(result.state).toBe("SOTY_BLOCKED");
  });

  it("blocked target match creates blocking deduction and SOTY_BLOCKED", () => {
    const result = computeSotyScore(
      withScope({ blocked_target_match: true }),
      { timestamp: TS }
    );
    expect(result.deductions.some((d) => d.id === "SCOPE_BLOCKED_TARGET")).toBe(true);
    expect(result.state).toBe("SOTY_BLOCKED");
  });
});

describe("computeSotyScore — host score", () => {
  it("suspicious proxy settings creates HOST_SUSPICIOUS_PROXY deduction (−20)", () => {
    const result = computeSotyScore(
      withHost({ suspicious_proxy_settings: true }),
      { timestamp: TS }
    );
    expect(result.host_score).toBe(80);
    expect(result.deductions.some((d) => d.id === "HOST_SUSPICIOUS_PROXY")).toBe(true);
  });

  it("suspicious proxy affects both route score (if set) and host score independently", () => {
    const input: SotyScoreInput = {
      ...CLEAN_INPUT,
      route: { ...CLEAN_INPUT.route, suspicious_proxy: true },
      host: { ...CLEAN_INPUT.host, suspicious_proxy_settings: true },
    };
    const result = computeSotyScore(input, { timestamp: TS });
    expect(result.route_score).toBeLessThan(100);
    expect(result.host_score).toBeLessThan(100);
    expect(result.deductions.some((d) => d.id === "ROUTE_SUSPICIOUS_PROXY")).toBe(true);
    expect(result.deductions.some((d) => d.id === "HOST_SUSPICIOUS_PROXY")).toBe(true);
  });

  it("null firewall and defender values do not trigger deductions", () => {
    const result = computeSotyScore(
      withHost({ firewall_enabled: null, defender_enabled: null }),
      { timestamp: TS }
    );
    expect(result.host_score).toBe(100);
    expect(result.deductions.filter((d) => d.category === "host")).toHaveLength(0);
  });

  it("known-disabled firewall creates HOST_FIREWALL_DISABLED (−20)", () => {
    const result = computeSotyScore(
      withHost({ firewall_enabled: false }),
      { timestamp: TS }
    );
    expect(result.deductions.some((d) => d.id === "HOST_FIREWALL_DISABLED")).toBe(true);
    expect(result.host_score).toBe(80);
  });

  it("known-disabled Defender creates HOST_DEFENDER_DISABLED (−15)", () => {
    const result = computeSotyScore(
      withHost({ defender_enabled: false }),
      { timestamp: TS }
    );
    expect(result.deductions.some((d) => d.id === "HOST_DEFENDER_DISABLED")).toBe(true);
    expect(result.host_score).toBe(85);
  });
});

describe("computeSotyScore — intel score", () => {
  it("blocked OSINT resource creates INTEL_BLOCKED_RESOURCE (blocking) and SOTY_BLOCKED", () => {
    const result = computeSotyScore(
      withIntel({ blocked_resource_requested: true }),
      { timestamp: TS }
    );
    expect(result.deductions.some((d) => d.id === "INTEL_BLOCKED_RESOURCE")).toBe(true);
    expect(result.deductions.some((d) => d.blocking)).toBe(true);
    expect(result.state).toBe("SOTY_BLOCKED");
  });
});

describe("computeSotyScore — evidence score", () => {
  it("evidence disabled reduces evidence score by 50 (EVIDENCE_DISABLED)", () => {
    const result = computeSotyScore(
      // Clean input has evidence_level: "full" — only the disabled deduction fires
      withEvidence({ evidence_enabled: false }),
      { timestamp: TS }
    );
    expect(result.evidence_score).toBe(50); // 100 − 50
    expect(result.deductions.some((d) => d.id === "EVIDENCE_DISABLED")).toBe(true);
  });

  it("evidence level minimal deducts 15 when evidence is enabled", () => {
    const result = computeSotyScore(
      withEvidence({ evidence_enabled: true, evidence_level: "minimal" }),
      { timestamp: TS }
    );
    expect(result.evidence_score).toBe(85); // 100 − 15
    expect(result.deductions.some((d) => d.id === "EVIDENCE_LEVEL_MINIMAL")).toBe(true);
  });

  it("evidence level off does not double-deduct when evidence_enabled is also false", () => {
    const result = computeSotyScore(
      withEvidence({ evidence_enabled: false, evidence_level: "off" }),
      { timestamp: TS }
    );
    // Only EVIDENCE_DISABLED fires (-50); level check is skipped when disabled
    const evidenceDeductions = result.deductions.filter(
      (d) => d.category === "evidence"
    );
    expect(evidenceDeductions.some((d) => d.id === "EVIDENCE_DISABLED")).toBe(true);
    expect(evidenceDeductions.some((d) => d.id === "EVIDENCE_LEVEL_OFF")).toBe(false);
  });
});

describe("computeSotyScore — overall scoring and state", () => {
  it("blocking deduction forces SOTY_BLOCKED even when overall score is high", () => {
    // Only scope.target_in_allowed_scope is false — everything else is clean
    // overall will be ~88 but blocking wins
    const result = computeSotyScore(
      withScope({ target_in_allowed_scope: false }),
      { timestamp: TS }
    );
    expect(result.overall_score).toBeGreaterThan(70);
    expect(result.deductions.some((d) => d.blocking)).toBe(true);
    expect(result.state).toBe("SOTY_BLOCKED");
  });

  it("all sub-scores are clamped to [0, 100] under extreme bad input", () => {
    const worst: SotyScoreInput = {
      route: {
        public_ip_detected: false,
        dns_detected: false,
        dns_matches_profile: false,
        tunnel_detected: false,
        tunnel_expected: true,
        ipv6_leak_risk: true,
        proxy_detected: true,
        suspicious_proxy: true,
        route_table_snapshot_available: false,
        kill_switch_available: false,
        kill_switch_enabled: false,
      },
      host: {
        os_detected: false,
        elevated: null,
        firewall_enabled: false,
        defender_enabled: false,
        suspicious_proxy_settings: true,
        suspicious_route_warning: true,
        known_tunnel_process_detected: false,
        host_guard_available: false,
      },
      scope: {
        profile_loaded: false,
        profile_valid: false,
        target_declared: false,
        target_in_allowed_scope: false,
        blocked_target_match: true,
        authorized_use_confirmed: false,
      },
      intel: {
        route_pack_selected: false,
        osint_categories_selected: false,
        high_risk_resource_enabled: true,
        blocked_resource_requested: true,
        query_logging_disabled: false,
      },
      evidence: {
        evidence_enabled: false,
        evidence_directory_ready: false,
        session_id_available: false,
        evidence_level: "off",
        bofa_export_enabled: false,
        sotyhub_export_enabled: false,
      },
      route_pack: { route_pack_id: null },
    };

    const result = computeSotyScore(worst, { timestamp: TS });

    for (const score of [
      result.route_score,
      result.host_score,
      result.scope_score,
      result.intel_score,
      result.evidence_score,
      result.overall_score,
    ]) {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
    // All sub-scores should floor at 0
    expect(result.route_score).toBe(0);
    expect(result.host_score).toBe(0);
    expect(result.scope_score).toBe(0);
    expect(result.intel_score).toBe(0);
    expect(result.evidence_score).toBe(0);
    expect(result.overall_score).toBe(0);
    expect(result.state).toBe("SOTY_BLOCKED");
  });

  it("weighted average is deterministic for the same input and timestamp", () => {
    const ts = "2026-06-01T12:00:00.000Z";
    const r1 = computeSotyScore(CLEAN_INPUT, { timestamp: ts });
    const r2 = computeSotyScore(CLEAN_INPUT, { timestamp: ts });
    expect(r1).toEqual(r2);
  });

  it("engine has no side effects: input object is not mutated", () => {
    const snapshot = JSON.stringify(CLEAN_INPUT);
    computeSotyScore(CLEAN_INPUT, { timestamp: TS });
    expect(JSON.stringify(CLEAN_INPUT)).toBe(snapshot);
  });
});

describe("computeSotyScore — deduction completeness", () => {
  it("every deduction in a multi-signal result has a non-empty recommended_fix", () => {
    const multiSignalInput: SotyScoreInput = {
      ...CLEAN_INPUT,
      route: { ...CLEAN_INPUT.route, ipv6_leak_risk: true, suspicious_proxy: true },
      host: { ...CLEAN_INPUT.host, suspicious_proxy_settings: true, suspicious_route_warning: true },
      evidence: { ...CLEAN_INPUT.evidence, evidence_level: "minimal" },
      intel: { ...CLEAN_INPUT.intel, high_risk_resource_enabled: true },
    };
    const result = computeSotyScore(multiSignalInput, { timestamp: TS });
    expect(result.deductions.length).toBeGreaterThan(0);
    for (const d of result.deductions) {
      expect(d.recommended_fix, `${d.id} must have a fix`).toBeDefined();
      expect(d.recommended_fix.id.trim().length, `${d.id}.fix.id must not be empty`).toBeGreaterThan(0);
      expect(d.recommended_fix.title.trim().length, `${d.id}.fix.title must not be empty`).toBeGreaterThan(0);
      expect(
        d.recommended_fix.description.trim().length,
        `${d.id}.fix.description must not be empty`
      ).toBeGreaterThan(0);
      // All fixes default to safe_to_autorun: false in this PR
      expect(d.recommended_fix.safe_to_autorun).toBe(false);
    }
  });

  it("every deduction has a non-empty reason and related_signal", () => {
    const fullInput: SotyScoreInput = {
      ...CLEAN_INPUT,
      route: {
        ...CLEAN_INPUT.route,
        public_ip_detected: false,
        dns_detected: false,
        tunnel_detected: false,
        tunnel_expected: true,
        ipv6_leak_risk: true,
        suspicious_proxy: true,
        route_table_snapshot_available: false,
        kill_switch_available: true,
        kill_switch_enabled: false,
      },
      host: {
        ...CLEAN_INPUT.host,
        firewall_enabled: false,
        defender_enabled: false,
        suspicious_proxy_settings: true,
        suspicious_route_warning: true,
        host_guard_available: false,
      },
      scope: {
        ...CLEAN_INPUT.scope,
        profile_loaded: true,
        profile_valid: false,
        target_declared: false,
        authorized_use_confirmed: false,
      },
      intel: {
        ...CLEAN_INPUT.intel,
        route_pack_selected: false,
        osint_categories_selected: false,
        high_risk_resource_enabled: true,
        query_logging_disabled: false,
      },
      evidence: {
        evidence_enabled: true,
        evidence_directory_ready: false,
        session_id_available: false,
        evidence_level: "minimal",
        bofa_export_enabled: false,
        sotyhub_export_enabled: false,
      },
    };

    const result = computeSotyScore(fullInput, { timestamp: TS });
    for (const d of result.deductions) {
      expect(d.reason.trim().length, `${d.id} has empty reason`).toBeGreaterThan(0);
      expect(
        d.related_signal.trim().length,
        `${d.id} has empty related_signal`
      ).toBeGreaterThan(0);
    }
  });
});
