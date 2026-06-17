import { describe, it, expect } from "vitest";
import { OSINT_CATALOG, OSINT_CATALOG_BY_ID } from "../lib/osintCatalog";
import { OSINT_CATEGORIES } from "../lib/osintNavigatorPresenter";

// ─── Banned phrases that must never appear in catalog copy ───────────────────

const BANNED_PHRASES = [
  "doxx",
  "dox ",
  "credential dump automat",
  "scrape",
  "scraping",
  "guaranteed clean",
  "antivirus replacement",
  "edr replacement",
  "undetectable",
  "evade",
  "carding",
  "cvv",
  "stolen account",
  "illegal marketplace",
  "fraud",
];

// ─── Catalog integrity ────────────────────────────────────────────────────────

describe("OSINT_CATALOG — integrity", () => {
  it("contains at least 20 entries", () => {
    expect(OSINT_CATALOG.length).toBeGreaterThanOrEqual(20);
  });

  it("every entry has a non-empty id", () => {
    for (const r of OSINT_CATALOG) {
      expect(r.id.length, `id empty on ${r.name}`).toBeGreaterThan(0);
    }
  });

  it("all IDs are unique", () => {
    const ids = OSINT_CATALOG.map(r => r.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("every entry has a non-empty name", () => {
    for (const r of OSINT_CATALOG) {
      expect(r.name.length, `name empty on ${r.id}`).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty description", () => {
    for (const r of OSINT_CATALOG) {
      expect(r.description.length, `description empty on ${r.id}`).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty allowed_use", () => {
    for (const r of OSINT_CATALOG) {
      expect(r.allowed_use.length, `allowed_use empty on ${r.id}`).toBeGreaterThan(0);
    }
  });

  it("blocked resources have url = empty string", () => {
    for (const r of OSINT_CATALOG.filter(r => r.risk === "blocked")) {
      expect(r.url, `blocked resource ${r.id} must have url=""`).toBe("");
    }
  });

  it("non-blocked resources have a non-empty url", () => {
    for (const r of OSINT_CATALOG.filter(r => r.risk !== "blocked")) {
      expect(r.url.length, `non-blocked resource ${r.id} must have a url`).toBeGreaterThan(0);
    }
  });

  it("all risk levels are valid", () => {
    const validRisks = new Set(["low", "medium", "high", "blocked"]);
    for (const r of OSINT_CATALOG) {
      expect(validRisks.has(r.risk), `invalid risk on ${r.id}: ${r.risk}`).toBe(true);
    }
  });

  it("all categories are valid", () => {
    const validCategories = new Set(OSINT_CATEGORIES);
    for (const r of OSINT_CATALOG) {
      for (const cat of r.categories) {
        expect(validCategories.has(cat), `invalid category ${cat} on ${r.id}`).toBe(true);
      }
    }
  });

  it("every non-blocked resource has at least one category", () => {
    for (const r of OSINT_CATALOG.filter(r => r.risk !== "blocked")) {
      expect(r.categories.length, `${r.id} has no categories`).toBeGreaterThan(0);
    }
  });

  it("blocked resources have requires_confirmation = false", () => {
    for (const r of OSINT_CATALOG.filter(r => r.risk === "blocked")) {
      expect(r.requires_confirmation, `blocked resource ${r.id} must not require confirmation`).toBe(false);
    }
  });

  it("medium and high resources have requires_confirmation = true", () => {
    for (const r of OSINT_CATALOG.filter(r => r.risk === "medium" || r.risk === "high")) {
      expect(r.requires_confirmation, `${r.id} (${r.risk}) must require confirmation`).toBe(true);
    }
  });

  it("blocked resources have no relevant_missions", () => {
    for (const r of OSINT_CATALOG.filter(r => r.risk === "blocked")) {
      expect(r.relevant_missions).toHaveLength(0);
    }
  });

  it("blocked resources have no relevant_pack_ids", () => {
    for (const r of OSINT_CATALOG.filter(r => r.risk === "blocked")) {
      expect(r.relevant_pack_ids).toHaveLength(0);
    }
  });
});

// ─── Safety: banned phrases ───────────────────────────────────────────────────

describe("OSINT_CATALOG — copy safety", () => {
  it("no allowed_use contains banned phrases", () => {
    for (const r of OSINT_CATALOG) {
      const text = r.allowed_use.toLowerCase();
      for (const phrase of BANNED_PHRASES) {
        expect(text, `banned phrase "${phrase}" found in ${r.id}.allowed_use`).not.toContain(phrase);
      }
    }
  });

  it("no description contains banned phrases", () => {
    for (const r of OSINT_CATALOG) {
      const text = r.description.toLowerCase();
      for (const phrase of BANNED_PHRASES) {
        // Descriptions may describe what blocked resources ARE - only block from allowed_use
        if (r.risk === "blocked") continue;
        expect(text, `banned phrase "${phrase}" found in ${r.id}.description`).not.toContain(phrase);
      }
    }
  });

  it("catalog contains at least 3 blocked resources", () => {
    const blocked = OSINT_CATALOG.filter(r => r.risk === "blocked");
    expect(blocked.length).toBeGreaterThanOrEqual(3);
  });

  it("catalog contains no people-search tools as openable resources", () => {
    const openable = OSINT_CATALOG.filter(r => r.risk !== "blocked");
    const peopleSearch = openable.filter(r =>
      r.name.toLowerCase().includes("people") ||
      r.name.toLowerCase().includes("spokeo") ||
      r.name.toLowerCase().includes("pipl") ||
      r.name.toLowerCase().includes("whitepages") ||
      r.name.toLowerCase().includes("beenverified")
    );
    expect(peopleSearch).toHaveLength(0);
  });

  it("catalog contains no credential dump lookup services as openable resources", () => {
    const openable = OSINT_CATALOG.filter(r => r.risk !== "blocked");
    const credDump = openable.filter(r =>
      r.name.toLowerCase().includes("leakinfo") ||
      r.name.toLowerCase().includes("weleakinfo") ||
      r.name.toLowerCase().includes("dehashed") ||
      r.name.toLowerCase().includes("snusbase")
    );
    expect(credDump).toHaveLength(0);
  });
});

// ─── OSINT_CATALOG_BY_ID ─────────────────────────────────────────────────────

describe("OSINT_CATALOG_BY_ID", () => {
  it("contains the same count as OSINT_CATALOG", () => {
    expect(Object.keys(OSINT_CATALOG_BY_ID).length).toBe(OSINT_CATALOG.length);
  });

  it("lookup by id returns the correct resource", () => {
    const first = OSINT_CATALOG[0];
    expect(OSINT_CATALOG_BY_ID[first.id]).toBe(first);
  });
});

// ─── Risk level distribution ──────────────────────────────────────────────────

describe("OSINT_CATALOG — risk distribution", () => {
  it("contains low-risk resources", () => {
    expect(OSINT_CATALOG.filter(r => r.risk === "low").length).toBeGreaterThan(0);
  });

  it("contains medium-risk resources", () => {
    expect(OSINT_CATALOG.filter(r => r.risk === "medium").length).toBeGreaterThan(0);
  });

  it("contains high-risk resources", () => {
    expect(OSINT_CATALOG.filter(r => r.risk === "high").length).toBeGreaterThan(0);
  });
});
