/**
 * Tests for PR 4 demo presets.
 *
 * Verifies that each preset produces the expected SotyState and that
 * the computed scores are structurally valid. Pure unit tests — no DOM,
 * no I/O, no side-effects.
 */
import { describe, it, expect } from "vitest";
import { DEMO_PRESETS, DEMO_PRESET_KEYS } from "../lib/sotyDemoInput";
import { SOTY_STATES } from "../types/sotyScore";

// ─── State assertions ─────────────────────────────────────────────────────────

describe("DEMO_PRESETS — expected states", () => {
  it("ready preset produces SOTY_READY", () => {
    expect(DEMO_PRESETS.ready.state).toBe("SOTY_READY");
  });

  it("warn preset produces SOTY_WARN", () => {
    expect(DEMO_PRESETS.warn.state).toBe("SOTY_WARN");
  });

  it("exposed preset produces SOTY_EXPOSED", () => {
    expect(DEMO_PRESETS.exposed.state).toBe("SOTY_EXPOSED");
  });

  it("blocked preset produces SOTY_BLOCKED", () => {
    expect(DEMO_PRESETS.blocked.state).toBe("SOTY_BLOCKED");
  });
});

// ─── Score range ──────────────────────────────────────────────────────────────

describe("DEMO_PRESETS — score validity", () => {
  it("all presets have overall_score in [0, 100]", () => {
    for (const key of DEMO_PRESET_KEYS) {
      const { overall_score } = DEMO_PRESETS[key];
      expect(overall_score, `${key}: overall_score`).toBeGreaterThanOrEqual(0);
      expect(overall_score, `${key}: overall_score`).toBeLessThanOrEqual(100);
    }
  });

  it("all sub-scores are in [0, 100]", () => {
    const sub = ["route_score", "host_score", "scope_score", "intel_score", "evidence_score"] as const;
    for (const key of DEMO_PRESET_KEYS) {
      for (const field of sub) {
        const v = DEMO_PRESETS[key][field];
        expect(v, `${key}.${field}`).toBeGreaterThanOrEqual(0);
        expect(v, `${key}.${field}`).toBeLessThanOrEqual(100);
      }
    }
  });

  it("all preset states are valid SotyState values", () => {
    for (const key of DEMO_PRESET_KEYS) {
      expect(
        (SOTY_STATES as readonly string[]).includes(DEMO_PRESETS[key].state),
        `${key}: state is valid`
      ).toBe(true);
    }
  });
});

// ─── Deduction assertions ─────────────────────────────────────────────────────

describe("DEMO_PRESETS — deduction properties", () => {
  it("ready preset has no deductions", () => {
    expect(DEMO_PRESETS.ready.deductions).toHaveLength(0);
  });

  it("blocked preset has at least one blocking deduction", () => {
    expect(DEMO_PRESETS.blocked.deductions.some((d) => d.blocking)).toBe(true);
  });

  it("exposed preset has no blocking deductions", () => {
    expect(DEMO_PRESETS.exposed.deductions.every((d) => !d.blocking)).toBe(true);
  });

  it("warn preset has no blocking deductions", () => {
    expect(DEMO_PRESETS.warn.deductions.every((d) => !d.blocking)).toBe(true);
  });

  it("every deduction has a non-empty reason", () => {
    for (const key of DEMO_PRESET_KEYS) {
      for (const d of DEMO_PRESETS[key].deductions) {
        expect(d.reason.trim().length, `${key}: ${d.id} reason`).toBeGreaterThan(0);
      }
    }
  });

  it("every deduction has a recommended_fix with a title", () => {
    for (const key of DEMO_PRESET_KEYS) {
      for (const d of DEMO_PRESETS[key].deductions) {
        expect(
          d.recommended_fix.title.trim().length,
          `${key}: ${d.id} fix title`
        ).toBeGreaterThan(0);
      }
    }
  });
});

// ─── Route scores for state verification ─────────────────────────────────────

describe("DEMO_PRESETS — sub-score relationships", () => {
  it("exposed preset has route_score < 60 (triggers SOTY_EXPOSED)", () => {
    expect(DEMO_PRESETS.exposed.route_score).toBeLessThan(60);
  });

  it("warn preset has route_score ≥ 60 (not a route exposure)", () => {
    expect(DEMO_PRESETS.warn.route_score).toBeGreaterThanOrEqual(60);
  });

  it("warn preset has host_score ≥ 60 (not a dirty host)", () => {
    expect(DEMO_PRESETS.warn.host_score).toBeGreaterThanOrEqual(60);
  });

  it("ready preset has all sub-scores = 100", () => {
    const { ready } = DEMO_PRESETS;
    expect(ready.route_score).toBe(100);
    expect(ready.host_score).toBe(100);
    expect(ready.scope_score).toBe(100);
    expect(ready.intel_score).toBe(100);
    expect(ready.evidence_score).toBe(100);
  });
});
