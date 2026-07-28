import { describe, it, expect, vi, afterEach } from "vitest";
import {
  buildSotyhubExportPayload,
  renderSotyhubExportJson,
} from "../lib/sotyHubExport";
import { buildBofaGateDecision } from "../lib/sotyBofaGate";
import type { SotyEvidenceSnapshot } from "../types/sotyEvidence";
import type { RoutePack } from "../types/routePack";
import type { SotyScore } from "../types/sotyScore";

const FIXED_TS = "2026-06-17T12:00:00.000Z";

const SNAPSHOT: SotyEvidenceSnapshot = {
  id: "hub-snap-id-002",
  generated_at: FIXED_TS,
  schema_version: "1",
  source: "soty_dashboard",
  operator_label: null,
  demo_mode: true,
  demo_preset: "ready",
  soty_score: {
    overall_score: 78,
    state: "SOTY_WARN",
    route_score: 80,
    host_score: 75,
    scope_score: 85,
    intel_score: 70,
    evidence_score: 80,
    deductions_count: 3,
    blocking_deductions_count: 0,
  },
  route_pack: {
    id: "purple_route",
    name: "Purple Route",
    evidence_level: "full",
    bofa_integration_mode: "gated",
    safety_warnings_count: 2,
  },
  route_card: {
    id: "rc-001",
    mission_type: "investigate_domain",
    title: "Investigate Domain",
    recommended_mode: "observe",
    required_checks: ["dns_check"],
    risk_warnings_count: 1,
    scope_requirements: ["owned assets only"],
    bofa_allowed_modules_count: 5,
    bofa_disallowed_modules_count: 7,
    next_safe_actions: ["review warnings"],
  },
  host_guard: {
    status: "warn",
    checks_count: 4,
    warning_count: 1,
    fail_count: 0,
    demo_mode: true,
    source: "demo",
  },
  osint: {
    resources_total: 12,
    low_risk_count: 7,
    medium_risk_count: 4,
    high_risk_count: 1,
    blocked_count: 0,
    opened_resources: [],
  },
  warnings: ["Tunneling not detected"],
  recommended_fixes: ["Enable VPN kill switch"],
  limitations: ["Demo mode"],
  redaction: {
    query_content_logged: false,
    external_page_content_logged: false,
    credentials_logged: false,
    tokens_logged: false,
    cookies_logged: false,
  },
};

const SCORE: SotyScore = {
  overall_score: 78,
  state: "SOTY_WARN",
  route_score: 80,
  host_score: 75,
  scope_score: 85,
  intel_score: 70,
  evidence_score: 80,
  deductions: [],
  generated_at: FIXED_TS,
  profile_name: "test",
  route_pack_id: "purple_route",
};

const PACK: RoutePack = {
  id: "purple_route",
  name: "Purple Route",
  description: "Purple team route",
  target_user: "operator",
  enabled_checks: [],
  required_confirmations: [],
  osint_categories: [],
  evidence_level: "full",
  bofa_integration_mode: "gated",
  safety_warnings: [],
  default_mission_types: [],
};

function makeGate() {
  return buildBofaGateDecision(SCORE, PACK, SNAPSHOT.id, { timestamp: FIXED_TS });
}

