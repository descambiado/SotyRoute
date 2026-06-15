/**
 * Route Pack context data — PR 6.
 *
 * Each RoutePackContext describes:
 *  - compatible_missions  : which mission types align with this pack
 *  - score_focus          : which sub-scores matter most for this pack
 *  - demo_preset          : which demo state best illustrates the pack's context
 *  - what_this_route_improves    : safe, honest operator-facing benefits copy
 *  - what_this_route_does_not_do : safe, honest limitation copy
 *
 * Safety: pure read-only data. No I/O, no system mutations, no external calls.
 *         Copy follows the PR 6 safety constraint: no "anonymize", "bypass",
 *         "undetectable", "evade", "clean malware", "guarantee privacy",
 *         "launch attack", "doxxing" or similar unsafe wording.
 */
import type { MissionType } from "../types/routeCard";
import type { DemoPresetKey } from "./sotyDemoInput";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FocusLevel = "low" | "medium" | "high";

export interface ScoreFocus {
  route_focus: FocusLevel;
  host_focus: FocusLevel;
  scope_focus: FocusLevel;
  intel_focus: FocusLevel;
  evidence_focus: FocusLevel;
}

export interface RoutePackContext {
  /** Must match the id field in DEFAULT_ROUTE_PACKS. */
  pack_id: string;
  /** Mission types that pair naturally with this pack. */
  compatible_missions: readonly MissionType[];
  /** Which sub-scores this pack's workflow exercises most. */
  score_focus: ScoreFocus;
  /** Demo preset that best illustrates the expected context for this pack. */
  demo_preset: DemoPresetKey;
  /** What selecting this pack helps the operator improve (safe copy only). */
  what_this_route_improves: readonly string[];
  /** Explicit limitations — what this pack does not do (safe copy only). */
  what_this_route_does_not_do: readonly string[];
}

// ─── Pack context catalog ─────────────────────────────────────────────────────

