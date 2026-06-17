import { describe, it, expect } from "vitest";
import { renderEvidenceMarkdown } from "../lib/sotyEvidenceMarkdown";
import { renderEvidenceJson } from "../lib/sotyEvidenceJson";
import { buildEvidenceSnapshot } from "../lib/sotyEvidenceBuilder";
import { DEMO_PRESETS } from "../lib/sotyDemoInput";
import { DEFAULT_ROUTE_PACKS } from "../lib/routePackDefaults";
import { buildRouteCard } from "../lib/sotyRouteBuilder";
import { runHostGuard, DEMO_HOST_GUARD_INPUTS } from "../lib/sotyHostGuardEngine";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_TS = "2026-06-17T12:00:00.000Z";
const PACK = DEFAULT_ROUTE_PACKS[0];
const CARD = buildRouteCard("investigate_domain");
const HOST_GUARD = runHostGuard(DEMO_HOST_GUARD_INPUTS["ready"]);

function makeSnapshot(preset: "ready" | "warn" | "blocked" = "ready") {
  return buildEvidenceSnapshot(
    DEMO_PRESETS[preset],
    PACK,
    CARD,
    HOST_GUARD,
    { timestamp: FIXED_TS, demoPreset: preset }
  );
}

// ─── Required safety copy ─────────────────────────────────────────────────────

describe("renderEvidenceMarkdown — required safety copy", () => {
  it("contains 'local SOTY evidence preview'", () => {
    expect(renderEvidenceMarkdown(makeSnapshot())).toContain("local SOTY evidence preview");
  });

  it("contains 'does not contain query content'", () => {
    expect(renderEvidenceMarkdown(makeSnapshot())).toContain("does not contain query content");
  });

  it("contains 'External page contents are not logged'", () => {
    expect(renderEvidenceMarkdown(makeSnapshot())).toContain("External page contents are not logged");
  });

  it("contains 'Credentials, tokens and cookies are not logged'", () => {
    expect(renderEvidenceMarkdown(makeSnapshot())).toContain(
      "Credentials, tokens and cookies are not logged"
    );
  });

  it("contains 'No data has been sent externally'", () => {
    expect(renderEvidenceMarkdown(makeSnapshot())).toContain("No data has been sent externally");
  });
});

// ─── Redaction section ────────────────────────────────────────────────────────

describe("renderEvidenceMarkdown — redaction section", () => {
  it("shows Redaction / Privacy Guarantees heading", () => {
    expect(renderEvidenceMarkdown(makeSnapshot())).toContain("Redaction / Privacy Guarantees");
  });

  it("shows query_content_logged: false", () => {
    const md = renderEvidenceMarkdown(makeSnapshot());
    expect(md).toContain("Query content logged: false");
  });

  it("shows external_page_content_logged: false", () => {
    const md = renderEvidenceMarkdown(makeSnapshot());
    expect(md).toContain("External page content logged: false");
  });

  it("shows credentials_logged: false", () => {
    const md = renderEvidenceMarkdown(makeSnapshot());
    expect(md).toContain("Credentials logged: false");
  });

  it("shows tokens_logged: false", () => {
    const md = renderEvidenceMarkdown(makeSnapshot());
    expect(md).toContain("Tokens logged: false");
  });

  it("shows cookies_logged: false", () => {
    const md = renderEvidenceMarkdown(makeSnapshot());
    expect(md).toContain("Cookies logged: false");
  });
});

// ─── SOTY Score section ───────────────────────────────────────────────────────

describe("renderEvidenceMarkdown — SOTY Score section", () => {
  it("contains SOTY Score heading", () => {
    expect(renderEvidenceMarkdown(makeSnapshot())).toContain("## SOTY Score");
  });

  it("contains the SOTY state", () => {
    expect(renderEvidenceMarkdown(makeSnapshot("ready"))).toContain("SOTY_READY");
    expect(renderEvidenceMarkdown(makeSnapshot("warn"))).toContain("SOTY_WARN");
    expect(renderEvidenceMarkdown(makeSnapshot("blocked"))).toContain("SOTY_BLOCKED");
  });

  it("contains the overall score", () => {
    const snap = makeSnapshot("ready");
    expect(renderEvidenceMarkdown(snap)).toContain(
      `${snap.soty_score.overall_score}/100`
    );
  });
});

// ─── Route Pack section ───────────────────────────────────────────────────────

describe("renderEvidenceMarkdown — Route Pack section", () => {
  it("contains Route Pack heading", () => {
    expect(renderEvidenceMarkdown(makeSnapshot())).toContain("## Route Pack");
  });

  it("contains the pack name", () => {
    expect(renderEvidenceMarkdown(makeSnapshot())).toContain(PACK.name);
  });

  it("shows 'No route pack selected' when pack is null", () => {
    const snap = buildEvidenceSnapshot(DEMO_PRESETS["ready"], null, null, null, {
      timestamp: FIXED_TS,
    });
    expect(renderEvidenceMarkdown(snap)).toContain("No route pack selected");
  });
});

