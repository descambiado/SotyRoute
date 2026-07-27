import { describe, it, expect } from "vitest";
import {
  determineSotyState,
  weightedOverall,
  SCORE_WEIGHTS,
  type SubScores,
} from "../lib/sotyScoreState";
import type { ScoreDeduction } from "../types/sotyScore";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PERFECT: SubScores = {
  route_score: 100,
  host_score: 100,
  scope_score: 100,
  intel_score: 100,
  evidence_score: 100,
  overall_score: 100,
};

function makeDeduction(
  overrides: Partial<ScoreDeduction>
): ScoreDeduction {
  return {
    id: "TEST",
    category: "route",
    severity: "info",
    points_lost: 10,
    reason: "Test deduction",
    recommended_fix: {
      id: "FIX_TEST",
      title: "Test fix",
      description: "Test fix description",
      action_type: "manual",
      safe_to_autorun: false,
      requires_confirmation: false,
    },
    related_signal: "test_signal",
    blocking: false,
    ...overrides,
  };
}

// ─── weightedOverall ──────────────────────────────────────────────────────────

describe("weightedOverall", () => {
  it("100/100/100/100/100 → 100", () => {
    expect(
      weightedOverall({ route_score: 100, host_score: 100, scope_score: 100, intel_score: 100, evidence_score: 100 })
    ).toBe(100);
  });

  it("0/0/0/0/0 → 0", () => {
    expect(
      weightedOverall({ route_score: 0, host_score: 0, scope_score: 0, intel_score: 0, evidence_score: 0 })
    ).toBe(0);
  });

  it("applies documented weights (route:30%, host:20%, scope:25%, intel:10%, evidence:15%)", () => {
    // Each score in isolation
    expect(
      weightedOverall({ route_score: 100, host_score: 0, scope_score: 0, intel_score: 0, evidence_score: 0 })
    ).toBe(Math.round(100 * SCORE_WEIGHTS.route)); // 30

    expect(
      weightedOverall({ route_score: 0, host_score: 100, scope_score: 0, intel_score: 0, evidence_score: 0 })
    ).toBe(Math.round(100 * SCORE_WEIGHTS.host)); // 20

    expect(
      weightedOverall({ route_score: 0, host_score: 0, scope_score: 100, intel_score: 0, evidence_score: 0 })
    ).toBe(Math.round(100 * SCORE_WEIGHTS.scope)); // 25

    expect(
      weightedOverall({ route_score: 0, host_score: 0, scope_score: 0, intel_score: 100, evidence_score: 0 })
    ).toBe(Math.round(100 * SCORE_WEIGHTS.intel)); // 10

    expect(
      weightedOverall({ route_score: 0, host_score: 0, scope_score: 0, intel_score: 0, evidence_score: 100 })
    ).toBe(Math.round(100 * SCORE_WEIGHTS.evidence)); // 15
  });

  it("weights sum to 1.0 (no score is lost in the formula)", () => {
    const sum =
      SCORE_WEIGHTS.route +
      SCORE_WEIGHTS.host +
      SCORE_WEIGHTS.scope +
      SCORE_WEIGHTS.intel +
      SCORE_WEIGHTS.evidence;
    expect(sum).toBeCloseTo(1.0, 10);
  });

  it("result is clamped to [0, 100]", () => {
    const r = weightedOverall({ route_score: 0, host_score: 0, scope_score: 0, intel_score: 0, evidence_score: 0 });
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThanOrEqual(100);
  });

  it("is deterministic for the same input", () => {
    const scores = { route_score: 72, host_score: 85, scope_score: 60, intel_score: 90, evidence_score: 80 };
    expect(weightedOverall(scores)).toBe(weightedOverall(scores));
  });
});

// ─── determineSotyState ───────────────────────────────────────────────────────