export const ROUTE_PACK_CONTEXTS: Readonly<Record<string, RoutePackContext>> = {
  student_route: {
    pack_id: "student_route",
    compatible_missions: [
      "investigate_domain",
      "analyze_ip",
      "check_hash",
      "open_osint_sources",
      "breach_exposure_self_check",
    ],
    score_focus: {
      route_focus: "medium",
      host_focus: "low",
      scope_focus: "medium",
      intel_focus: "medium",
      evidence_focus: "medium",
    },
    demo_preset: "warn",
    what_this_route_improves: [
      "Route posture awareness and DNS verification discipline",
      "OSINT category policy compliance for learning environments",
      "Evidence discipline for lab sessions",
      "Confirmation discipline before operating against any target",
    ],
    what_this_route_does_not_do: [
      "Scan hosts or run active network probes",
      "Conceal your identity or provide anonymity",
      "Enable BOFA modules (BOFA is disabled in this pack)",
      "Replace a written scope document or formal authorization",
    ],
  },

  privacy_route: {
    pack_id: "privacy_route",
    compatible_missions: [
      "privacy_route",
      "breach_exposure_self_check",
      "public_wifi",
    ],
    score_focus: {
      route_focus: "high",
      host_focus: "medium",
      scope_focus: "low",
      intel_focus: "medium",
      evidence_focus: "low",
    },
    demo_preset: "warn",
    what_this_route_improves: [
      "Route and DNS leak awareness before connecting to external sources",
      "Tunnel integrity and kill-switch state visibility",
      "Breach self-check posture for your own assets",
    ],
    what_this_route_does_not_do: [
      "Provide anonymity or prevent all forms of identification",
      "Protect against network monitoring by a determined observer with legal process",
      "Enable OSINT or BOFA modules (both are disabled in this pack)",
      "Replace proper operational security practices",
    ],
  },

  osint_route: {
    pack_id: "osint_route",
    compatible_missions: [
      "investigate_domain",
      "analyze_ip",
      "open_osint_sources",
      "breach_exposure_self_check",
    ],
    score_focus: {
      route_focus: "high",
      host_focus: "medium",
      scope_focus: "high",
      intel_focus: "high",
      evidence_focus: "medium",
    },
    demo_preset: "warn",
    what_this_route_improves: [
      "OSINT scope discipline and policy-approved category compliance",
      "Route posture for external intelligence queries",
      "Evidence coverage for lookup and research sessions",
    ],
    what_this_route_does_not_do: [
      "Automate OSINT collection or scrape data from sources",
      "Query personal or sensitive data by default",
      "Enable active probing, exploitation, or offensive modules",
      "Guarantee the accuracy or completeness of third-party intelligence",
    ],
  },

  purple_route: {
    pack_id: "purple_route",
    compatible_missions: [
      "check_hash",
      "investigate_domain",
      "analyze_ip",
      "connect_to_lab",
      "defensive_workstation_check",
    ],
    score_focus: {
      route_focus: "high",
      host_focus: "high",
      scope_focus: "high",
      intel_focus: "high",
      evidence_focus: "high",
    },
    demo_preset: "warn",
    what_this_route_improves: [
      "Detection engineering posture and readiness validation",
      "Hash triage and threat intelligence preparation discipline",
      "Scope discipline and full evidence coverage for purple team sessions",
    ],
    what_this_route_does_not_do: [
      "Run exploits or scan unauthorized targets",
      "Replace antivirus, EDR or professional incident response",
      "Guarantee detection coverage for all threat scenarios",
      "Enable offensive automation without scope and evidence gates",
    ],
  },

  lab_route: {
    pack_id: "lab_route",
    compatible_missions: [
      "connect_to_lab",
      "launch_bofa",
      "investigate_domain",
      "analyze_ip",
    ],
    score_focus: {
      route_focus: "high",
      host_focus: "medium",
      scope_focus: "high",
      intel_focus: "low",
      evidence_focus: "high",
    },
    demo_preset: "blocked",
    what_this_route_improves: [
      "Lab connection posture and tunnel integrity validation",
      "Scope discipline for authorized lab environments",
      "Full evidence coverage for all lab session activity",
    ],
    what_this_route_does_not_do: [
      "Manage VPN, WireGuard or tunnel configuration on your behalf",
      "Scan lab hosts, network ranges or lab infrastructure",
      "Ensure the security of the lab infrastructure itself",
      "Guarantee session security without continued operator vigilance",
    ],
  },

  travel_route: {
    pack_id: "travel_route",
    compatible_missions: [
      "public_wifi",
      "privacy_route",
      "breach_exposure_self_check",
    ],
    score_focus: {
      route_focus: "high",
      host_focus: "medium",
      scope_focus: "low",
      intel_focus: "low",
      evidence_focus: "medium",
    },
    demo_preset: "exposed",
    what_this_route_improves: [
      "Tunnel posture and DNS leak awareness on untrusted networks",
      "Route state visibility before connecting to any sensitive resource",
      "Minimal-footprint evidence discipline for low-trust environments",
    ],
    what_this_route_does_not_do: [
      "Make public WiFi safe or trustworthy",
      "Protect against all network-level monitoring on the local network",
      "Conceal your presence from the network operator or captive portal",
      "Enable BOFA or lab connections on untrusted networks",
    ],
  },

  dirty_host_check: {
    pack_id: "dirty_host_check",
    compatible_missions: [
      "defensive_workstation_check",
      "privacy_route",
    ],
    score_focus: {
      route_focus: "medium",
      host_focus: "high",
      scope_focus: "low",
      intel_focus: "low",
      evidence_focus: "medium",
    },
    demo_preset: "dirty",
    what_this_route_improves: [
      "Host posture awareness: firewall state, antimalware, proxy and route anomaly detection",
      "Visibility into suspicious local configuration before any security work begins",
    ],
    what_this_route_does_not_do: [
      "Remove malware, threats or malicious configuration from your system",
      "Replace antivirus, EDR or professional incident response",
      "Confirm the host is clean — it surfaces signals, not verdicts",
      "Enable lab connections or BOFA until host posture meets requirements",
    ],
  },

  bofa_route: {
    pack_id: "bofa_route",
    compatible_missions: [
      "launch_bofa",
      "connect_to_lab",
      "investigate_domain",
      "check_hash",
      "analyze_ip",
    ],
    score_focus: {
      route_focus: "high",
      host_focus: "high",
      scope_focus: "high",
      intel_focus: "high",
      evidence_focus: "high",
    },
    demo_preset: "blocked",
    what_this_route_improves: [
      "BOFA preflight discipline and scope gate readiness",
      "Evidence requirements and coverage for BOFA sessions",
      "Safe BOFA module policy (passive-first, active only after passing preflight)",
    ],
    what_this_route_does_not_do: [
      "Launch BOFA without explicit scope confirmation and a passing SOTY Score",
      "Run active BOFA modules without a completed preflight gate",
      "Replace a written authorization or rules of engagement document",
      "Guarantee engagement success or detection coverage",
    ],
  },
} as const;

// ─── Accessor ─────────────────────────────────────────────────────────────────

/**
 * Returns the RoutePackContext for a given pack id, or null if unknown.
 * Safe: never throws for unknown ids.
 */
export function getPackContext(packId: string): RoutePackContext | null {
  return ROUTE_PACK_CONTEXTS[packId] ?? null;
}
