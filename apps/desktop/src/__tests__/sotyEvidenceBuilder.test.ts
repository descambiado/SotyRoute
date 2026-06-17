import { describe, it, expect } from "vitest";
import { buildEvidenceSnapshot } from "../lib/sotyEvidenceBuilder";
import { DEMO_PRESETS } from "../lib/sotyDemoInput";
import { DEFAULT_ROUTE_PACKS } from "../lib/routePackDefaults";
import { buildRouteCard } from "../lib/sotyRouteBuilder";
import { runHostGuard, DEMO_HOST_GUARD_INPUTS } from "../lib/sotyHostGuardEngine";
import { OSINT_CATALOG } from "../lib/osintCatalog";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_TS = "2026-06-17T12:00:00.000Z";
const SCORE_READY = DEMO_PRESETS["ready"];
const SCORE_WARN = DEMO_PRESETS["warn"];
const SCORE_BLOCKED = DEMO_PRESETS["blocked"];
const PACK = DEFAULT_ROUTE_PACKS[0]; // student_route
const CARD = buildRouteCard("investigate_domain");
const HOST_GUARD = runHostGuard(DEMO_HOST_GUARD_INPUTS["ready"]);

function base() {
  return buildEvidenceSnapshot(SCORE_READY, null, null, null, { timestamp: FIXED_TS });
}

// ─── Snapshot shape ───────────────────────────────────────────────────────────

describe("buildEvidenceSnapshot — shape", () => {
  it("returns schema_version 1", () => {
    expect(base().schema_version).toBe("1");
  });

  it("sets source to soty_dashboard", () => {
    expect(base().source).toBe("soty_dashboard");
  });

  it("sets demo_mode to true", () => {
    expect(base().demo_mode).toBe(true);
  });

  it("sets generated_at to provided timestamp", () => {
    expect(base().generated_at).toBe(FIXED_TS);
  });

  it("generates a non-empty id", () => {
    expect(base().id.length).toBeGreaterThan(0);
  });

  it("sets operator_label to null when not provided", () => {
    expect(base().operator_label).toBeNull();
  });

  it("sets operator_label when provided", () => {
    const s = buildEvidenceSnapshot(SCORE_READY, null, null, null, {
      timestamp: FIXED_TS,
      operatorLabel: "lab-session-1",
    });
    expect(s.operator_label).toBe("lab-session-1");
  });

  it("sets demo_preset when provided", () => {
    const s = buildEvidenceSnapshot(SCORE_READY, null, null, null, {
      timestamp: FIXED_TS,
      demoPreset: "ready",
    });
    expect(s.demo_preset).toBe("ready");
  });
});

// ─── SOTY Score summary ───────────────────────────────────────────────────────

describe("buildEvidenceSnapshot — soty_score", () => {
  it("includes overall_score from the score object", () => {
    expect(base().soty_score.overall_score).toBe(SCORE_READY.overall_score);
  });

  it("includes state from the score object", () => {
    expect(base().soty_score.state).toBe("SOTY_READY");
  });

  it("includes route_score", () => {
    expect(base().soty_score.route_score).toBe(SCORE_READY.route_score);
  });

  it("includes host_score", () => {
    expect(base().soty_score.host_score).toBe(SCORE_READY.host_score);
  });

  it("includes scope_score", () => {
    expect(base().soty_score.scope_score).toBe(SCORE_READY.scope_score);
  });

  it("includes intel_score", () => {
    expect(base().soty_score.intel_score).toBe(SCORE_READY.intel_score);
  });

  it("includes evidence_score", () => {
    expect(base().soty_score.evidence_score).toBe(SCORE_READY.evidence_score);
  });

  it("counts total deductions", () => {
    const s = buildEvidenceSnapshot(SCORE_WARN, null, null, null, { timestamp: FIXED_TS });
    expect(s.soty_score.deductions_count).toBe(SCORE_WARN.deductions.length);
  });

  it("counts blocking deductions separately", () => {
    const blocking = SCORE_BLOCKED.deductions.filter((d) => d.blocking).length;
    const s = buildEvidenceSnapshot(SCORE_BLOCKED, null, null, null, { timestamp: FIXED_TS });
    expect(s.soty_score.blocking_deductions_count).toBe(blocking);
  });
});

