/**
 * Tests for sotyRoutePackContext.ts, sotyRoutePackScoring.ts,
 * and the DIRTY demo preset added in PR 6.
 *
 * Pure unit tests — no DOM, no React, no I/O.
 */
import { describe, it, expect } from "vitest";
import {
  ROUTE_PACK_CONTEXTS,
  getPackContext,
  type ScoreFocus,
  type FocusLevel,
} from "../lib/sotyRoutePackContext";
import {
  getPackDemoPreset,
  getPackScoreFocus,
  focusLevelForCategory,
} from "../lib/sotyRoutePackScoring";
import { packMismatchWarning } from "../lib/sotyRoutePackPresenter";
import { MISSION_TYPES } from "../types/routeCard";
import { DEFAULT_ROUTE_PACKS } from "../lib/routePackDefaults";
import { buildRouteCard } from "../lib/sotyRouteBuilder";
import {
  DEMO_PRESETS,
  DEMO_PRESET_KEYS,
} from "../lib/sotyDemoInput";

const TS = "2026-01-01T00:00:00.000Z";

const ALL_PACK_IDS = DEFAULT_ROUTE_PACKS.map((p) => p.id);

const FOCUS_CATS: (keyof ScoreFocus)[] = [
  "route_focus",
  "host_focus",
  "scope_focus",
  "intel_focus",
  "evidence_focus",
];

const VALID_FOCUS_LEVELS: FocusLevel[] = ["low", "medium", "high"];

const VALID_PRESET_KEYS = [...DEMO_PRESET_KEYS];

// ─── DIRTY demo preset (PR 6 addition) ───────────────────────────────────────

describe("DIRTY demo preset", () => {
  it("DEMO_PRESET_KEYS includes 'dirty'", () => {
    expect(DEMO_PRESET_KEYS).toContain("dirty");
  });

  it("dirty preset produces SOTY_DIRTY state", () => {
    expect(DEMO_PRESETS.dirty.state).toBe("SOTY_DIRTY");
  });

  it("dirty preset has host_score < 60", () => {
    expect(DEMO_PRESETS.dirty.host_score).toBeLessThan(60);
  });

  it("dirty preset has route_score >= 60", () => {
    expect(DEMO_PRESETS.dirty.route_score).toBeGreaterThanOrEqual(60);
  });

  it("dirty preset has no blocking deductions", () => {
    const blocking = DEMO_PRESETS.dirty.deductions.filter((d) => d.blocking);
    expect(blocking.length).toBe(0);
  });

  it("dirty preset has at least one high-severity deduction", () => {
    const high = DEMO_PRESETS.dirty.deductions.filter((d) => d.severity === "high");
    expect(high.length).toBeGreaterThan(0);
  });

  it("dirty preset overall_score is in [0, 100]", () => {
    expect(DEMO_PRESETS.dirty.overall_score).toBeGreaterThanOrEqual(0);
    expect(DEMO_PRESETS.dirty.overall_score).toBeLessThanOrEqual(100);
  });

  it("dirty preset profile_name is 'dirty-host'", () => {
    expect(DEMO_PRESETS.dirty.profile_name).toBe("dirty-host");
  });
});

// ─── ROUTE_PACK_CONTEXTS coverage ────────────────────────────────────────────

