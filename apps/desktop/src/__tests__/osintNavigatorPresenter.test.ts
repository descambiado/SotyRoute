import { describe, it, expect } from "vitest";
import {
  riskToVariant,
  riskToConfirmationWarning,
  filterResources,
  OSINT_CATEGORY_LABELS,
  OSINT_RISK_LABELS,
  OSINT_CATEGORIES,
  OSINT_RISK_LEVELS,
  OSINT_LIMITATION_COPY,
  OSINT_EXTERNAL_RESOURCE_WARNING,
} from "../lib/osintNavigatorPresenter";
import { OSINT_CATALOG } from "../lib/osintCatalog";
import type { OsintResource } from "../types/osintNavigator";

// ─── riskToVariant ────────────────────────────────────────────────────────────

describe("riskToVariant", () => {
  it("low → ok",      () => expect(riskToVariant("low")).toBe("ok"));
  it("medium → warn", () => expect(riskToVariant("medium")).toBe("warn"));
  it("high → danger", () => expect(riskToVariant("high")).toBe("danger"));
  it("blocked → idle",() => expect(riskToVariant("blocked")).toBe("idle"));
});

// ─── riskToConfirmationWarning ────────────────────────────────────────────────

describe("riskToConfirmationWarning", () => {
  it("returns a non-empty string for each risk level", () => {
    for (const risk of OSINT_RISK_LEVELS) {
      expect(riskToConfirmationWarning(risk).length).toBeGreaterThan(0);
    }
  });

  it("high-risk warning mentions authorization", () => {
    expect(riskToConfirmationWarning("high").toLowerCase()).toContain("authorized");
  });

  it("does not contain banned phrases in any warning", () => {
    const banned = ["guaranteed clean", "evade", "bypass", "undetectable", "doxx"];
    for (const risk of OSINT_RISK_LEVELS) {
      const warning = riskToConfirmationWarning(risk).toLowerCase();
      for (const phrase of banned) {
        expect(warning).not.toContain(phrase);
      }
    }
  });
});

// ─── Label maps ───────────────────────────────────────────────────────────────

describe("OSINT_CATEGORY_LABELS", () => {
  it("covers all categories in OSINT_CATEGORIES", () => {
    for (const cat of OSINT_CATEGORIES) {
      expect(OSINT_CATEGORY_LABELS[cat], `missing label for ${cat}`).toBeTruthy();
    }
  });

  it("no label is an empty string", () => {
    for (const [cat, label] of Object.entries(OSINT_CATEGORY_LABELS)) {
      expect(label.length, `empty label for ${cat}`).toBeGreaterThan(0);
    }
  });
});

describe("OSINT_RISK_LABELS", () => {
  it("covers all risk levels", () => {
    for (const risk of OSINT_RISK_LEVELS) {
      expect(OSINT_RISK_LABELS[risk], `missing label for ${risk}`).toBeTruthy();
    }
  });
});

// ─── filterResources ──────────────────────────────────────────────────────────

const SAMPLE: readonly OsintResource[] = [
  {
    id: "r_low_ti",
    name: "Low TI Resource",
    url: "https://example.com/low",
    categories: ["threat_intelligence"],
    risk: "low",
    description: "desc",
    allowed_use: "authorized use",
    requires_confirmation: false,
    relevant_missions: [],
    relevant_pack_ids: ["osint_route"],
  },
  {
    id: "r_med_ioc",
    name: "Med IOC Resource",
    url: "https://example.com/med",
    categories: ["ioc_lookup"],
    risk: "medium",
    description: "desc",
    allowed_use: "authorized use",
    requires_confirmation: true,
    relevant_missions: [],
    relevant_pack_ids: [],
  },
  {
    id: "r_high_dom",
    name: "High Domain Resource",
    url: "https://example.com/high",
    categories: ["domain_ip_reputation"],
    risk: "high",
    description: "desc",
    allowed_use: "authorized use",
    requires_confirmation: true,
    relevant_missions: [],
    relevant_pack_ids: [],
  },
  {
    id: "r_blocked",
    name: "Blocked Resource",
    url: "",
    categories: ["threat_intelligence"],
    risk: "blocked",
    description: "desc",
    allowed_use: "Blocked by policy.",
    requires_confirmation: false,
    relevant_missions: [],
    relevant_pack_ids: [],
  },
];