// ─── Route Pack ───────────────────────────────────────────────────────────────

describe("buildEvidenceSnapshot — route_pack", () => {
  it("is null when no pack provided", () => {
    expect(base().route_pack).toBeNull();
  });

  it("includes pack id and name when provided", () => {
    const s = buildEvidenceSnapshot(SCORE_READY, PACK, null, null, { timestamp: FIXED_TS });
    expect(s.route_pack?.id).toBe(PACK.id);
    expect(s.route_pack?.name).toBe(PACK.name);
  });

  it("includes evidence_level", () => {
    const s = buildEvidenceSnapshot(SCORE_READY, PACK, null, null, { timestamp: FIXED_TS });
    expect(s.route_pack?.evidence_level).toBe(PACK.evidence_level);
  });

  it("includes bofa_integration_mode", () => {
    const s = buildEvidenceSnapshot(SCORE_READY, PACK, null, null, { timestamp: FIXED_TS });
    expect(s.route_pack?.bofa_integration_mode).toBe(PACK.bofa_integration_mode);
  });

  it("includes safety_warnings_count", () => {
    const s = buildEvidenceSnapshot(SCORE_READY, PACK, null, null, { timestamp: FIXED_TS });
    expect(s.route_pack?.safety_warnings_count).toBe(PACK.safety_warnings.length);
  });
});

// ─── Route Card ───────────────────────────────────────────────────────────────

describe("buildEvidenceSnapshot — route_card", () => {
  it("is null when no card provided", () => {
    expect(base().route_card).toBeNull();
  });

  it("includes card mission_type when provided", () => {
    const s = buildEvidenceSnapshot(SCORE_READY, null, CARD, null, { timestamp: FIXED_TS });
    expect(s.route_card?.mission_type).toBe(CARD.mission_type);
  });

  it("includes card title", () => {
    const s = buildEvidenceSnapshot(SCORE_READY, null, CARD, null, { timestamp: FIXED_TS });
    expect(s.route_card?.title).toBe(CARD.title);
  });

  it("includes risk_warnings_count not raw array", () => {
    const s = buildEvidenceSnapshot(SCORE_READY, null, CARD, null, { timestamp: FIXED_TS });
    expect(typeof s.route_card?.risk_warnings_count).toBe("number");
    expect(s.route_card?.risk_warnings_count).toBe(CARD.risk_warnings.length);
  });

  it("includes bofa_allowed_modules_count", () => {
    const s = buildEvidenceSnapshot(SCORE_READY, null, CARD, null, { timestamp: FIXED_TS });
    expect(s.route_card?.bofa_allowed_modules_count).toBe(CARD.bofa_allowed_modules.length);
  });

  it("includes bofa_disallowed_modules_count", () => {
    const s = buildEvidenceSnapshot(SCORE_READY, null, CARD, null, { timestamp: FIXED_TS });
    expect(s.route_card?.bofa_disallowed_modules_count).toBe(CARD.bofa_disallowed_modules.length);
  });
});

// ─── Host Guard ───────────────────────────────────────────────────────────────

describe("buildEvidenceSnapshot — host_guard", () => {
  it("is null when not provided", () => {
    expect(base().host_guard).toBeNull();
  });

  it("includes status when provided", () => {
    const s = buildEvidenceSnapshot(SCORE_READY, null, null, HOST_GUARD, { timestamp: FIXED_TS });
    expect(s.host_guard?.status).toBe(HOST_GUARD.overall);
  });

  it("includes checks_count", () => {
    const s = buildEvidenceSnapshot(SCORE_READY, null, null, HOST_GUARD, { timestamp: FIXED_TS });
    expect(s.host_guard?.checks_count).toBe(HOST_GUARD.checks.length);
  });

  it("sets demo_mode to true", () => {
    const s = buildEvidenceSnapshot(SCORE_READY, null, null, HOST_GUARD, { timestamp: FIXED_TS });
    expect(s.host_guard?.demo_mode).toBe(true);
  });

  it("sets source to demo", () => {
    const s = buildEvidenceSnapshot(SCORE_READY, null, null, HOST_GUARD, { timestamp: FIXED_TS });
    expect(s.host_guard?.source).toBe("demo");
  });
});

