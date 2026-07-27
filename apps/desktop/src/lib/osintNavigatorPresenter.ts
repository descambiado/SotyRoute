import type {
  OsintCategory,
  OsintFilterState,
  OsintResource,
  OsintRiskLevel,
} from "../types/osintNavigator";

export type RiskVariant = "ok" | "warn" | "danger" | "idle";

// ─── Label maps ───────────────────────────────────────────────────────────────

export const OSINT_CATEGORY_LABELS: Record<OsintCategory, string> = {
  threat_intelligence: "Threat Intel",
  ioc_lookup: "IOC Lookup",
  domain_ip_reputation: "Domain / IP",
  malware_analysis: "Malware Analysis",
  vulnerability_intelligence: "Vulnerability Intel",
  privacy_self_check: "Privacy Self-Check",
  breach_exposure_own_assets: "Breach Exposure",
  reporting_abuse: "Abuse Reporting",
  training: "Training",
  documentation: "Documentation",
  security_communities: "Communities",
};

export const OSINT_RISK_LABELS: Record<OsintRiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  blocked: "Blocked",
};

export const OSINT_CATEGORIES: readonly OsintCategory[] = [
  "threat_intelligence",
  "ioc_lookup",
  "domain_ip_reputation",
  "malware_analysis",
  "vulnerability_intelligence",
  "privacy_self_check",
  "breach_exposure_own_assets",
  "reporting_abuse",
  "training",
  "documentation",
  "security_communities",
];

export const OSINT_RISK_LEVELS: readonly OsintRiskLevel[] = ["low", "medium", "high", "blocked"];

// ─── Presenters ───────────────────────────────────────────────────────────────

export function riskToVariant(risk: OsintRiskLevel): RiskVariant {
  switch (risk) {
    case "low":     return "ok";
    case "medium":  return "warn";
    case "high":    return "danger";
    case "blocked": return "idle";
  }
}

export function riskToConfirmationWarning(risk: OsintRiskLevel): string {
  switch (risk) {
    case "low":
      return "This resource opens in your external browser. Confirm authorized use before proceeding.";
    case "medium":
      return "This is a medium-risk resource. Review the authorized-use policy before proceeding. Do not submit sensitive or proprietary data.";
    case "high":
      return "This is a high-risk resource. Use only against infrastructure you own or are explicitly authorized to assess under a written scope. Misuse may violate law or policy.";
    case "blocked":
      return "Blocked by policy.";
  }
}

// ─── Filtering ─────────────────────────────────────────────────────────────────

export function filterResources(
  catalog: readonly OsintResource[],
  filters: OsintFilterState
): OsintResource[] {
  return catalog.filter(resource => {
    if (
      filters.categories.length > 0 &&
      !resource.categories.some(c => filters.categories.includes(c))
    ) {
      return false;
    }
    if (filters.risks.length > 0 && !filters.risks.includes(resource.risk)) {
      return false;
    }
    return true;
  });
}

// ─── Safety copy ──────────────────────────────────────────────────────────────

export const OSINT_LIMITATION_COPY =
  "SotyRoute does not embed, proxy, or automate queries to external OSINT resources. " +
  "All resources open in your external browser. Authorized defensive use only — " +
  "for owned assets, authorized targets, and written-scope engagements.";

export const OSINT_EXTERNAL_RESOURCE_WARNING =
  "External resource — opens outside SotyRoute. No data is sent or logged by SotyRoute.";