describe("filterResources — empty filters", () => {
  it("returns all resources when no filters are set", () => {
    const result = filterResources(SAMPLE, { categories: [], risks: [] });
    expect(result).toHaveLength(4);
  });
});

describe("filterResources — category filter", () => {
  it("filters by single category", () => {
    const result = filterResources(SAMPLE, { categories: ["ioc_lookup"], risks: [] });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("r_med_ioc");
  });

  it("multi-category filter returns union", () => {
    const result = filterResources(SAMPLE, { categories: ["ioc_lookup", "domain_ip_reputation"], risks: [] });
    expect(result).toHaveLength(2);
  });

  it("category filter matches resources with overlapping categories", () => {
    const result = filterResources(SAMPLE, { categories: ["threat_intelligence"], risks: [] });
    // r_low_ti (threat_intelligence, low) and r_blocked (threat_intelligence, blocked)
    expect(result).toHaveLength(2);
  });
});

describe("filterResources — risk filter", () => {
  it("filters by risk level", () => {
    const result = filterResources(SAMPLE, { categories: [], risks: ["low"] });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("r_low_ti");
  });

  it("multi-risk filter returns union", () => {
    const result = filterResources(SAMPLE, { categories: [], risks: ["low", "medium"] });
    expect(result).toHaveLength(2);
  });

  it("risk filter for blocked returns only blocked", () => {
    const result = filterResources(SAMPLE, { categories: [], risks: ["blocked"] });
    expect(result).toHaveLength(1);
    expect(result[0].risk).toBe("blocked");
  });
});

describe("filterResources — combined filters", () => {
  it("category + risk filter intersects correctly", () => {
    const result = filterResources(SAMPLE, {
      categories: ["threat_intelligence"],
      risks: ["low"],
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("r_low_ti");
  });

  it("returns empty when no resource matches both filters", () => {
    const result = filterResources(SAMPLE, {
      categories: ["malware_analysis"],
      risks: ["low"],
    });
    expect(result).toHaveLength(0);
  });
});

describe("filterResources — on full catalog", () => {
  it("empty filters returns full catalog", () => {
    const result = filterResources(OSINT_CATALOG, { categories: [], risks: [] });
    expect(result).toHaveLength(OSINT_CATALOG.length);
  });

  it("risk filter for blocked returns only blocked entries", () => {
    const result = filterResources(OSINT_CATALOG, { categories: [], risks: ["blocked"] });
    expect(result.every(r => r.risk === "blocked")).toBe(true);
  });

  it("risk filter for low returns only low entries", () => {
    const result = filterResources(OSINT_CATALOG, { categories: [], risks: ["low"] });
    expect(result.every(r => r.risk === "low")).toBe(true);
  });
});

// ─── Safety copy ──────────────────────────────────────────────────────────────

describe("OSINT_LIMITATION_COPY", () => {
  const BANNED = [
    "guaranteed clean", "evade", "bypass", "undetectable",
    "doxx", "credential dump automat", "scraping",
  ];

  it("is a non-empty string", () => {
    expect(OSINT_LIMITATION_COPY.length).toBeGreaterThan(0);
  });

  it("does not contain banned phrases", () => {
    const copy = OSINT_LIMITATION_COPY.toLowerCase();
    for (const phrase of BANNED) {
      expect(copy).not.toContain(phrase);
    }
  });

  it("mentions 'authorized'", () => {
    expect(OSINT_LIMITATION_COPY.toLowerCase()).toContain("authorized");
  });
});

describe("OSINT_EXTERNAL_RESOURCE_WARNING", () => {
  it("is a non-empty string", () => {
    expect(OSINT_EXTERNAL_RESOURCE_WARNING.length).toBeGreaterThan(0);
  });

  it("mentions 'external'", () => {
    expect(OSINT_EXTERNAL_RESOURCE_WARNING.toLowerCase()).toContain("external");
  });
});
