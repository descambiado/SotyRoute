import { describe, it, expect } from "vitest";
import { buildBofaExportPayload, renderBofaExportJson } from "../lib/sotyBofaExport";
import { buildBofaGateDecision } from "../lib/sotyBofaGate";
import type { SotyEvidenceSnapshot } from "../types/sotyEvidence";
import type { RoutePack } from "../types/routePack";
import type { SotyScore } from "../types/sotyScore";

const FIXED_TS = "2026-06-17T12:00:00.000Z";

const SNAPSHOT: SotyEvidenceSnapshot = {
  id: "test-snap-id-001",
  generated_at: FIXED_TS,
  schema_version: "1",
  source: "soty_dashboard",
  operator_label: null,
  demo_mode: true,
  demo_preset: "ready",
  soty_score: {
    overall_score: 85,
    state: "SOTY_READY",
    route_score: 90,
    host_score: 85,
    scope_score: 80,
    intel_score: 75,
    evidence_score: 85,
    deductions_count: 2,
    blocking_deductions_count: 0,
  },
  route_pack: {
    id: "bofa_route",
    name: "BOFA Route",
    evidence_level: "full",
    bofa_integration_mode: "enabled",
    safety_warnings_count: 1,
  },
  route_card: null,
  host_guard: null,
  osint: {
    resources_total: 10,
    low_risk_count: 6,
    medium_risk_count: 3,
    high_risk_count: 1,
    blocked_count: 0,
    opened_resources: [],
  },
  warnings: ["Host tunneling not detected"],
  recommended_fixes: ["Enable VPN kill switch"],
  limitations: ["Demo mode — no real checks performed"],
  redaction: {
    query_content_logged: false,
    external_page_content_logged: false,
    credentials_logged: false,
    tokens_logged: false,
    cookies_logged: false,
  },
};

const SCORE: SotyScore = {
  overall_score: 85,
  state: "SOTY_READY",
  route_score: 90,
  host_score: 85,
  scope_score: 80,
  intel_score: 75,
  evidence_score: 85,
  deductions: [],
  generated_at: FIXED_TS,
  profile_name: "test",
  route_pack_id: "bofa_route",
};

const PACK: RoutePack = {
  id: "bofa_route",
  name: "BOFA Route",
  description: "BOFA authorized route",
  target_user: "operator",
  enabled_checks: [],
  required_confirmations: [],
  osint_categories: [],
  evidence_level: "full",
  bofa_integration_mode: "enabled",
  safety_warnings: [],
  default_mission_types: [],
};

function makeGate() {
  return buildBofaGateDecision(SCORE, PACK, SNAPSHOT.id, { timestamp: FIXED_TS });
}