describe("buildSotyhubExportPayload", () => {
  it("export_schema_version is soty_hub_v1", () => {
    const payload = buildSotyhubExportPayload(makeGate(), SNAPSHOT);
    expect(payload.export_schema_version).toBe("soty_hub_v1");
  });

  it("contains the evidence snapshot ID", () => {
    const payload = buildSotyhubExportPayload(makeGate(), SNAPSHOT);
    expect(payload.evidence_snapshot_id).toBe(SNAPSHOT.id);
  });

  it("soty_score_summary contains overall_score", () => {
    const payload = buildSotyhubExportPayload(makeGate(), SNAPSHOT);
    expect(payload.soty_score_summary.overall_score).toBe(78);
    expect(payload.soty_score_summary.state).toBe("SOTY_WARN");
  });

  it("route_pack_summary is populated when snapshot has a pack", () => {
    const payload = buildSotyhubExportPayload(makeGate(), SNAPSHOT);
    expect(payload.route_pack_summary).not.toBeNull();
    expect(payload.route_pack_summary?.id).toBe("purple_route");
  });

  it("mission_summary is populated when snapshot has a route card", () => {
    const payload = buildSotyhubExportPayload(makeGate(), SNAPSHOT);
    expect(payload.mission_summary).not.toBeNull();
    expect(payload.mission_summary?.mission_type).toBe("investigate_domain");
  });

  it("host_guard_summary contains only counts, not raw data", () => {
    const payload = buildSotyhubExportPayload(makeGate(), SNAPSHOT);
    expect(payload.host_guard_summary?.checks_count).toBe(4);
    expect(payload.host_guard_summary?.warning_count).toBe(1);
    expect(payload.host_guard_summary?.fail_count).toBe(0);
    expect(Object.keys(payload.host_guard_summary ?? {})).not.toContain("demo_mode");
    expect(Object.keys(payload.host_guard_summary ?? {})).not.toContain("source");
  });

  it("osint_summary contains only counts", () => {
    const payload = buildSotyhubExportPayload(makeGate(), SNAPSHOT);
    expect(payload.osint_summary.resources_total).toBe(12);
    expect(Object.keys(payload.osint_summary)).not.toContain("opened_resources");
  });

  it("bofa_gate_summary contains gate decision and module counts", () => {
    const gate = makeGate();
    const payload = buildSotyhubExportPayload(gate, SNAPSHOT);
    expect(payload.bofa_gate_summary.gate_decision).toBe(gate.verdict);
    expect(payload.bofa_gate_summary.preflight_passed).toBe(gate.preflight_passed);
    expect(payload.bofa_gate_summary.allowed_modules_count).toBe(gate.allowed_modules.length);
    expect(payload.bofa_gate_summary.disallowed_modules_count).toBe(gate.disallowed_modules.length);
  });

  it("never_exported list is non-empty", () => {
    const payload = buildSotyhubExportPayload(makeGate(), SNAPSHOT);
    expect(payload.never_exported.length).toBeGreaterThan(0);
  });

  it("never_exported includes query_content", () => {
    const payload = buildSotyhubExportPayload(makeGate(), SNAPSHOT);
    expect(payload.never_exported).toContain("query_content");
  });

  it("never_exported includes credentials", () => {
    const payload = buildSotyhubExportPayload(makeGate(), SNAPSHOT);
    expect(payload.never_exported).toContain("credentials");
  });

  it("limitations list is non-empty", () => {
    const payload = buildSotyhubExportPayload(makeGate(), SNAPSHOT);
    expect(payload.limitations.length).toBeGreaterThan(0);
  });

  it("redaction.query_content_logged is false", () => {
    const payload = buildSotyhubExportPayload(makeGate(), SNAPSHOT);
    expect(payload.redaction.query_content_logged).toBe(false);
  });

  it("redaction.osint_query_content_logged is false", () => {
    const payload = buildSotyhubExportPayload(makeGate(), SNAPSHOT);
    expect(payload.redaction.osint_query_content_logged).toBe(false);
  });

  it("redaction.raw_host_data_logged is false", () => {
    const payload = buildSotyhubExportPayload(makeGate(), SNAPSHOT);
    expect(payload.redaction.raw_host_data_logged).toBe(false);
  });

  it("route_pack_summary is null when snapshot has no pack", () => {
    const noPackSnapshot = { ...SNAPSHOT, route_pack: null };
    const payload = buildSotyhubExportPayload(makeGate(), noPackSnapshot);
    expect(payload.route_pack_summary).toBeNull();
  });

  it("host_guard_summary is null when snapshot has no host guard", () => {
    const noHgSnapshot = { ...SNAPSHOT, host_guard: null };
    const payload = buildSotyhubExportPayload(makeGate(), noHgSnapshot);
    expect(payload.host_guard_summary).toBeNull();
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

describe("renderSotyhubExportJson", () => {
  it("produces valid JSON", () => {
    const payload = buildSotyhubExportPayload(makeGate(), SNAPSHOT);
    const json = renderSotyhubExportJson(payload);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it("contains no unsafe top-level keys", () => {
    const payload = buildSotyhubExportPayload(makeGate(), SNAPSHOT);
    const json = renderSotyhubExportJson(payload);
    const parsed = JSON.parse(json) as Record<string, unknown>;
    for (const key of Object.keys(parsed)) {
      for (const pattern of UNSAFE_KEY_PATTERNS) {
        expect(key).not.toMatch(pattern);
      }
    }
  });

  it("contains no banned phrases", () => {
    const payload = buildSotyhubExportPayload(makeGate(), SNAPSHOT);
    const json = renderSotyhubExportJson(payload);
    const lower = json.toLowerCase();
    for (const phrase of BANNED_PHRASES) {
      expect(lower).not.toContain(phrase);
    }
  });

  it("redaction block is present with all-false values", () => {
    const payload = buildSotyhubExportPayload(makeGate(), SNAPSHOT);
    const json = renderSotyhubExportJson(payload);
    const parsed = JSON.parse(json) as { redaction: Record<string, unknown> };
    expect(parsed.redaction).toBeDefined();
    for (const val of Object.values(parsed.redaction)) {
      expect(val).toBe(false);
    }
  });

  it("osint_query_content_logged is preserved in redaction block", () => {
    const payload = buildSotyhubExportPayload(makeGate(), SNAPSHOT);
    const json = renderSotyhubExportJson(payload);
    const parsed = JSON.parse(json) as {
      redaction: Record<string, unknown>;
    };
    expect(parsed.redaction["osint_query_content_logged"]).toBe(false);
  });

  it("is deterministic for the same inputs", () => {
    // buildSotyhubExportPayload stamps its own generated_at with `new Date()`,
    // so the clock must be frozen — otherwise this flakes if the two calls
    // straddle a millisecond boundary.
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FIXED_TS));
    const gate = buildBofaGateDecision(SCORE, PACK, SNAPSHOT.id, { timestamp: FIXED_TS });
    const p1 = buildSotyhubExportPayload(gate, SNAPSHOT);
    const p2 = buildSotyhubExportPayload(gate, SNAPSHOT);
    expect(renderSotyhubExportJson(p1)).toBe(renderSotyhubExportJson(p2));
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});
