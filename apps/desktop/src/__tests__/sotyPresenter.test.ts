/**
 * Tests for sotyPresenter.ts pure helper functions.
 *
 * Pure unit tests — no DOM, no React, no I/O.
 * Covers: state→variant, state→copy, score→variant, severity→variant,
 * subscoreHint, and fix deduplication.
 */
import { describe, it, expect } from "vitest";
import {
  sotyStateToVariant,
  sotyStateToLabel,
  sotyStateToCopy,
  scoreToVariant,
  severityToVariant,
  subscoreHint,
  dedupFixes,
} from "../lib/sotyPresenter";
import { SOTY_STATES } from "../types/sotyScore";
import type { ScoreDeduction } from "../types/sotyScore";

// ─── Helper ───────────────────────────────────────────────────────────────────

function makeDeduction(id: string, fixId: string, overrides: Partial<ScoreDeduction> = {}): ScoreDeduction {
  return {
    id,
    category: "route",
    severity: "medium",
    points_lost: 10,
    reason: "Test reason",
    recommended_fix: {
      id: fixId,
      title: "Test fix title",
      description: "Test fix description",
      action_type: "manual",
      safe_to_autorun: false,
      requires_confirmation: false,
    },
    related_signal: "test_signal",
    blocking: false,
    ...overrides,
  };
}

// ─── sotyStateToVariant ───────────────────────────────────────────────────────

describe("sotyStateToVariant", () => {
  it("SOTY_READY → ok", () => {
    expect(sotyStateToVariant("SOTY_READY")).toBe("ok");
  });

  it("SOTY_WARN → warn", () => {
    expect(sotyStateToVariant("SOTY_WARN")).toBe("warn");
  });

  it("SOTY_DIRTY → warn (host posture, not blocking)", () => {
    expect(sotyStateToVariant("SOTY_DIRTY")).toBe("warn");
  });

  it("SOTY_EXPOSED → danger", () => {
    expect(sotyStateToVariant("SOTY_EXPOSED")).toBe("danger");
  });

  it("SOTY_BLOCKED → danger", () => {
    expect(sotyStateToVariant("SOTY_BLOCKED")).toBe("danger");
  });

  it("every SotyState maps to a valid StatusVariant", () => {
    const valid = new Set(["ok", "warn", "danger", "info", "idle"]);
    for (const state of SOTY_STATES) {
      expect(valid.has(sotyStateToVariant(state)), `${state} → valid variant`).toBe(true);
    }
  });
});

// ─── sotyStateToLabel ─────────────────────────────────────────────────────────

describe("sotyStateToLabel", () => {
  it("returns the state string directly (operators learn the codes)", () => {
    for (const state of SOTY_STATES) {
      expect(sotyStateToLabel(state)).toBe(state);
    }
  });
});

// ─── sotyStateToCopy ──────────────────────────────────────────────────────────

describe("sotyStateToCopy", () => {
  it("SOTY_READY copy contains 'ready'", () => {
    expect(sotyStateToCopy("SOTY_READY").toLowerCase()).toContain("ready");
  });

  it("SOTY_BLOCKED copy mentions 'blocked'", () => {
    expect(sotyStateToCopy("SOTY_BLOCKED").toLowerCase()).toContain("blocked");
  });

  it("SOTY_EXPOSED copy mentions exposure", () => {
    const copy = sotyStateToCopy("SOTY_EXPOSED").toLowerCase();
    expect(copy.includes("exposure") || copy.includes("exposed")).toBe(true);
  });

  it("SOTY_WARN copy mentions warnings or 'warn'", () => {
    const copy = sotyStateToCopy("SOTY_WARN").toLowerCase();
    expect(copy.includes("warn") || copy.includes("review")).toBe(true);
  });

  it("every SotyState produces non-empty copy", () => {
    for (const state of SOTY_STATES) {
      expect(sotyStateToCopy(state).trim().length, `${state}: non-empty copy`).toBeGreaterThan(0);
    }
  });
});

// ─── scoreToVariant ───────────────────────────────────────────────────────────

