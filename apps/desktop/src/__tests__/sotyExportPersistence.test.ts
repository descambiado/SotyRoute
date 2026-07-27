import { vi, describe, it, expect, beforeEach } from "vitest";
import { invoke } from "@tauri-apps/api/tauri";
import { saveExports } from "../lib/sotyExportPersistence";
import { buildBofaExportPayload } from "../lib/sotyBofaExport";
import { buildSotyhubExportPayload } from "../lib/sotyHubExport";
import { buildBofaGateDecision } from "../lib/sotyBofaGate";
import type { SotyEvidenceSnapshot } from "../types/sotyEvidence";
import type { RoutePack } from "../types/routePack";
import type { SotyScore } from "../types/sotyScore";
import type { SotyExportSaveResult } from "../lib/sotyExportPersistence";

vi.mock("@tauri-apps/api/tauri", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

const FIXED_TS = "2026-06-17T12:00:00.000Z";

const SCORE: SotyScore = {
  overall_score: 85,
  state: "SOTY_READY",
  route_score: 85,
  host_score: 85,
  scope_score: 85,
  intel_score: 85,
  evidence_score: 85,
  deductions: [],
  generated_at: FIXED_TS,
  profile_name: "test",
  route_pack_id: "bofa_route",
};

const PACK: RoutePack = {
  id: "bofa_route",
  name: "BOFA Route",
  description: "test",
  target_user: "operator",
  enabled_checks: [],
  required_confirmations: [],
  osint_categories: [],
  evidence_level: "full",
  bofa_integration_mode: "enabled",
  safety_warnings: [],
  default_mission_types: [],
};

const SNAPSHOT: SotyEvidenceSnapshot = {
  id: "persist-snap-001",
  generated_at: FIXED_TS,
  schema_version: "1",
  source: "soty_dashboard",
  operator_label: null,
  demo_mode: true,
  demo_preset: "ready",
  soty_score: {
    overall_score: 85,
    state: "SOTY_READY",
    route_score: 85,
    host_score: 85,
    scope_score: 85,
    intel_score: 85,
    evidence_score: 85,
    deductions_count: 0,
    blocking_deductions_count: 0,
  },
  route_pack: {
    id: "bofa_route",
    name: "BOFA Route",
    evidence_level: "full",
    bofa_integration_mode: "enabled",
    safety_warnings_count: 0,
  },
  route_card: null,
  host_guard: null,
  osint: {
    resources_total: 5,
    low_risk_count: 5,
    medium_risk_count: 0,
    high_risk_count: 0,
    blocked_count: 0,
    opened_resources: [],
  },
  warnings: [],
  recommended_fixes: [],
  limitations: ["Demo mode"],
  redaction: {
    query_content_logged: false,
    external_page_content_logged: false,
    credentials_logged: false,
    tokens_logged: false,
    cookies_logged: false,
  },
};

const MOCK_RESULT: SotyExportSaveResult = {
  directory: "C:\\Users\\test\\.sotyroute\\runs\\20260617-120000_soty",
  bofa_filename: "bofa_export.json",
  sotyhub_filename: "sotyhub_export.json",
  generated_at: FIXED_TS,
};

describe("saveExports", () => {
  beforeEach(() => {
    mockInvoke.mockClear();
  });

  it("invokes the save_soty_exports command", async () => {
    mockInvoke.mockResolvedValueOnce(MOCK_RESULT);
    const gate = buildBofaGateDecision(SCORE, PACK, SNAPSHOT.id, { timestamp: FIXED_TS });
    const bofaPayload = buildBofaExportPayload(gate, SNAPSHOT);
    const sotyhubPayload = buildSotyhubExportPayload(gate, SNAPSHOT);
    await saveExports(bofaPayload, sotyhubPayload);
    expect(mockInvoke).toHaveBeenCalledOnce();
    expect(mockInvoke).toHaveBeenCalledWith(
      "save_soty_exports",
      expect.objectContaining({ bofaJson: expect.any(String), sotyhubJson: expect.any(String) }),
    );
  });

  it("passes bofaJson and sotyhubJson args — no path argument", async () => {
    mockInvoke.mockResolvedValueOnce(MOCK_RESULT);
    const gate = buildBofaGateDecision(SCORE, PACK, SNAPSHOT.id, { timestamp: FIXED_TS });
    const bofaPayload = buildBofaExportPayload(gate, SNAPSHOT);
    const sotyhubPayload = buildSotyhubExportPayload(gate, SNAPSHOT);
    await saveExports(bofaPayload, sotyhubPayload);
    const [, args] = mockInvoke.mock.calls[0] as [string, Record<string, unknown>];
    expect(Object.keys(args)).toEqual(expect.arrayContaining(["bofaJson", "sotyhubJson"]));
    expect(Object.keys(args)).not.toContain("path");
    expect(Object.keys(args)).not.toContain("directory");
    expect(Object.keys(args)).not.toContain("dir");
  });

  it("bofaJson arg is valid JSON", async () => {
    mockInvoke.mockResolvedValueOnce(MOCK_RESULT);
    const gate = buildBofaGateDecision(SCORE, PACK, SNAPSHOT.id, { timestamp: FIXED_TS });
    const bofaPayload = buildBofaExportPayload(gate, SNAPSHOT);
    const sotyhubPayload = buildSotyhubExportPayload(gate, SNAPSHOT);
    await saveExports(bofaPayload, sotyhubPayload);
    const [, args] = mockInvoke.mock.calls[0] as [string, Record<string, unknown>];
    expect(() => JSON.parse(args.bofaJson as string)).not.toThrow();
  });

  it("sotyhubJson arg is valid JSON", async () => {
    mockInvoke.mockResolvedValueOnce(MOCK_RESULT);
    const gate = buildBofaGateDecision(SCORE, PACK, SNAPSHOT.id, { timestamp: FIXED_TS });
    const bofaPayload = buildBofaExportPayload(gate, SNAPSHOT);
    const sotyhubPayload = buildSotyhubExportPayload(gate, SNAPSHOT);
    await saveExports(bofaPayload, sotyhubPayload);
    const [, args] = mockInvoke.mock.calls[0] as [string, Record<string, unknown>];
    expect(() => JSON.parse(args.sotyhubJson as string)).not.toThrow();
  });

  it("returns saved status on success", async () => {
    mockInvoke.mockResolvedValueOnce(MOCK_RESULT);
    const gate = buildBofaGateDecision(SCORE, PACK, SNAPSHOT.id, { timestamp: FIXED_TS });
    const outcome = await saveExports(
      buildBofaExportPayload(gate, SNAPSHOT),
      buildSotyhubExportPayload(gate, SNAPSHOT),
    );
    expect(outcome.status).toBe("saved");
    expect(outcome.result).toEqual(MOCK_RESULT);
    expect(outcome.error).toBeNull();
  });

  it("result.bofa_filename is bofa_export.json", async () => {
    mockInvoke.mockResolvedValueOnce(MOCK_RESULT);
    const gate = buildBofaGateDecision(SCORE, PACK, SNAPSHOT.id, { timestamp: FIXED_TS });
    const outcome = await saveExports(
      buildBofaExportPayload(gate, SNAPSHOT),
      buildSotyhubExportPayload(gate, SNAPSHOT),
    );
    expect(outcome.result?.bofa_filename).toBe("bofa_export.json");
  });

  it("result.sotyhub_filename is sotyhub_export.json", async () => {
    mockInvoke.mockResolvedValueOnce(MOCK_RESULT);
    const gate = buildBofaGateDecision(SCORE, PACK, SNAPSHOT.id, { timestamp: FIXED_TS });
    const outcome = await saveExports(
      buildBofaExportPayload(gate, SNAPSHOT),
      buildSotyhubExportPayload(gate, SNAPSHOT),
    );
    expect(outcome.result?.sotyhub_filename).toBe("sotyhub_export.json");
  });

  it("returns error status when invoke rejects", async () => {
    mockInvoke.mockRejectedValueOnce(new Error("filesystem error"));
    const gate = buildBofaGateDecision(SCORE, PACK, SNAPSHOT.id, { timestamp: FIXED_TS });
    const outcome = await saveExports(
      buildBofaExportPayload(gate, SNAPSHOT),
      buildSotyhubExportPayload(gate, SNAPSHOT),
    );
    expect(outcome.status).toBe("error");
    expect(outcome.result).toBeNull();
    expect(outcome.error).toContain("filesystem error");
  });

  it("error message is a string even for non-Error rejections", async () => {
    mockInvoke.mockRejectedValueOnce("raw string error");
    const gate = buildBofaGateDecision(SCORE, PACK, SNAPSHOT.id, { timestamp: FIXED_TS });
    const outcome = await saveExports(
      buildBofaExportPayload(gate, SNAPSHOT),
      buildSotyhubExportPayload(gate, SNAPSHOT),
    );
    expect(typeof outcome.error).toBe("string");
  });
});
