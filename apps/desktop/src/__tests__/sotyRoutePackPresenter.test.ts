/**
 * Tests for sotyRoutePackPresenter.ts pure helper functions.
 *
 * Includes a safety audit ensuring the PR 6 pack context copy does not
 * contain unsafe phrases ("anonymize", "bypass", "guarantee privacy", etc.).
 *
 * Pure unit tests — no DOM, no React, no I/O.
 */
import { describe, it, expect } from "vitest";
import {
  focusLevelToVariant,
  focusLevelToLabel,
  focusLevelToPercent,
  focusLevelToClass,
  focusCategoryToLabel,
  bofaModeToLabel,
  bofaModeToTagClass,
  packMismatchWarning,
  FOCUS_CATEGORIES,
} from "../lib/sotyRoutePackPresenter";
import { ROUTE_PACK_CONTEXTS, type ScoreFocus } from "../lib/sotyRoutePackContext";
import { DEFAULT_ROUTE_PACKS } from "../lib/routePackDefaults";
import { buildRouteCard } from "../lib/sotyRouteBuilder";

const TS = "2026-01-01T00:00:00.000Z";

// ─── focusLevelToVariant ──────────────────────────────────────────────────────

describe("focusLevelToVariant", () => {
  it("'high' → 'ok'", () => {
    expect(focusLevelToVariant("high")).toBe("ok");
  });

  it("'medium' → 'warn'", () => {
    expect(focusLevelToVariant("medium")).toBe("warn");
  });

  it("'low' → 'idle'", () => {
    expect(focusLevelToVariant("low")).toBe("idle");
  });
});

// ─── focusLevelToLabel ────────────────────────────────────────────────────────

describe("focusLevelToLabel", () => {
  it("'high' → 'High'", () => {
    expect(focusLevelToLabel("high")).toBe("High");
  });

  it("'medium' → 'Medium'", () => {
    expect(focusLevelToLabel("medium")).toBe("Medium");
  });

  it("'low' → 'Low'", () => {
    expect(focusLevelToLabel("low")).toBe("Low");
  });
});

// ─── focusLevelToPercent ──────────────────────────────────────────────────────

describe("focusLevelToPercent", () => {
  it("'high' returns 88 (leaves visible gap)", () => {
    expect(focusLevelToPercent("high")).toBe(88);
  });

  it("'medium' returns 55", () => {
    expect(focusLevelToPercent("medium")).toBe(55);
  });

  it("'low' returns 22", () => {
    expect(focusLevelToPercent("low")).toBe(22);
  });

  it("all values are in (0, 100]", () => {
    for (const level of ["low", "medium", "high"] as const) {
      const pct = focusLevelToPercent(level);
      expect(pct).toBeGreaterThan(0);
      expect(pct).toBeLessThanOrEqual(100);
    }
  });

  it("high > medium > low", () => {
    expect(focusLevelToPercent("high")).toBeGreaterThan(focusLevelToPercent("medium"));
    expect(focusLevelToPercent("medium")).toBeGreaterThan(focusLevelToPercent("low"));
  });
});

// ─── focusLevelToClass ────────────────────────────────────────────────────────

describe("focusLevelToClass", () => {
  it("returns the level string as-is (matches CSS class names)", () => {
    expect(focusLevelToClass("low")).toBe("low");
    expect(focusLevelToClass("medium")).toBe("medium");
    expect(focusLevelToClass("high")).toBe("high");
  });
});

// ─── focusCategoryToLabel ─────────────────────────────────────────────────────

describe("focusCategoryToLabel", () => {
  it("route_focus → 'Route'", () => {
    expect(focusCategoryToLabel("route_focus")).toBe("Route");
  });

  it("host_focus → 'Host'", () => {
    expect(focusCategoryToLabel("host_focus")).toBe("Host");
  });

  it("scope_focus → 'Scope'", () => {
    expect(focusCategoryToLabel("scope_focus")).toBe("Scope");
  });

  it("intel_focus → 'Intel'", () => {
    expect(focusCategoryToLabel("intel_focus")).toBe("Intel");
  });

  it("evidence_focus → 'Evidence'", () => {
    expect(focusCategoryToLabel("evidence_focus")).toBe("Evidence");
  });
});

// ─── FOCUS_CATEGORIES ────────────────────────────────────────────────────────

describe("FOCUS_CATEGORIES", () => {
  it("has exactly 5 entries", () => {
    expect(FOCUS_CATEGORIES.length).toBe(5);
  });

  it("covers all ScoreFocus keys", () => {
    const expected: (keyof ScoreFocus)[] = [
      "route_focus",
      "host_focus",
      "scope_focus",
      "intel_focus",
      "evidence_focus",
    ];
    for (const cat of expected) {
      expect((FOCUS_CATEGORIES as readonly string[]).includes(cat)).toBe(true);
    }
  });
});

// ─── bofaModeToLabel ──────────────────────────────────────────────────────────