describe("determineSotyState", () => {
  it("SOTY_READY: perfect scores and no deductions", () => {
    expect(determineSotyState(PERFECT, [])).toBe("SOTY_READY");
  });

  it("SOTY_READY: overall ≥ 90 and only info/low severity deductions", () => {
    const infoDeduction = makeDeduction({ severity: "info", blocking: false });
    const lowDeduction = makeDeduction({ severity: "low", blocking: false });
    expect(determineSotyState(PERFECT, [infoDeduction])).toBe("SOTY_READY");
    expect(determineSotyState(PERFECT, [lowDeduction])).toBe("SOTY_READY");
  });

  it("not SOTY_READY when overall ≥ 90 but a high-severity deduction exists", () => {
    const highDeduction = makeDeduction({ severity: "high", blocking: false });
    const result = determineSotyState(PERFECT, [highDeduction]);
    expect(result).not.toBe("SOTY_READY");
    // With perfect scores route/host both ≥ 60 and overall ≥ 70 → SOTY_WARN
    expect(result).toBe("SOTY_WARN");
  });

  it("not SOTY_READY when overall ≥ 90 but a critical-severity deduction exists", () => {
    const critDeduction = makeDeduction({ severity: "critical", blocking: false });
    const result = determineSotyState(PERFECT, [critDeduction]);
    expect(result).not.toBe("SOTY_READY");
  });

  it("SOTY_EXPOSED: route_score < 60 (even if overall is otherwise high)", () => {
    const scores: SubScores = { ...PERFECT, route_score: 55, overall_score: 82 };
    expect(determineSotyState(scores, [])).toBe("SOTY_EXPOSED");
  });

  it("SOTY_DIRTY: host_score < 60 and route_score ≥ 60", () => {
    const scores: SubScores = { ...PERFECT, host_score: 55, route_score: 70, overall_score: 80 };
    expect(determineSotyState(scores, [])).toBe("SOTY_DIRTY");
  });

  it("SOTY_EXPOSED takes precedence over SOTY_DIRTY when route_score < 60 too", () => {
    const scores: SubScores = { ...PERFECT, route_score: 50, host_score: 50, overall_score: 70 };
    // route < 60 fires first in the precedence chain
    expect(determineSotyState(scores, [])).toBe("SOTY_EXPOSED");
  });

  it("SOTY_WARN: overall ≥ 70 and no blocking/low-route/low-host triggers", () => {
    const scores: SubScores = { ...PERFECT, overall_score: 75, route_score: 75, host_score: 75 };
    expect(determineSotyState(scores, [])).toBe("SOTY_WARN");
  });

  it("SOTY_WARN: medium-severity deductions with overall ≥ 70 and scores ≥ 60", () => {
    const mediumDeduction = makeDeduction({ severity: "medium", blocking: false });
    const scores: SubScores = { ...PERFECT, overall_score: 80, route_score: 80, host_score: 80 };
    expect(determineSotyState(scores, [mediumDeduction])).toBe("SOTY_WARN");
  });

  it("SOTY_EXPOSED (default): overall < 70 and no specific route/host trigger", () => {
    const scores: SubScores = { ...PERFECT, overall_score: 65, route_score: 70, host_score: 70 };
    expect(determineSotyState(scores, [])).toBe("SOTY_EXPOSED");
  });

  it("SOTY_BLOCKED: any blocking deduction overrides all scores", () => {
    const blockingDeduction = makeDeduction({
      id: "SCOPE_OUT_OF_SCOPE",
      severity: "critical",
      blocking: true,
    });
    // Perfect scores — blocking still wins
    expect(determineSotyState(PERFECT, [blockingDeduction])).toBe("SOTY_BLOCKED");
  });

  it("SOTY_BLOCKED: multiple blocking deductions still SOTY_BLOCKED", () => {
    const b1 = makeDeduction({ id: "B1", blocking: true });
    const b2 = makeDeduction({ id: "B2", blocking: true });
    expect(determineSotyState(PERFECT, [b1, b2])).toBe("SOTY_BLOCKED");
  });

  it("non-blocking deductions mixed with blocking → still SOTY_BLOCKED", () => {
    const blocking = makeDeduction({ blocking: true, severity: "critical" });
    const nonBlocking = makeDeduction({ blocking: false, severity: "info" });
    expect(determineSotyState(PERFECT, [blocking, nonBlocking])).toBe("SOTY_BLOCKED");
  });

  it("is deterministic for the same input", () => {
    const scores: SubScores = { ...PERFECT, overall_score: 75 };
    const d = makeDeduction({ severity: "medium" });
    expect(determineSotyState(scores, [d])).toBe(determineSotyState(scores, [d]));
  });
});
