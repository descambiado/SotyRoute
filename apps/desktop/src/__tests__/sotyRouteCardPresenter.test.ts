/**
 * Tests for sotyRouteCardPresenter.ts pure helper functions.
 *
 * Pure unit tests — no DOM, no React, no I/O.
 */
import { describe, it, expect } from "vitest";
import {
  missionTypeToLabel,
  missionTypeToDescription,
  recommendedRoutePackId,
  modeToLabel,
  evidenceLevelToHint,
  routeCardHasBofaRestrictions,
  routeCardBofaIsBlocked,
  routeCardBofaSummary,
} from "../lib/sotyRouteCardPresenter";
import { MISSION_TYPES } from "../types/routeCard";
import { buildRouteCard } from "../lib/sotyRouteBuilder";

const TS = "2026-01-01T00:00:00.000Z";

// ─── missionTypeToLabel ───────────────────────────────────────────────────────

describe("missionTypeToLabel", () => {
  it("returns non-empty label for every MissionType", () => {
    for (const mt of MISSION_TYPES) {
      expect(missionTypeToLabel(mt).trim().length, `${mt}: label`).toBeGreaterThan(0);
    }
  });

  it("investigate_domain → 'Investigate Domain'", () => {
    expect(missionTypeToLabel("investigate_domain")).toBe("Investigate Domain");
  });

  it("launch_bofa → 'Launch BOFA Workflow'", () => {
    expect(missionTypeToLabel("launch_bofa")).toBe("Launch BOFA Workflow");
  });

  it("defensive_workstation_check → 'Defensive Workstation Check'", () => {
    expect(missionTypeToLabel("defensive_workstation_check")).toBe(
      "Defensive Workstation Check"
    );
  });
});

// ─── missionTypeToDescription ─────────────────────────────────────────────────

describe("missionTypeToDescription", () => {
  it("returns non-empty description for every MissionType", () => {
    for (const mt of MISSION_TYPES) {
      expect(missionTypeToDescription(mt).trim().length, `${mt}: description`).toBeGreaterThan(0);
    }
  });

  it("description is different from the one-line summary", () => {
    for (const mt of MISSION_TYPES) {
      const card = buildRouteCard(mt, { timestamp: TS });
      // Summary goes into RouteCard; description is the selector UI text
      // They should not be identical (description is fuller)
      expect(missionTypeToDescription(mt)).not.toBe(card.summary);
    }
  });
});

// ─── recommendedRoutePackId ───────────────────────────────────────────────────

describe("recommendedRoutePackId", () => {
  it("investigate_domain → osint_route", () => {
    expect(recommendedRoutePackId("investigate_domain")).toBe("osint_route");
  });

  it("connect_to_lab → lab_route", () => {
    expect(recommendedRoutePackId("connect_to_lab")).toBe("lab_route");
  });

  it("launch_bofa → bofa_route", () => {
    expect(recommendedRoutePackId("launch_bofa")).toBe("bofa_route");
  });

  it("public_wifi → travel_route", () => {
    expect(recommendedRoutePackId("public_wifi")).toBe("travel_route");
  });

  it("privacy_route → privacy_route", () => {
    expect(recommendedRoutePackId("privacy_route")).toBe("privacy_route");
  });

  it("defensive_workstation_check → dirty_host_check", () => {
    expect(recommendedRoutePackId("defensive_workstation_check")).toBe("dirty_host_check");
  });

  it("returns non-empty string for every MissionType", () => {
    for (const mt of MISSION_TYPES) {
      expect(recommendedRoutePackId(mt).trim().length, `${mt}: pack id`).toBeGreaterThan(0);
    }
  });
});

// ─── modeToLabel ─────────────────────────────────────────────────────────────

describe("modeToLabel", () => {
  it("observe → 'Observe (passive)'", () => {
    expect(modeToLabel("observe")).toBe("Observe (passive)");
  });

  it("lab → 'Lab'", () => {
    expect(modeToLabel("lab")).toBe("Lab");
  });

  it("wireguard → 'WireGuard'", () => {
    expect(modeToLabel("wireguard")).toBe("WireGuard");
  });

  it("tor → 'Tor'", () => {
    expect(modeToLabel("tor")).toBe("Tor");
  });

  it("socks5 → 'SOCKS5 proxy'", () => {
    expect(modeToLabel("socks5")).toBe("SOCKS5 proxy");
  });
});

// ─── evidenceLevelToHint ─────────────────────────────────────────────────────

describe("evidenceLevelToHint", () => {
  it("returns non-empty hint for every EvidenceLevel", () => {
    const levels = ["off", "minimal", "standard", "full"] as const;
    for (const level of levels) {
      expect(evidenceLevelToHint(level).trim().length).toBeGreaterThan(0);
    }
  });

  it("'full' hint mentions complete record or all targets", () => {
    const hint = evidenceLevelToHint("full").toLowerCase();
    expect(hint.includes("full") || hint.includes("complete") || hint.includes("all")).toBe(true);
  });

  it("'off' hint indicates evidence is disabled", () => {
    const hint = evidenceLevelToHint("off").toLowerCase();
    expect(hint).toContain("disabled");
  });

  it("'minimal' hint indicates minimal or metadata only", () => {
    const hint = evidenceLevelToHint("minimal").toLowerCase();
    expect(hint.includes("minimal") || hint.includes("metadata")).toBe(true);
  });
});

// ─── BOFA status helpers ──────────────────────────────────────────────────────

describe("routeCardHasBofaRestrictions", () => {
  it("returns true when disallowed_modules is non-empty", () => {
    const card = buildRouteCard("investigate_domain", { timestamp: TS });
    // investigate_domain has disallowed modules
    expect(routeCardHasBofaRestrictions(card)).toBe(true);
  });

  it("returns false when disallowed_modules is empty", () => {
    // Construct a minimal card with no disallowed modules
    const card = buildRouteCard("investigate_domain", { timestamp: TS });
    const fakeCard = { ...card, bofa_disallowed_modules: [] };
    expect(routeCardHasBofaRestrictions(fakeCard)).toBe(false);
  });
});

describe("routeCardBofaIsBlocked", () => {
  it("public_wifi card → BOFA is blocked", () => {
    const card = buildRouteCard("public_wifi", { timestamp: TS });
    expect(routeCardBofaIsBlocked(card)).toBe(true);
  });

  it("investigate_domain card → BOFA is not fully blocked (has allowed modules)", () => {
    const card = buildRouteCard("investigate_domain", { timestamp: TS });
    expect(routeCardBofaIsBlocked(card)).toBe(false);
  });

  it("returns false when both arrays are empty", () => {
    const card = buildRouteCard("investigate_domain", { timestamp: TS });
    const fakeCard = { ...card, bofa_allowed_modules: [], bofa_disallowed_modules: [] };
    expect(routeCardBofaIsBlocked(fakeCard)).toBe(false);
  });
});

describe("routeCardBofaSummary", () => {
  it("returns 'blocked' summary for public_wifi", () => {
    const card = buildRouteCard("public_wifi", { timestamp: TS });
    expect(routeCardBofaSummary(card).toLowerCase()).toContain("blocked");
  });

  it("returns a count summary when some modules are allowed and some blocked", () => {
    const card = buildRouteCard("investigate_domain", { timestamp: TS });
    const summary = routeCardBofaSummary(card);
    expect(summary.length).toBeGreaterThan(0);
  });

  it("returns non-empty summary for every mission", () => {
    for (const mt of MISSION_TYPES) {
      const card = buildRouteCard(mt, { timestamp: TS });
      expect(routeCardBofaSummary(card).trim().length).toBeGreaterThan(0);
    }
  });
});