describe("ROUTE_PACK_CONTEXTS catalog", () => {
  it("has an entry for every DEFAULT_ROUTE_PACK id", () => {
    for (const id of ALL_PACK_IDS) {
      expect(
        ROUTE_PACK_CONTEXTS[id],
        `missing context for pack "${id}"`
      ).toBeDefined();
    }
  });

  it("every context has the correct pack_id", () => {
    for (const id of ALL_PACK_IDS) {
      expect(ROUTE_PACK_CONTEXTS[id].pack_id).toBe(id);
    }
  });

  it("every context has at least one compatible mission", () => {
    for (const id of ALL_PACK_IDS) {
      expect(
        ROUTE_PACK_CONTEXTS[id].compatible_missions.length,
        `${id}: no compatible missions`
      ).toBeGreaterThan(0);
    }
  });

  it("all compatible missions are valid MissionType values", () => {
    for (const id of ALL_PACK_IDS) {
      for (const mt of ROUTE_PACK_CONTEXTS[id].compatible_missions) {
        expect(
          (MISSION_TYPES as readonly string[]).includes(mt),
          `${id}: "${mt}" is not a valid MissionType`
        ).toBe(true);
      }
    }
  });

  it("every context has all five score focus areas", () => {
    for (const id of ALL_PACK_IDS) {
      const focus = ROUTE_PACK_CONTEXTS[id].score_focus;
      for (const cat of FOCUS_CATS) {
        expect(focus[cat], `${id}: missing ${cat}`).toBeDefined();
        expect(
          VALID_FOCUS_LEVELS.includes(focus[cat]),
          `${id}.${cat} = "${focus[cat]}" is not a valid FocusLevel`
        ).toBe(true);
      }
    }
  });

  it("every context has a valid demo_preset", () => {
    for (const id of ALL_PACK_IDS) {
      expect(
        VALID_PRESET_KEYS.includes(ROUTE_PACK_CONTEXTS[id].demo_preset as never),
        `${id}: demo_preset "${ROUTE_PACK_CONTEXTS[id].demo_preset}" is not valid`
      ).toBe(true);
    }
  });

  it("every context has non-empty what_this_route_improves", () => {
    for (const id of ALL_PACK_IDS) {
      expect(
        ROUTE_PACK_CONTEXTS[id].what_this_route_improves.length,
        `${id}: empty what_this_route_improves`
      ).toBeGreaterThan(0);
    }
  });

  it("every context has non-empty what_this_route_does_not_do", () => {
    for (const id of ALL_PACK_IDS) {
      expect(
        ROUTE_PACK_CONTEXTS[id].what_this_route_does_not_do.length,
        `${id}: empty what_this_route_does_not_do`
      ).toBeGreaterThan(0);
    }
  });
});

// ─── getPackContext ───────────────────────────────────────────────────────────

describe("getPackContext", () => {
  it("returns the correct context for a known pack", () => {
    const ctx = getPackContext("lab_route");
    expect(ctx).not.toBeNull();
    expect(ctx?.pack_id).toBe("lab_route");
  });

  it("returns null for an unknown pack id", () => {
    expect(getPackContext("nonexistent_pack")).toBeNull();
  });

  it("is deterministic — same input yields same output", () => {
    const ctx1 = getPackContext("osint_route");
    const ctx2 = getPackContext("osint_route");
    expect(ctx1).toEqual(ctx2);
  });
});

// ─── getPackDemoPreset ────────────────────────────────────────────────────────

describe("getPackDemoPreset", () => {
  it("lab_route → 'blocked'", () => {
    expect(getPackDemoPreset("lab_route")).toBe("blocked");
  });

  it("bofa_route → 'blocked'", () => {
    expect(getPackDemoPreset("bofa_route")).toBe("blocked");
  });

  it("travel_route → 'exposed'", () => {
    expect(getPackDemoPreset("travel_route")).toBe("exposed");
  });

  it("dirty_host_check → 'dirty'", () => {
    expect(getPackDemoPreset("dirty_host_check")).toBe("dirty");
  });

  it("returns a valid preset key for every default pack", () => {
    for (const id of ALL_PACK_IDS) {
      const preset = getPackDemoPreset(id);
      expect(
        VALID_PRESET_KEYS.includes(preset as never),
        `${id}: getPackDemoPreset returned invalid preset "${preset}"`
      ).toBe(true);
    }
  });

  it("returns 'warn' fallback for an unknown pack id", () => {
    expect(getPackDemoPreset("unknown_pack_xyz")).toBe("warn");
  });
});

// ─── getPackScoreFocus ────────────────────────────────────────────────────────