describe("buildBofaExportPayload", () => {
  it("schema is soty_bofa_v1", () => {
    const payload = buildBofaExportPayload(makeGate(), SNAPSHOT);
    expect(payload.schema).toBe("soty_bofa_v1");
  });

  it("producer is sotyroute-desktop", () => {
    const payload = buildBofaExportPayload(makeGate(), SNAPSHOT);
    expect(payload.producer).toBe("sotyroute-desktop");
  });

  it("contains the evidence snapshot ID", () => {
    const payload = buildBofaExportPayload(makeGate(), SNAPSHOT);
    expect(payload.evidence_snapshot_id).toBe(SNAPSHOT.id);
  });

  it("gate_decision matches verdict", () => {
    const gate = makeGate();
    const payload = buildBofaExportPayload(gate, SNAPSHOT);
    expect(payload.gate_decision).toBe(gate.verdict);
  });

  it("preflight_passed matches gate", () => {
    const gate = makeGate();
    const payload = buildBofaExportPayload(gate, SNAPSHOT);
    expect(payload.preflight_passed).toBe(gate.preflight_passed);
  });

  it("redaction.query_content_logged is false", () => {
    const payload = buildBofaExportPayload(makeGate(), SNAPSHOT);
    expect(payload.redaction.query_content_logged).toBe(false);
  });

  it("redaction.credentials_logged is false", () => {
    const payload = buildBofaExportPayload(makeGate(), SNAPSHOT);
    expect(payload.redaction.credentials_logged).toBe(false);
  });

  it("redaction.tokens_logged is false", () => {
    const payload = buildBofaExportPayload(makeGate(), SNAPSHOT);
    expect(payload.redaction.tokens_logged).toBe(false);
  });

  it("redaction.cookies_logged is false", () => {
    const payload = buildBofaExportPayload(makeGate(), SNAPSHOT);
    expect(payload.redaction.cookies_logged).toBe(false);
  });

  it("redaction.external_page_content_logged is false", () => {
    const payload = buildBofaExportPayload(makeGate(), SNAPSHOT);
    expect(payload.redaction.external_page_content_logged).toBe(false);
  });

  it("allowed_modules is non-empty for enabled pack at SOTY_READY", () => {
    const payload = buildBofaExportPayload(makeGate(), SNAPSHOT);
    expect(payload.allowed_modules.length).toBeGreaterThan(0);
  });

  it("disallowed_modules contains exploit_execution", () => {
    const payload = buildBofaExportPayload(makeGate(), SNAPSHOT);
    expect(payload.disallowed_modules).toContain("exploit_execution");
  });

  it("local_evidence_path_note is the safe literal", () => {
    const payload = buildBofaExportPayload(makeGate(), SNAPSHOT);
    expect(payload.local_evidence_path_note).toBe(
      "see soty_evidence.json in the same run directory",
    );
  });
});

const UNSAFE_KEY_PATTERNS = [
  /^query$/i,
  /password/i,
  /^token$/i,
  /^cookie$/i,
  /credential/i,
  /secret/i,
  /api_key/i,
  /response_body/i,
  /raw_html/i,
  /downloaded_content/i,
  /clipboard/i,
];

const BANNED_PHRASES = [
  "credential dump",
  "doxxing",
  "leak site",
];

describe("renderBofaExportJson", () => {
  it("produces valid JSON", () => {
    const payload = buildBofaExportPayload(makeGate(), SNAPSHOT);
    const json = renderBofaExportJson(payload);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it("contains no unsafe top-level keys", () => {
    const payload = buildBofaExportPayload(makeGate(), SNAPSHOT);
    const json = renderBofaExportJson(payload);
    const parsed = JSON.parse(json) as Record<string, unknown>;
    for (const key of Object.keys(parsed)) {
      for (const pattern of UNSAFE_KEY_PATTERNS) {
        expect(key).not.toMatch(pattern);
      }
    }
  });

  it("contains no banned phrases", () => {
    const payload = buildBofaExportPayload(makeGate(), SNAPSHOT);
    const json = renderBofaExportJson(payload);
    const lower = json.toLowerCase();
    for (const phrase of BANNED_PHRASES) {
      expect(lower).not.toContain(phrase);
    }
  });

  it("redaction block is present with all-false values", () => {
    const payload = buildBofaExportPayload(makeGate(), SNAPSHOT);
    const json = renderBofaExportJson(payload);
    const parsed = JSON.parse(json) as { redaction: Record<string, unknown> };
    expect(parsed.redaction).toBeDefined();
    for (const val of Object.values(parsed.redaction)) {
      expect(val).toBe(false);
    }
  });

  it("is deterministic for the same inputs", () => {
    const gate = buildBofaGateDecision(SCORE, PACK, SNAPSHOT.id, { timestamp: FIXED_TS });
    const payload1 = buildBofaExportPayload(gate, SNAPSHOT);
    const payload2 = buildBofaExportPayload(gate, SNAPSHOT);
    expect(renderBofaExportJson(payload1)).toBe(renderBofaExportJson(payload2));
  });
});
