import { describe, it, expect } from "vitest";
import {
  createEmptySotyScore,
  SCORE_RANGE,
  SUB_SCORE_FIELDS,
} from "../lib/sotyScoreDefaults";
import { SOTY_STATES } from "../types/sotyScore";
import { EVIDENCE_LEVELS, RISK_LEVELS } from "../types/risk";

describe("SOTY_STATES", () => {
  it("contains all five expected states", () => {
    expect(SOTY_STATES).toContain("SOTY_READY");
    expect(SOTY_STATES).toContain("SOTY_WARN");
    expect(SOTY_STATES).toContain("SOTY_EXPOSED");
    expect(SOTY_STATES).toContain("SOTY_DIRTY");
    expect(SOTY_STATES).toContain("SOTY_BLOCKED");
    expect(SOTY_STATES).toHaveLength(5);
  });
});

describe("EVIDENCE_LEVELS", () => {
  it("contains all expected evidence levels", () => {
    expect(EVIDENCE_LEVELS).toContain("off");
    expect(EVIDENCE_LEVELS).toContain("minimal");
    expect(EVIDENCE_LEVELS).toContain("standard");
    expect(EVIDENCE_LEVELS).toContain("full");
    expect(EVIDENCE_LEVELS).toHaveLength(4);
  });
});

describe("RISK_LEVELS", () => {
  it("contains all expected risk levels", () => {
    expect(RISK_LEVELS).toContain("low");
    expect(RISK_LEVELS).toContain("medium");
    expect(RISK_LEVELS).toContain("high");
    expect(RISK_LEVELS).toContain("blocked");
    expect(RISK_LEVELS).toHaveLength(4);
  });
});

describe("createEmptySotyScore", () => {
  it("returns an object with all required score fields", () => {
    const score = createEmptySotyScore();
    expect(score).toHaveProperty("route_score");
    expect(score).toHaveProperty("host_score");
    expect(score).toHaveProperty("scope_score");
    expect(score).toHaveProperty("intel_score");
    expect(score).toHaveProperty("evidence_score");
    expect(score).toHaveProperty("overall_score");
    expect(score).toHaveProperty("state");
    expect(score).toHaveProperty("deductions");
    expect(score).toHaveProperty("generated_at");
  });

  it("all sub-score values are within 0–100", () => {
    const score = createEmptySotyScore();
    for (const field of SUB_SCORE_FIELDS) {
      const value = score[field] as number;
      expect(value, `${field} must be >= ${SCORE_RANGE.min}`).toBeGreaterThanOrEqual(
        SCORE_RANGE.min
      );
      expect(value, `${field} must be <= ${SCORE_RANGE.max}`).toBeLessThanOrEqual(
        SCORE_RANGE.max
      );
    }
    expect(score.overall_score).toBeGreaterThanOrEqual(SCORE_RANGE.min);
    expect(score.overall_score).toBeLessThanOrEqual(SCORE_RANGE.max);
  });

  it("state is a valid SotyState", () => {
    const score = createEmptySotyScore();
    expect(SOTY_STATES as readonly string[]).toContain(score.state);
  });

  it("unassessed score is fail-closed (SOTY_BLOCKED)", () => {
    const score = createEmptySotyScore();
    expect(score.state).toBe("SOTY_BLOCKED");
  });

  it("deductions array is empty for an unassessed score", () => {
    const score = createEmptySotyScore();
    expect(score.deductions).toHaveLength(0);
  });

  it("accepts optional profileName and routePackId", () => {
    const score = createEmptySotyScore("my-profile", "lab_route");
    expect(score.profile_name).toBe("my-profile");
    expect(score.route_pack_id).toBe("lab_route");
  });

  it("defaults profile_name and route_pack_id to null", () => {
    const score = createEmptySotyScore();
    expect(score.profile_name).toBeNull();
    expect(score.route_pack_id).toBeNull();
  });

  it("SOTY_BLOCKED state can be represented without side effects", () => {
    const base = createEmptySotyScore();
    const blocked = { ...base, state: "SOTY_BLOCKED" as const };
    expect(blocked.state).toBe("SOTY_BLOCKED");
    expect(base.state).toBe("SOTY_BLOCKED");
  });

  it("all SotyStates can be assigned to the state field without error", () => {
    const base = createEmptySotyScore();
    for (const state of SOTY_STATES) {
      const withState = { ...base, state };
      expect(withState.state).toBe(state);
    }
  });
});
