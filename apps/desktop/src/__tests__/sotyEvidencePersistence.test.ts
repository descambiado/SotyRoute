import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildEvidenceSnapshot } from "../lib/sotyEvidenceBuilder";
import { renderEvidenceJson } from "../lib/sotyEvidenceJson";
import { renderEvidenceMarkdown } from "../lib/sotyEvidenceMarkdown";
import { DEMO_PRESETS } from "../lib/sotyDemoInput";
import { UNSAFE_FIELD_PATTERNS, SAFE_FIELD_EXCEPTIONS } from "../lib/sotyEvidenceRedaction";

// ─── Tauri mock ───────────────────────────────────────────────────────────────

const mockInvoke = vi.fn();
vi.mock("@tauri-apps/api/tauri", () => ({ invoke: mockInvoke }));

// Import after mock registration.
const { saveEvidenceSnapshot } = await import("../lib/sotyEvidencePersistence");

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_TS = "2026-06-17T12:00:00.000Z";
const SCORE = DEMO_PRESETS["ready"];

function baseSnapshot() {
  return buildEvidenceSnapshot(SCORE, null, null, null, { timestamp: FIXED_TS });
}

const MOCK_SAVE_RESULT = {
  directory: "C:\\Users\\operator\\.sotyroute\\runs\\20260617-120000_soty",
  json_filename: "soty_evidence.json",
  md_filename: "soty_evidence.md",
  generated_at: FIXED_TS,
};

// ─── Invoke payload shape ─────────────────────────────────────────────────────

describe("saveEvidenceSnapshot — invoke payload", () => {
  beforeEach(() => {
    mockInvoke.mockClear();
    mockInvoke.mockResolvedValue(MOCK_SAVE_RESULT);
  });

  it("calls save_soty_evidence command", async () => {
    await saveEvidenceSnapshot(baseSnapshot());
    expect(mockInvoke).toHaveBeenCalledWith(
      "save_soty_evidence",
      expect.objectContaining({ jsonContent: expect.any(String), mdContent: expect.any(String) })
    );
  });

  it("sends rendered JSON matching renderEvidenceJson", async () => {
    const snap = baseSnapshot();
    await saveEvidenceSnapshot(snap);
    const call = mockInvoke.mock.calls[0][1] as { jsonContent: string };
    expect(call.jsonContent).toBe(renderEvidenceJson(snap));
  });

  it("sends rendered Markdown matching renderEvidenceMarkdown", async () => {
    const snap = baseSnapshot();
    await saveEvidenceSnapshot(snap);
    const call = mockInvoke.mock.calls[0][1] as { mdContent: string };
    expect(call.mdContent).toBe(renderEvidenceMarkdown(snap));
  });

  it("does not pass a path argument (no user-controlled path)", async () => {
    await saveEvidenceSnapshot(baseSnapshot());
    const args = mockInvoke.mock.calls[0][1] as Record<string, unknown>;
    expect(args).not.toHaveProperty("path");
    expect(args).not.toHaveProperty("directory");
    expect(args).not.toHaveProperty("outputPath");
  });
});

// ─── JSON payload safety ──────────────────────────────────────────────────────