describe("getPackScoreFocus", () => {
  it("dirty_host_check has high host_focus", () => {
    expect(getPackScoreFocus("dirty_host_check").host_focus).toBe("high");
  });

  it("dirty_host_check has low scope_focus", () => {
    expect(getPackScoreFocus("dirty_host_check").scope_focus).toBe("low");
  });

  it("privacy_route has high route_focus", () => {
    expect(getPackScoreFocus("privacy_route").route_focus).toBe("high");
  });

  it("purple_route has high evidence_focus", () => {
    expect(getPackScoreFocus("purple_route").evidence_focus).toBe("high");
  });

  it("returns an object with all five focus areas for every pack", () => {
    for (const id of ALL_PACK_IDS) {
      const focus = getPackScoreFocus(id);
      expect(FOCUS_CATS.every((c) => focus[c] !== undefined)).toBe(true);
    }
  });
});

// ─── focusLevelForCategory ────────────────────────────────────────────────────

describe("focusLevelForCategory", () => {
  it("dirty_host_check / host_focus → 'high'", () => {
    expect(focusLevelForCategory("dirty_host_check", "host_focus")).toBe("high");
  });

  it("student_route / host_focus → 'low'", () => {
    expect(focusLevelForCategory("student_route", "host_focus")).toBe("low");
  });

  it("lab_route / route_focus → 'high'", () => {
    expect(focusLevelForCategory("lab_route", "route_focus")).toBe("high");
  });

  it("returns 'medium' fallback for an unknown pack id", () => {
    expect(focusLevelForCategory("nonexistent", "route_focus")).toBe("medium");
  });
});

// ─── Compatible mission → Route Card ─────────────────────────────────────────

describe("compatible missions produce Route Cards", () => {
  it("can build a Route Card for every compatible mission in every pack", () => {
    for (const id of ALL_PACK_IDS) {
      for (const mt of ROUTE_PACK_CONTEXTS[id].compatible_missions) {
        const card = buildRouteCard(mt, { timestamp: TS });
        expect(card.mission_type).toBe(mt);
        expect(card.id.startsWith("rc_")).toBe(true);
        expect(card.id.length).toBeGreaterThan(10);
      }
    }
  });
});

// ─── Pack mismatch warning ────────────────────────────────────────────────────

describe("packMismatchWarning", () => {
  it("returns a warning when the mission recommends a different pack", () => {
    // connect_to_lab recommends lab_route; selecting osint_route should warn
    const card = buildRouteCard("connect_to_lab", { timestamp: TS });
    const warning = packMismatchWarning(card, "osint_route", DEFAULT_ROUTE_PACKS);
    expect(warning).not.toBeNull();
    expect(typeof warning).toBe("string");
    expect(warning!.length).toBeGreaterThan(0);
  });

  it("returns null when the mission pack matches the selected pack", () => {
    // connect_to_lab recommends lab_route — selecting lab_route → no mismatch
    const card = buildRouteCard("connect_to_lab", { timestamp: TS });
    const warning = packMismatchWarning(card, "lab_route", DEFAULT_ROUTE_PACKS);
    expect(warning).toBeNull();
  });

  it("mismatch message includes the recommended pack name", () => {
    const card = buildRouteCard("connect_to_lab", { timestamp: TS });
    const warning = packMismatchWarning(card, "student_route", DEFAULT_ROUTE_PACKS);
    // Lab Route is recommended; message should mention it
    expect(warning?.toLowerCase()).toMatch(/lab route/);
  });

  it("returns null for launch_bofa when bofa_route is selected", () => {
    const card = buildRouteCard("launch_bofa", { timestamp: TS });
    expect(packMismatchWarning(card, "bofa_route", DEFAULT_ROUTE_PACKS)).toBeNull();
  });

  it("returns a warning for public_wifi when privacy_route is selected", () => {
    // public_wifi recommends travel_route; selecting privacy_route should warn
    const card = buildRouteCard("public_wifi", { timestamp: TS });
    const warning = packMismatchWarning(card, "privacy_route", DEFAULT_ROUTE_PACKS);
    expect(warning).not.toBeNull();
    expect(warning!.toLowerCase()).toContain("travel route");
  });
});
