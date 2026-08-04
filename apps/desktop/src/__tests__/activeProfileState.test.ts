import { describe, it, expect } from "vitest";
import {
  activeProfileReducer,
  INITIAL_ACTIVE_PROFILE_STATE,
  shouldPublishActiveProfile,
  type ActiveProfileState,
} from "../lib/activeProfileState";
import type { Profile, ValidationResult } from "../lib/types";

const PROFILE_A: Profile = {
  name: "lab-alpha",
  mode: "lab",
  transport: "lab",
  allowed_targets: ["10.0.0.0/24"],
};

const PROFILE_B: Profile = {
  name: "lab-beta",
  mode: "lab",
  transport: "lab",
  allowed_targets: ["10.0.1.0/24"],
};

describe("activeProfileReducer", () => {
  it("initial state has no active profile", () => {
    expect(INITIAL_ACTIVE_PROFILE_STATE.activeProfile).toBeNull();
  });

  it("SET makes a valid profile active", () => {
    const result = activeProfileReducer(INITIAL_ACTIVE_PROFILE_STATE, {
      type: "SET",
      profile: PROFILE_A,
    });
    expect(result.activeProfile).toEqual(PROFILE_A);
  });

  it("SET replaces the current active profile with another", () => {
    const afterFirst = activeProfileReducer(INITIAL_ACTIVE_PROFILE_STATE, {
      type: "SET",
      profile: PROFILE_A,
    });
    const afterSecond = activeProfileReducer(afterFirst, {
      type: "SET",
      profile: PROFILE_B,
    });
    expect(afterSecond.activeProfile).toEqual(PROFILE_B);
  });

  it("CLEAR is explicit and deterministic — always yields no active profile", () => {
    const withActive: ActiveProfileState = { activeProfile: PROFILE_A };
    const result = activeProfileReducer(withActive, { type: "CLEAR" });
    expect(result.activeProfile).toBeNull();
  });

  it("CLEAR on an already-empty state stays empty", () => {
    const result = activeProfileReducer(INITIAL_ACTIVE_PROFILE_STATE, { type: "CLEAR" });
    expect(result.activeProfile).toBeNull();
  });
});

describe("shouldPublishActiveProfile", () => {
  it("returns false when no validation has run yet", () => {
    expect(shouldPublishActiveProfile(null)).toBe(false);
  });

  it("returns false for a failed validation", () => {
    const failed: ValidationResult = { valid: false, errors: ["name must not be empty"] };
    expect(shouldPublishActiveProfile(failed)).toBe(false);
  });

  it("returns true only for a successful validation", () => {
    const passed: ValidationResult = { valid: true, errors: [] };
    expect(shouldPublishActiveProfile(passed)).toBe(true);
  });
});
