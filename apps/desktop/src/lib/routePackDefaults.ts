import type { RoutePack } from "../types/routePack";

/**
 * Predefined route packs for the v0.3.0 SOTY direction.
 * These are inert data — the loader and UI arrive in PR 6.
 *
 * Packs compose the existing YAML profile schema: they narrow posture,
 * they never widen scope. BOFA modes: disabled < gated < enabled.
 */
export const DEFAULT_ROUTE_PACKS: readonly RoutePack[] = [
  {
    id: "student_route",
    name: "Student Route",
    description:
      "A conservative route for learners working in their own home lab or an authorized CTF environment.",
    target_user: "Students, CTF players, self-taught operators on owned or authorized infrastructure.",
    enabled_checks: [
      "public_ip",
      "dns_servers",
      "gateway",
      "active_interface",
      "tunnel_detection",
    ],
    required_confirmations: [
      "I am working only in my own lab or an authorized CTF.",
      "I understand SotyRoute does not make me anonymous.",
      "I will not point any tool at systems I do not own or am not authorized to test.",
    ],
    osint_categories: ["training", "documentation", "security_communities"],
    evidence_level: "standard",
    bofa_integration_mode: "disabled",
    safety_warnings: [
      "This pack is for learning. Authorized targets only.",
      "SotyRoute does not make you anonymous.",
    ],
    default_mission_types: [
      "investigate_domain",
      "check_hash",
      "open_osint_sources",
    ],
  },
  {
    id: "privacy_route",
    name: "Privacy Route",
    description:
      "A privacy-aware route for operators who need to check their own exposure before connecting to external sources.",
    target_user: "Privacy-conscious operators validating their own leak posture.",
    enabled_checks: [
      "public_ip",
      "dns_servers",
      "gateway",
      "active_interface",
      "tunnel_detection",
      "ipv6_leak_warning",
      "proxy_settings",
    ],
    required_confirmations: [
      "I am checking my own exposure only.",
      "I understand SotyRoute does not guarantee anonymity.",
    ],
    osint_categories: ["privacy_self_check", "breach_exposure_own_assets"],
    evidence_level: "standard",
    bofa_integration_mode: "disabled",
    safety_warnings: [
      "SotyRoute does not guarantee anonymity.",
      "This pack does not hide you from a determined adversary with legal process.",
    ],
    default_mission_types: ["privacy_route", "breach_exposure_self_check"],
  },
  {
    id: "osint_route",
    name: "OSINT Route",
    description:
      "A curated route for analysts opening external intelligence sources within the allowed OSINT category policy.",
    target_user: "Threat intelligence analysts, SOC analysts opening authorized OSINT tools.",
    enabled_checks: [
      "public_ip",
      "dns_servers",
      "active_interface",
      "tunnel_detection",
      "proxy_settings",
    ],
    required_confirmations: [
      "I will use OSINT sources only for authorized intelligence tasks.",
      "I will not scrape, automate queries, or log credentials from OSINT sources.",
    ],
    osint_categories: [
      "threat_intelligence",
      "ioc_lookup",
      "domain_ip_reputation",
      "malware_analysis",
      "vulnerability_intelligence",
    ],
    evidence_level: "full",
    bofa_integration_mode: "disabled",
    safety_warnings: [
      "OSINT resources open in the external system browser. No embedded WebView.",
      "High-risk categories (pastebin search, dark web, people search) are not enabled in this pack.",
      "SotyRoute does not scrape and does not log your queries.",
    ],
    default_mission_types: [
      "investigate_domain",
      "analyze_ip",
      "check_hash",
      "open_osint_sources",
    ],
  },
  {
    id: "purple_route",
    name: "Purple Route",
    description:
      "A route for purple team and detection engineers who need scoped offensive context alongside defensive posture checks.",
    target_user:
      "Purple team operators, detection engineers with written authorization for their lab environment.",
    enabled_checks: [
      "public_ip",
      "dns_servers",
      "gateway",
      "active_interface",
      "tunnel_detection",
      "proxy_settings",
      "ipv6_leak_warning",
    ],
    required_confirmations: [
      "I hold written authorization for all targets in my scope.",
      "I am operating within a scoped engagement or an authorized lab.",
      "I understand BOFA modules are gated and require a passing SOTY Score.",
    ],
    osint_categories: [
      "threat_intelligence",
      "ioc_lookup",
      "malware_analysis",
      "vulnerability_intelligence",
      "reporting_abuse",
    ],
    evidence_level: "full",
    bofa_integration_mode: "gated",
    safety_warnings: [
      "BOFA modules require scope confirmation and a passing SOTY Score.",
      "All activity must be within your written authorization boundary.",
    ],
    default_mission_types: [
      "investigate_domain",
      "analyze_ip",
      "check_hash",
      "connect_to_lab",
      "defensive_workstation_check",
    ],
  },
  {
    id: "lab_route",
    name: "Lab Route",
    description:
      "A scope-bound route for authorized lab operators connecting to lab infrastructure.",
    target_user:
      "Lab operators with a valid scope profile (authorized_targets declared in YAML profile).",
    enabled_checks: [
      "public_ip",
      "dns_servers",
      "gateway",
      "active_interface",
      "tunnel_detection",
      "proxy_settings",
      "route_table",
    ],
    required_confirmations: [
      "I have a valid scope profile with allowed_targets declared.",
      "I hold written authorization for all lab targets.",
      "BOFA modules require a passing SOTY Score and scope validation.",
    ],
    osint_categories: [
      "threat_intelligence",
      "ioc_lookup",
      "vulnerability_intelligence",
    ],
    evidence_level: "full",
    bofa_integration_mode: "gated",
    safety_warnings: [
      "Scope validation is the operator's responsibility.",
      "Evidence is mandatory in this pack.",
    ],
    default_mission_types: [
      "connect_to_lab",
      "launch_bofa",
      "investigate_domain",
    ],
  },
  {
    id: "travel_route",
    name: "Travel Route",
    description:
      "A route for operators working from untrusted networks such as airports, hotels, or public WiFi.",
    target_user:
      "Operators on untrusted public networks who need to verify posture before any sensitive work.",
    enabled_checks: [
      "public_ip",
      "dns_servers",
      "gateway",
      "active_interface",
      "tunnel_detection",
      "ipv6_leak_warning",
      "proxy_settings",
    ],
    required_confirmations: [
      "I understand this network is untrusted.",
      "I will not connect to sensitive lab resources until my tunnel is verified.",
    ],
    osint_categories: [],
    evidence_level: "standard",
    bofa_integration_mode: "disabled",
    safety_warnings: [
      "Captive portal risk: DNS and routing may be intercepted by the network.",
      "Do not connect to lab infrastructure until your tunnel is verified and your SOTY Score is READY.",
      "SotyRoute does not hide you from the network operator.",
    ],
    default_mission_types: ["public_wifi", "privacy_route"],
  },
  {
    id: "dirty_host_check",
    name: "Dirty Host Check",
    description:
      "A triage route for assessing the defensive posture of a workstation before using it for security work.",
    target_user:
      "Operators who need to assess a host they have not used recently or that may be in an unknown state.",
    enabled_checks: [
      "active_interface",
      "proxy_settings",
      "tunnel_detection",
      "dns_servers",
      "public_ip",
    ],
    required_confirmations: [
      "I am assessing a host I own or administer.",
      "I understand Host Guard is not an antivirus or EDR.",
    ],
    osint_categories: [],
    evidence_level: "full",
    bofa_integration_mode: "disabled",
    safety_warnings: [
      "Host Guard is not an antivirus or EDR. It provides defensive posture checks only.",
      "A passing Host Guard check does not guarantee the host is clean.",
      "Do not connect to lab infrastructure from this host until triage is complete.",
    ],
    default_mission_types: ["defensive_workstation_check"],
  },
  {
    id: "bofa_route",
    name: "BOFA Route",
    description:
      "The strictest route: all gates required before any BOFA module can run. For authorized engagements only.",
    target_user:
      "Operators running BOFA workflows against scoped, authorized targets with full evidence.",
    enabled_checks: [
      "public_ip",
      "dns_servers",
      "gateway",
      "active_interface",
      "tunnel_detection",
      "proxy_settings",
      "ipv6_leak_warning",
      "route_table",
    ],
    required_confirmations: [
      "I hold explicit written authorization for all targets in my scope.",
      "I have reviewed the BOFA Gate requirements.",
      "Scope is valid, evidence is enabled, and I have confirmed authorized use.",
      "I understand SotyRoute is not an offensive payload and BOFA must be used within its own authorization model.",
    ],
    osint_categories: [
      "threat_intelligence",
      "ioc_lookup",
      "domain_ip_reputation",
      "malware_analysis",
      "vulnerability_intelligence",
    ],
    evidence_level: "full",
    bofa_integration_mode: "enabled",
    safety_warnings: [
      "BOFA modules will not run if scope is invalid, the SOTY Score is below threshold, or evidence is off.",
      "All activity must stay within your written authorization boundary.",
      "SotyRoute does not ship offensive payloads and does not evade law enforcement.",
    ],
    default_mission_types: [
      "launch_bofa",
      "connect_to_lab",
      "investigate_domain",
      "analyze_ip",
    ],
  },
] as const;
