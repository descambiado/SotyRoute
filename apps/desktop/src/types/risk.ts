export type EvidenceLevel = "off" | "minimal" | "standard" | "full";
export type RiskLevel = "low" | "medium" | "high" | "blocked";

export const EVIDENCE_LEVELS: readonly EvidenceLevel[] = [
  "off",
  "minimal",
  "standard",
  "full",
];

export const RISK_LEVELS: readonly RiskLevel[] = [
  "low",
  "medium",
  "high",
  "blocked",
];
