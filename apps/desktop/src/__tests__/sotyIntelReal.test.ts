import { describe, it, expect } from "vitest";
import { mapIntelToScoreInput, type IntelRealState } from "../lib/sotyIntelReal";
import type { SotyScoreInput } from "../lib/sotyScoreRules";

const DEMO_INTEL: SotyScoreInput["intel"] = {
  route_pack_selected: true,
  osint_categories_selected: true,
  high_risk_resource_enabled: false,
  blocked_resource_requested: false,
  query_logging_disabled: true,
};

const UNTOUCHED: IntelRealState = {
  routePackTouched: false,
  selectedPackId: null,
  osintFilters: null,
};

describe("mapIntelToScoreInput", () => {
  it("falls back to the demo value for route_pack_selected before any pack has been touched", () => {
    expect(mapIntelToScoreInput(DEMO_INTEL, UNTOUCHED).route_pack_selected).toBe(true);
  });

  it("reflects the real selection once a pack has been touched", () => {
    const touched: IntelRealState = { ...UNTOUCHED, routePackTouched: true, selectedPackId: "lab_route" };
    expect(mapIntelToScoreInput(DEMO_INTEL, touched).route_pack_selected).toBe(true);
  });

  it("reflects real deselection once touched, even though the demo default is true", () => {
    const touchedNone: IntelRealState = { ...UNTOUCHED, routePackTouched: true, selectedPackId: null };
    expect(mapIntelToScoreInput(DEMO_INTEL, touchedNone).route_pack_selected).toBe(false);
  });

  it("falls back to the demo value for osint fields before the Navigator has reported filters", () => {
    const result = mapIntelToScoreInput(DEMO_INTEL, UNTOUCHED);
    expect(result.osint_categories_selected).toBe(true);
    expect(result.high_risk_resource_enabled).toBe(false);
  });

  it("osint_categories_selected reflects a non-empty category filter once reported", () => {
    const withCategories: IntelRealState = {
      ...UNTOUCHED,
      osintFilters: { categories: ["threat_intelligence"], risks: [] },
    };
    expect(mapIntelToScoreInput(DEMO_INTEL, withCategories).osint_categories_selected).toBe(true);
  });

  it("osint_categories_selected is real false once reported empty, even though the demo default is true", () => {
    const empty: IntelRealState = {
      ...UNTOUCHED,
      osintFilters: { categories: [], risks: [] },
    };
    expect(mapIntelToScoreInput(DEMO_INTEL, empty).osint_categories_selected).toBe(false);
  });

  it("high_risk_resource_enabled is true only when the risk filter includes high", () => {
    const highRisk: IntelRealState = {
      ...UNTOUCHED,
      osintFilters: { categories: [], risks: ["high"] },
    };
    expect(mapIntelToScoreInput(DEMO_INTEL, highRisk).high_risk_resource_enabled).toBe(true);

    const lowRisk: IntelRealState = {
      ...UNTOUCHED,
      osintFilters: { categories: [], risks: ["low"] },
    };
    expect(mapIntelToScoreInput(DEMO_INTEL, lowRisk).high_risk_resource_enabled).toBe(false);
  });

  it("blocked_resource_requested is always false — the catalog UI has no path to request one", () => {
    expect(mapIntelToScoreInput(DEMO_INTEL, UNTOUCHED).blocked_resource_requested).toBe(false);
    expect(
      mapIntelToScoreInput(
        { ...DEMO_INTEL, blocked_resource_requested: true },
        UNTOUCHED
      ).blocked_resource_requested
    ).toBe(false);
  });

  it("query_logging_disabled always passes through the demo value — no real signal exists", () => {
    expect(mapIntelToScoreInput(DEMO_INTEL, UNTOUCHED).query_logging_disabled).toBe(true);
    expect(
      mapIntelToScoreInput(
        { ...DEMO_INTEL, query_logging_disabled: false },
        { ...UNTOUCHED, routePackTouched: true, selectedPackId: "lab_route" }
      ).query_logging_disabled
    ).toBe(false);
  });
});