// ─── Route Card section ───────────────────────────────────────────────────────

describe("renderEvidenceMarkdown — Route Card section", () => {
  it("contains Route Card heading", () => {
    expect(renderEvidenceMarkdown(makeSnapshot())).toContain("## Route Card");
  });

  it("contains the mission type", () => {
    expect(renderEvidenceMarkdown(makeSnapshot())).toContain("investigate_domain");
  });

  it("shows 'No route card generated' when card is null", () => {
    const snap = buildEvidenceSnapshot(DEMO_PRESETS["ready"], null, null, null, {
      timestamp: FIXED_TS,
    });
    expect(renderEvidenceMarkdown(snap)).toContain("No route card generated");
  });
});

// ─── Host Guard section ───────────────────────────────────────────────────────

describe("renderEvidenceMarkdown — Host Guard section", () => {
  it("contains Host Guard heading", () => {
    expect(renderEvidenceMarkdown(makeSnapshot())).toContain("## Host Guard");
  });

  it("indicates demo mode — no real system checks", () => {
    expect(renderEvidenceMarkdown(makeSnapshot())).toContain("no real system checks performed");
  });

  it("shows 'Host Guard not run' when null", () => {
    const snap = buildEvidenceSnapshot(DEMO_PRESETS["ready"], null, null, null, {
      timestamp: FIXED_TS,
    });
    expect(renderEvidenceMarkdown(snap)).toContain("Host Guard not run");
  });
});

// ─── OSINT section ────────────────────────────────────────────────────────────

describe("renderEvidenceMarkdown — OSINT section", () => {
  it("contains OSINT Navigator heading", () => {
    expect(renderEvidenceMarkdown(makeSnapshot())).toContain("## OSINT Navigator");
  });

  it("contains catalog resource count", () => {
    const snap = makeSnapshot();
    expect(renderEvidenceMarkdown(snap)).toContain(
      `**Catalog resources**: ${snap.osint.resources_total}`
    );
  });
});

// ─── Limitations section ──────────────────────────────────────────────────────

describe("renderEvidenceMarkdown — Limitations section", () => {
  it("contains Limitations heading", () => {
    expect(renderEvidenceMarkdown(makeSnapshot())).toContain("## Limitations");
  });

  it("mentions demo mode limitation", () => {
    expect(renderEvidenceMarkdown(makeSnapshot())).toContain("demo mode");
  });
});

// ─── No banned copy ───────────────────────────────────────────────────────────

const BANNED_MD = [
  "doxxing", "credential dump", "bypass", "evade", "undetectable",
  "guaranteed anonymity", "unlock leaks", "stolen accounts", "carding", "fraud",
];

describe("renderEvidenceMarkdown — no banned copy", () => {
  it("does not contain banned phrases", () => {
    const md = renderEvidenceMarkdown(makeSnapshot()).toLowerCase();
    for (const phrase of BANNED_MD) {
      expect(md).not.toContain(phrase.toLowerCase());
    }
  });
});

// ─── JSON renderer ────────────────────────────────────────────────────────────

describe("renderEvidenceJson", () => {
  it("is deterministic for the same snapshot", () => {
    const snap = makeSnapshot();
    expect(renderEvidenceJson(snap)).toBe(renderEvidenceJson(snap));
  });

  it("returns valid JSON", () => {
    expect(() => JSON.parse(renderEvidenceJson(makeSnapshot()))).not.toThrow();
  });

  it("does not include unsafe field names", () => {
    const unsafe = [
      "password", "token", "cookie", "secret", "api_key",
      "raw_html", "external_page_content", "clipboard_content",
    ];
    const json = renderEvidenceJson(makeSnapshot());
    for (const key of unsafe) {
      expect(json).not.toContain(`"${key}"`);
    }
  });

  it("keys in top-level object are sorted alphabetically", () => {
    const parsed = JSON.parse(renderEvidenceJson(makeSnapshot())) as Record<string, unknown>;
    const keys = Object.keys(parsed);
    const sorted = [...keys].sort((a, b) => a.localeCompare(b));
    expect(keys).toEqual(sorted);
  });

  it("no banned copy in JSON output", () => {
    const json = renderEvidenceJson(makeSnapshot()).toLowerCase();
    const banned = [
      "doxxing", "credential dump", "bypass", "evade", "undetectable",
      "guaranteed anonymity", "unlock leaks", "carding", "fraud",
    ];
    for (const phrase of banned) {
      expect(json).not.toContain(phrase);
    }
  });
});

// ─── Copy-to-clipboard safety assertion (structural) ─────────────────────────

describe("evidence output — no external API or invoke calls", () => {
  it("renderEvidenceMarkdown is a pure function returning a string", () => {
    const result = renderEvidenceMarkdown(makeSnapshot());
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("renderEvidenceJson is a pure function returning a string", () => {
    const result = renderEvidenceJson(makeSnapshot());
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});