describe("bofaModeToLabel", () => {
  it("'disabled' → 'BOFA Disabled'", () => {
    expect(bofaModeToLabel("disabled")).toBe("BOFA Disabled");
  });

  it("'gated' → 'BOFA Gated'", () => {
    expect(bofaModeToLabel("gated")).toBe("BOFA Gated");
  });

  it("'enabled' → 'BOFA Enabled (gated)'", () => {
    expect(bofaModeToLabel("enabled")).toBe("BOFA Enabled (gated)");
  });

  it("label for 'enabled' clarifies it is still gated", () => {
    expect(bofaModeToLabel("enabled").toLowerCase()).toContain("gated");
  });
});

// ─── bofaModeToTagClass ───────────────────────────────────────────────────────

describe("bofaModeToTagClass", () => {
  it("'disabled' returns empty string (neutral tag)", () => {
    expect(bofaModeToTagClass("disabled")).toBe("");
  });

  it("'gated' returns 'resource'", () => {
    expect(bofaModeToTagClass("gated")).toBe("resource");
  });

  it("'enabled' returns 'allowed'", () => {
    expect(bofaModeToTagClass("enabled")).toBe("allowed");
  });
});

// ─── packMismatchWarning ──────────────────────────────────────────────────────

describe("packMismatchWarning", () => {
  it("returns null when packs match", () => {
    const card = buildRouteCard("connect_to_lab", { timestamp: TS });
    expect(packMismatchWarning(card, "lab_route", DEFAULT_ROUTE_PACKS)).toBeNull();
  });

  it("returns a string when packs differ", () => {
    const card = buildRouteCard("connect_to_lab", { timestamp: TS });
    const w = packMismatchWarning(card, "osint_route", DEFAULT_ROUTE_PACKS);
    expect(w).not.toBeNull();
    expect(typeof w).toBe("string");
    expect(w!.length).toBeGreaterThan(0);
  });

  it("mismatch message contains the recommended pack name", () => {
    const card = buildRouteCard("connect_to_lab", { timestamp: TS });
    const w = packMismatchWarning(card, "osint_route", DEFAULT_ROUTE_PACKS);
    expect(w!.toLowerCase()).toContain("lab route");
  });

  it("mismatch message contains the selected pack name", () => {
    const card = buildRouteCard("connect_to_lab", { timestamp: TS });
    const w = packMismatchWarning(card, "osint_route", DEFAULT_ROUTE_PACKS);
    expect(w!.toLowerCase()).toContain("osint route");
  });

  it("returns null for all missions when the matching pack is selected", () => {
    const MISSION_PACK_MAP: Record<string, string> = {
      investigate_domain: "osint_route",
      analyze_ip: "osint_route",
      check_hash: "purple_route",
      open_osint_sources: "osint_route",
      connect_to_lab: "lab_route",
      launch_bofa: "bofa_route",
      public_wifi: "travel_route",
      breach_exposure_self_check: "privacy_route",
      privacy_route: "privacy_route",
      defensive_workstation_check: "dirty_host_check",
    };
    for (const [mt, packId] of Object.entries(MISSION_PACK_MAP)) {
      const card = buildRouteCard(mt as never, { timestamp: TS });
      expect(
        packMismatchWarning(card, packId, DEFAULT_ROUTE_PACKS),
        `${mt} / ${packId}: expected null (matching pack)`
      ).toBeNull();
    }
  });
});

// ─── PR 6 copy safety audit ───────────────────────────────────────────────────

const UNSAFE_PHRASES = [
  "anonymize",
  "bypass",
  "undetectable",
  "evade",
  "clean malware",
  "guarantee privacy",
  "launch attack",
  "doxxing",
  "credential dump automation",
  "evasion",
  "guaranteed anonymity",
  "bypass detection",
] as const;

describe("PR 6 pack context copy safety audit", () => {
  it("what_this_route_improves does not contain unsafe phrases", () => {
    for (const [id, ctx] of Object.entries(ROUTE_PACK_CONTEXTS)) {
      const text = ctx.what_this_route_improves.join(" ").toLowerCase();
      for (const phrase of UNSAFE_PHRASES) {
        expect(
          text.includes(phrase),
          `${id} (what_improves): must not contain "${phrase}"`
        ).toBe(false);
      }
    }
  });

  it("what_this_route_does_not_do does not contain unsafe phrases", () => {
    for (const [id, ctx] of Object.entries(ROUTE_PACK_CONTEXTS)) {
      const text = ctx.what_this_route_does_not_do.join(" ").toLowerCase();
      for (const phrase of UNSAFE_PHRASES) {
        expect(
          text.includes(phrase),
          `${id} (what_doesnt): must not contain "${phrase}"`
        ).toBe(false);
      }
    }
  });

  it("no context copy claims to guarantee anonymity", () => {
    for (const [id, ctx] of Object.entries(ROUTE_PACK_CONTEXTS)) {
      const all = [
        ...ctx.what_this_route_improves,
        ...ctx.what_this_route_does_not_do,
      ]
        .join(" ")
        .toLowerCase();
      expect(
        all.includes("guaranteed anonymity") || all.includes("guarantee anonymity"),
        `${id}: must not claim guaranteed anonymity`
      ).toBe(false);
    }
  });
});