// ─── OSINT summary ────────────────────────────────────────────────────────────

describe("buildEvidenceSnapshot — osint", () => {
  it("reports correct resources_total from catalog", () => {
    expect(base().osint.resources_total).toBe(OSINT_CATALOG.length);
  });

  it("reports correct low_risk_count", () => {
    const expected = OSINT_CATALOG.filter((r) => r.risk === "low").length;
    expect(base().osint.low_risk_count).toBe(expected);
  });

  it("reports correct medium_risk_count", () => {
    const expected = OSINT_CATALOG.filter((r) => r.risk === "medium").length;
    expect(base().osint.medium_risk_count).toBe(expected);
  });

  it("reports correct high_risk_count", () => {
    const expected = OSINT_CATALOG.filter((r) => r.risk === "high").length;
    expect(base().osint.high_risk_count).toBe(expected);
  });

  it("reports correct blocked_count", () => {
    const expected = OSINT_CATALOG.filter((r) => r.risk === "blocked").length;
    expect(base().osint.blocked_count).toBe(expected);
  });

  it("opened_resources is an empty array by default", () => {
    expect(base().osint.opened_resources).toEqual([]);
  });
});

// ─── Redaction guarantees ─────────────────────────────────────────────────────

describe("buildEvidenceSnapshot — redaction", () => {
  it("query_content_logged is false", () => {
    expect(base().redaction.query_content_logged).toBe(false);
  });

  it("external_page_content_logged is false", () => {
    expect(base().redaction.external_page_content_logged).toBe(false);
  });

  it("credentials_logged is false", () => {
    expect(base().redaction.credentials_logged).toBe(false);
  });

  it("tokens_logged is false", () => {
    expect(base().redaction.tokens_logged).toBe(false);
  });

  it("cookies_logged is false", () => {
    expect(base().redaction.cookies_logged).toBe(false);
  });

  it("no redaction field is true", () => {
    const r = base().redaction;
    expect(Object.values(r).every((v) => v === false)).toBe(true);
  });
});

// ─── Warnings and fixes ───────────────────────────────────────────────────────

describe("buildEvidenceSnapshot — warnings and fixes", () => {
  it("warnings is an array", () => {
    expect(Array.isArray(base().warnings)).toBe(true);
  });

  it("recommended_fixes is an array", () => {
    expect(Array.isArray(base().recommended_fixes)).toBe(true);
  });

  it("extracts warnings from high-severity deductions", () => {
    const s = buildEvidenceSnapshot(SCORE_WARN, null, null, null, { timestamp: FIXED_TS });
    expect(s.warnings.length).toBeGreaterThan(0);
  });

  it("recommended_fixes are deduplicated", () => {
    const s = buildEvidenceSnapshot(SCORE_WARN, null, null, null, { timestamp: FIXED_TS });
    const unique = new Set(s.recommended_fixes);
    expect(s.recommended_fixes.length).toBe(unique.size);
  });

  it("limitations array is non-empty", () => {
    expect(base().limitations.length).toBeGreaterThan(0);
  });
});

// ─── No unsafe keys in snapshot output ───────────────────────────────────────

const UNSAFE_KEYS = [
  "password", "token", "cookie", "secret", "api_key",
  "raw_html", "external_page_content", "clipboard_content",
  "response_body", "downloaded_content",
];

describe("buildEvidenceSnapshot — no unsafe keys", () => {
  it("snapshot JSON does not contain unsafe field names", () => {
    const json = JSON.stringify(base());
    for (const key of UNSAFE_KEYS) {
      expect(json).not.toContain(`"${key}"`);
    }
  });
});

// ─── No banned copy in snapshot ───────────────────────────────────────────────

const BANNED_COPY = [
  "doxxing", "credential dump", "bypass", "evade", "undetectable",
  "guaranteed anonymity", "unlock leaks", "stolen accounts", "carding", "fraud",
];

describe("buildEvidenceSnapshot — no banned copy", () => {
  it("snapshot JSON does not contain banned copy", () => {
    const json = JSON.stringify(base()).toLowerCase();
    for (const phrase of BANNED_COPY) {
      expect(json).not.toContain(phrase.toLowerCase());
    }
  });
});
