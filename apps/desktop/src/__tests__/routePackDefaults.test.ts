import { describe, it, expect } from "vitest";
import { DEFAULT_ROUTE_PACKS } from "../lib/routePackDefaults";
import { EVIDENCE_LEVELS } from "../types/risk";

const EXPECTED_IDS = [
  "student_route",
  "privacy_route",
  "osint_route",
  "purple_route",
  "lab_route",
  "travel_route",
  "dirty_host_check",
  "bofa_route",
] as const;

describe("DEFAULT_ROUTE_PACKS", () => {
  it("contains all 8 expected packs", () => {
    const ids = DEFAULT_ROUTE_PACKS.map((p) => p.id);
    for (const expected of EXPECTED_IDS) {
      expect(ids).toContain(expected);
    }
    expect(DEFAULT_ROUTE_PACKS).toHaveLength(EXPECTED_IDS.length);
  });

  it("every pack has a unique id", () => {
    const ids = DEFAULT_ROUTE_PACKS.map((p) => p.id);
    expect(new Set(ids).size).toBe(DEFAULT_ROUTE_PACKS.length);
  });

  it("every pack has at least one enabled check", () => {
    for (const pack of DEFAULT_ROUTE_PACKS) {
      expect(
        pack.enabled_checks.length,
        `${pack.id} must have at least one enabled check`
      ).toBeGreaterThan(0);
    }
  });

  it("every pack has a valid evidence level", () => {
    for (const pack of DEFAULT_ROUTE_PACKS) {
      expect(
        EVIDENCE_LEVELS as readonly string[],
        `${pack.id} evidence_level "${pack.evidence_level}" is not valid`
      ).toContain(pack.evidence_level);
    }
  });

  it("every pack has a non-empty name and description", () => {
    for (const pack of DEFAULT_ROUTE_PACKS) {
      expect(pack.name.trim().length, `${pack.id} has empty name`).toBeGreaterThan(0);
      expect(
        pack.description.trim().length,
        `${pack.id} has empty description`
      ).toBeGreaterThan(0);
    }
  });

  it("bofa_route uses enabled integration mode; student_route is disabled", () => {
    const bofa = DEFAULT_ROUTE_PACKS.find((p) => p.id === "bofa_route");
    const student = DEFAULT_ROUTE_PACKS.find((p) => p.id === "student_route");
    expect(bofa?.bofa_integration_mode).toBe("enabled");
    expect(student?.bofa_integration_mode).toBe("disabled");
  });

  it("dirty_host_check has at least one safety warning about Host Guard not being an AV/EDR", () => {
    const pack = DEFAULT_ROUTE_PACKS.find((p) => p.id === "dirty_host_check");
    const hasHostGuardWarning = pack?.safety_warnings.some((w) =>
      w.toLowerCase().includes("antivirus") || w.toLowerCase().includes("edr")
    );
    expect(hasHostGuardWarning).toBe(true);
  });
});
