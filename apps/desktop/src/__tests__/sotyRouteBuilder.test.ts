/**
 * Tests for the PR 5 deterministic Mission-to-Route Card builder.
 *
 * All tests are pure unit tests — no DOM, no I/O, no side-effects.
 * A fixed timestamp is used wherever determinism is required.
 */
import { describe, it, expect } from "vitest";
import { buildRouteCard } from "../lib/sotyRouteBuilder";
import { MISSION_TYPES } from "../types/routeCard";

const TS = "2026-01-01T00:00:00.000Z";

// ─── Every MissionType generates a valid RouteCard ────────────────────────────

describe("buildRouteCard — completeness", () => {
  it("generates a RouteCard for every MissionType", () => {
    for (const mt of MISSION_TYPES) {
      const card = buildRouteCard(mt, { timestamp: TS });
      expect(card.mission_type).toBe(mt);
      expect(card.title.length).toBeGreaterThan(0);
      expect(card.summary.length).toBeGreaterThan(0);
      expect(card.id.length).toBeGreaterThan(0);
    }
  });

  it("every RouteCard has a non-empty required_checks array", () => {
    for (const mt of MISSION_TYPES) {
      const card = buildRouteCard(mt, { timestamp: TS });
      expect(card.required_checks.length, `${mt}: required_checks`).toBeGreaterThan(0);
    }
  });

  it("every RouteCard has at least one risk warning", () => {
    for (const mt of MISSION_TYPES) {
      const card = buildRouteCard(mt, { timestamp: TS });
      expect(card.risk_warnings.length, `${mt}: risk_warnings`).toBeGreaterThan(0);
    }
  });

  it("every RouteCard has at least one scope requirement", () => {
    for (const mt of MISSION_TYPES) {
      const card = buildRouteCard(mt, { timestamp: TS });
      expect(card.scope_requirements.length, `${mt}: scope_requirements`).toBeGreaterThan(0);
    }
  });

  it("every RouteCard has at least one next safe action", () => {
    for (const mt of MISSION_TYPES) {
      const card = buildRouteCard(mt, { timestamp: TS });
      expect(card.next_safe_actions.length, `${mt}: next_safe_actions`).toBeGreaterThan(0);
    }
  });

  it("every RouteCard has a valid EvidenceLevel", () => {
    const valid = new Set(["off", "minimal", "standard", "full"]);
    for (const mt of MISSION_TYPES) {
      const card = buildRouteCard(mt, { timestamp: TS });
      expect(valid.has(card.evidence_settings), `${mt}: evidence_settings`).toBe(true);
    }
  });

  it("every RouteCard has a valid Mode", () => {
    const valid = new Set(["observe", "tor", "wireguard", "socks5", "lab"]);
    for (const mt of MISSION_TYPES) {
      const card = buildRouteCard(mt, { timestamp: TS });
      expect(valid.has(card.recommended_mode), `${mt}: recommended_mode`).toBe(true);
    }
  });
});

// ─── Determinism ──────────────────────────────────────────────────────────────

describe("buildRouteCard — determinism", () => {
  it("is deterministic for the same input", () => {
    const c1 = buildRouteCard("investigate_domain", { timestamp: TS });
    const c2 = buildRouteCard("investigate_domain", { timestamp: TS });
    expect(c1).toEqual(c2);
  });

  it("generates stable IDs for a fixed timestamp", () => {
    const c1 = buildRouteCard("analyze_ip", { timestamp: TS });
    const c2 = buildRouteCard("analyze_ip", { timestamp: TS });
    expect(c1.id).toBe(c2.id);
  });

  it("ID contains the mission type and a timestamp fragment", () => {
    const card = buildRouteCard("check_hash", { timestamp: TS });
    expect(card.id).toContain("check_hash");
    expect(card.id.startsWith("rc_")).toBe(true);
  });

  it("different missions with the same timestamp produce different IDs", () => {
    const c1 = buildRouteCard("investigate_domain", { timestamp: TS });
    const c2 = buildRouteCard("analyze_ip", { timestamp: TS });
    expect(c1.id).not.toBe(c2.id);
  });

  it("created_at matches the provided timestamp", () => {
    const card = buildRouteCard("public_wifi", { timestamp: TS });
    expect(card.created_at).toBe(TS);
  });

  it("returned arrays are independent copies (not catalog references)", () => {
    const c1 = buildRouteCard("investigate_domain", { timestamp: TS });
    const c2 = buildRouteCard("investigate_domain", { timestamp: TS });
    // Mutating one should not affect the other
    c1.required_checks.push("injected");
    expect(c2.required_checks).not.toContain("injected");
  });
});

// ─── Mission-specific behaviour ───────────────────────────────────────────────