describe("scoreToVariant", () => {
  it("100 → ok", () => { expect(scoreToVariant(100)).toBe("ok"); });
  it("90  → ok", () => { expect(scoreToVariant(90)).toBe("ok"); });
  it("80  → ok (threshold)", () => { expect(scoreToVariant(80)).toBe("ok"); });
  it("79  → warn", () => { expect(scoreToVariant(79)).toBe("warn"); });
  it("70  → warn", () => { expect(scoreToVariant(70)).toBe("warn"); });
  it("60  → warn (threshold)", () => { expect(scoreToVariant(60)).toBe("warn"); });
  it("59  → danger", () => { expect(scoreToVariant(59)).toBe("danger"); });
  it("30  → danger", () => { expect(scoreToVariant(30)).toBe("danger"); });
  it("0   → danger", () => { expect(scoreToVariant(0)).toBe("danger"); });
});

// ─── severityToVariant ────────────────────────────────────────────────────────

describe("severityToVariant", () => {
  it("info     → info",   () => { expect(severityToVariant("info")).toBe("info"); });
  it("low      → idle",   () => { expect(severityToVariant("low")).toBe("idle"); });
  it("medium   → warn",   () => { expect(severityToVariant("medium")).toBe("warn"); });
  it("high     → danger", () => { expect(severityToVariant("high")).toBe("danger"); });
  it("critical → danger", () => { expect(severityToVariant("critical")).toBe("danger"); });
});

// ─── subscoreHint ─────────────────────────────────────────────────────────────

describe("subscoreHint", () => {
  it("100 → 'Clean'",        () => { expect(subscoreHint(100)).toBe("Clean"); });
  it("90  → 'Clean'",        () => { expect(subscoreHint(90)).toBe("Clean"); });
  it("80  → 'Clean'",        () => { expect(subscoreHint(80)).toBe("Clean"); });
  it("79  → 'Minor issues'", () => { expect(subscoreHint(79)).toBe("Minor issues"); });
  it("60  → 'Minor issues'", () => { expect(subscoreHint(60)).toBe("Minor issues"); });
  it("59  → 'Poor posture'", () => { expect(subscoreHint(59)).toBe("Poor posture"); });
  it("1   → 'Poor posture'", () => { expect(subscoreHint(1)).toBe("Poor posture"); });
  it("0   → 'Not assessed'", () => { expect(subscoreHint(0)).toBe("Not assessed"); });
});

// ─── dedupFixes ───────────────────────────────────────────────────────────────

describe("dedupFixes", () => {
  it("returns empty array for empty deductions", () => {
    expect(dedupFixes([])).toHaveLength(0);
  });

  it("returns single fix for single deduction", () => {
    const result = dedupFixes([makeDeduction("D1", "FIX_A")]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("FIX_A");
  });

  it("deduplicates two deductions sharing the same fix ID", () => {
    const d1 = makeDeduction("D1", "FIX_A");
    const d2 = makeDeduction("D2", "FIX_A");
    const result = dedupFixes([d1, d2]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("FIX_A");
  });

  it("returns all fixes when all fix IDs are unique", () => {
    const ds = [
      makeDeduction("D1", "FIX_1"),
      makeDeduction("D2", "FIX_2"),
      makeDeduction("D3", "FIX_3"),
    ];
    expect(dedupFixes(ds)).toHaveLength(3);
  });

  it("preserves order of first occurrence across duplicate fix IDs", () => {
    const ds = [
      makeDeduction("D1", "FIX_B"),
      makeDeduction("D2", "FIX_A"),
      makeDeduction("D3", "FIX_B"), // duplicate of FIX_B — should be ignored
    ];
    const result = dedupFixes(ds);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("FIX_B");
    expect(result[1].id).toBe("FIX_A");
  });

  it("fix objects reference the first deduction's fix (not a clone)", () => {
    const d1 = makeDeduction("D1", "FIX_X");
    const d2 = makeDeduction("D2", "FIX_X");
    const result = dedupFixes([d1, d2]);
    // Should be the exact same object reference from d1
    expect(result[0]).toBe(d1.recommended_fix);
  });
});