describe("saveEvidenceSnapshot — JSON payload safety", () => {
  beforeEach(() => {
    mockInvoke.mockClear();
    mockInvoke.mockResolvedValue(MOCK_SAVE_RESULT);
  });

  it("JSON payload contains no unsafe keys", async () => {
    const snap = baseSnapshot();
    await saveEvidenceSnapshot(snap);
    const call = mockInvoke.mock.calls[0][1] as { jsonContent: string };
    const parsed = JSON.parse(call.jsonContent) as Record<string, unknown>;

    function collectKeys(obj: unknown, found: string[] = []): string[] {
      if (obj && typeof obj === "object" && !Array.isArray(obj)) {
        for (const k of Object.keys(obj as Record<string, unknown>)) {
          found.push(k);
          collectKeys((obj as Record<string, unknown>)[k], found);
        }
      } else if (Array.isArray(obj)) {
        for (const item of obj) collectKeys(item, found);
      }
      return found;
    }

    const allKeys = collectKeys(parsed);
    for (const key of allKeys) {
      if (SAFE_FIELD_EXCEPTIONS.has(key)) continue;
      for (const re of UNSAFE_FIELD_PATTERNS) {
        expect(re.test(key), `key "${key}" matches unsafe pattern ${re}`).toBe(false);
      }
    }
  });

  it("JSON payload does not contain literal password values", async () => {
    const snap = baseSnapshot();
    await saveEvidenceSnapshot(snap);
    const call = mockInvoke.mock.calls[0][1] as { jsonContent: string };
    expect(call.jsonContent).not.toMatch(/"password"\s*:/i);
    expect(call.jsonContent).not.toMatch(/"api_key"\s*:/i);
    expect(call.jsonContent).not.toMatch(/"secret"\s*:/i);
  });

  it("JSON payload redaction section has all-false values", async () => {
    const snap = baseSnapshot();
    await saveEvidenceSnapshot(snap);
    const call = mockInvoke.mock.calls[0][1] as { jsonContent: string };
    const parsed = JSON.parse(call.jsonContent) as {
      redaction: Record<string, unknown>;
    };
    for (const [, v] of Object.entries(parsed.redaction)) {
      expect(v).toBe(false);
    }
  });

  it("Markdown payload contains required safety copy", async () => {
    const snap = baseSnapshot();
    await saveEvidenceSnapshot(snap);
    const call = mockInvoke.mock.calls[0][1] as { mdContent: string };
    expect(call.mdContent).toContain("does not contain query content");
    expect(call.mdContent).toContain("External page contents are not logged");
    expect(call.mdContent).toContain("Credentials, tokens and cookies are not logged");
  });
});

// ─── Success path ─────────────────────────────────────────────────────────────

describe("saveEvidenceSnapshot — success path", () => {
  beforeEach(() => {
    mockInvoke.mockClear();
    mockInvoke.mockResolvedValue(MOCK_SAVE_RESULT);
  });

  it("returns status saved", async () => {
    const outcome = await saveEvidenceSnapshot(baseSnapshot());
    expect(outcome.status).toBe("saved");
  });

  it("returns null error on success", async () => {
    const outcome = await saveEvidenceSnapshot(baseSnapshot());
    expect(outcome.error).toBeNull();
  });

  it("returns the result from Tauri", async () => {
    const outcome = await saveEvidenceSnapshot(baseSnapshot());
    expect(outcome.result).toEqual(MOCK_SAVE_RESULT);
  });

  it("result has fixed json_filename", async () => {
    const outcome = await saveEvidenceSnapshot(baseSnapshot());
    expect(outcome.result?.json_filename).toBe("soty_evidence.json");
  });

  it("result has fixed md_filename", async () => {
    const outcome = await saveEvidenceSnapshot(baseSnapshot());
    expect(outcome.result?.md_filename).toBe("soty_evidence.md");
  });

  it("result has directory string", async () => {
    const outcome = await saveEvidenceSnapshot(baseSnapshot());
    expect(typeof outcome.result?.directory).toBe("string");
    expect(outcome.result!.directory.length).toBeGreaterThan(0);
  });
});

// ─── Error path ───────────────────────────────────────────────────────────────

describe("saveEvidenceSnapshot — error path", () => {
  it("returns status error when invoke throws", async () => {
    mockInvoke.mockRejectedValue(new Error("disk full"));
    const outcome = await saveEvidenceSnapshot(baseSnapshot());
    expect(outcome.status).toBe("error");
  });

  it("returns null result on error", async () => {
    mockInvoke.mockRejectedValue(new Error("disk full"));
    const outcome = await saveEvidenceSnapshot(baseSnapshot());
    expect(outcome.result).toBeNull();
  });

  it("returns error message string", async () => {
    mockInvoke.mockRejectedValue(new Error("disk full"));
    const outcome = await saveEvidenceSnapshot(baseSnapshot());
    expect(outcome.error).toContain("disk full");
  });

  it("returns error on string rejection", async () => {
    mockInvoke.mockRejectedValue("path traversal rejected");
    const outcome = await saveEvidenceSnapshot(baseSnapshot());
    expect(outcome.status).toBe("error");
    expect(outcome.error).toContain("path traversal rejected");
  });
});