describe("buildRouteCard — mission-specific rules", () => {
  it("launch_bofa has BOFA disallowed modules (active modules blocked)", () => {
    const card = buildRouteCard("launch_bofa", { timestamp: TS });
    expect(card.bofa_disallowed_modules.length).toBeGreaterThan(0);
  });

  it("launch_bofa has BOFA allowed modules (preflight/passive permitted)", () => {
    const card = buildRouteCard("launch_bofa", { timestamp: TS });
    expect(card.bofa_allowed_modules.length).toBeGreaterThan(0);
  });

  it("public_wifi has no allowed BOFA modules (BOFA fully blocked)", () => {
    const card = buildRouteCard("public_wifi", { timestamp: TS });
    expect(card.bofa_allowed_modules).toHaveLength(0);
  });

  it("public_wifi has disallowed BOFA modules (explicitly blocked)", () => {
    const card = buildRouteCard("public_wifi", { timestamp: TS });
    expect(card.bofa_disallowed_modules.length).toBeGreaterThan(0);
  });

  it("connect_to_lab uses lab mode", () => {
    const card = buildRouteCard("connect_to_lab", { timestamp: TS });
    expect(card.recommended_mode).toBe("lab");
  });

  it("connect_to_lab requires scope validation in scope_requirements", () => {
    const card = buildRouteCard("connect_to_lab", { timestamp: TS });
    const text = [...card.scope_requirements, ...card.required_checks].join(" ").toLowerCase();
    expect(text.includes("scope") || text.includes("authorized") || text.includes("allowed_targets")).toBe(true);
  });

  it("check_hash warns about executing unknown files", () => {
    const card = buildRouteCard("check_hash", { timestamp: TS });
    const text = card.risk_warnings.join(" ").toLowerCase();
    expect(text).toContain("execute");
  });

  it("check_hash recommends observe mode (offline hash lookup)", () => {
    const card = buildRouteCard("check_hash", { timestamp: TS });
    expect(card.recommended_mode).toBe("observe");
  });

  it("breach_exposure_self_check warns about own/authorized assets only", () => {
    const card = buildRouteCard("breach_exposure_self_check", { timestamp: TS });
    const text = [...card.risk_warnings, ...card.scope_requirements].join(" ").toLowerCase();
    expect(text.includes("own") || text.includes("authorized")).toBe(true);
  });

  it("breach_exposure_self_check has no BOFA allowed modules", () => {
    const card = buildRouteCard("breach_exposure_self_check", { timestamp: TS });
    expect(card.bofa_allowed_modules).toHaveLength(0);
  });

  it("privacy_route risk warnings disclaim anonymity guarantee", () => {
    const card = buildRouteCard("privacy_route", { timestamp: TS });
    const text = card.risk_warnings.join(" ").toLowerCase();
    expect(text).toContain("does not guarantee anonymity");
  });

  it("privacy_route uses wireguard mode", () => {
    const card = buildRouteCard("privacy_route", { timestamp: TS });
    expect(card.recommended_mode).toBe("wireguard");
  });

  it("connect_to_lab requires full evidence", () => {
    const card = buildRouteCard("connect_to_lab", { timestamp: TS });
    expect(card.evidence_settings).toBe("full");
  });

  it("launch_bofa requires full evidence", () => {
    const card = buildRouteCard("launch_bofa", { timestamp: TS });
    expect(card.evidence_settings).toBe("full");
  });

  it("public_wifi uses minimal evidence (low-footprint travel session)", () => {
    const card = buildRouteCard("public_wifi", { timestamp: TS });
    expect(card.evidence_settings).toBe("minimal");
  });

  it("defensive_workstation_check includes host in required_checks", () => {
    const card = buildRouteCard("defensive_workstation_check", { timestamp: TS });
    expect(card.required_checks).toContain("host");
  });

  it("defensive_workstation_check warns that Host Guard is not antivirus", () => {
    const card = buildRouteCard("defensive_workstation_check", { timestamp: TS });
    const text = card.risk_warnings.join(" ").toLowerCase();
    expect(text.includes("not antivirus") || text.includes("not an antivirus")).toBe(true);
  });
});

// ─── Safety audit — no unsafe wording ────────────────────────────────────────

describe("buildRouteCard — safety audit", () => {
  const UNSAFE_PHRASES = [
    "doxxing",
    "credential dump automation",
    "evasion",
    "guaranteed anonymity",
    "undetectable",
    "bypass detection",
  ];

  it("no RouteCard contains unsafe wording", () => {
    for (const mt of MISSION_TYPES) {
      const card = buildRouteCard(mt, { timestamp: TS });
      const allText = [
        card.title,
        card.summary,
        ...card.required_checks,
        ...card.recommended_resources,
        ...card.risk_warnings,
        ...card.scope_requirements,
        ...card.bofa_allowed_modules,
        ...card.bofa_disallowed_modules,
        ...card.next_safe_actions,
      ]
        .join(" ")
        .toLowerCase();

      for (const phrase of UNSAFE_PHRASES) {
        expect(allText.includes(phrase), `${mt}: must not contain "${phrase}"`).toBe(false);
      }
    }
  });
});
