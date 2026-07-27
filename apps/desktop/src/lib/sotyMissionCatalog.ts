/**
 * Static mission catalog for the PR 5 deterministic Soty Agent.
 *
 * Each MissionDefinition describes the recommended posture, checks, resources,
 * warnings and BOFA policy for one mission type. This is the single source of
 * truth that sotyRouteBuilder.ts and sotyRouteCardPresenter.ts read from.
 *
 * Safety: no I/O, no side-effects, no external calls, no mutation.
 *         All warnings use "does not guarantee" language; no anonymity claims.
 *         BOFA active modules are disallowed by default in every mission.
 */
import type { MissionType, RouteCard } from "../types/routeCard";
import type { Mode } from "./types";
import type { EvidenceLevel } from "../types/risk";

// ─── Definition shape ────────────────────────────────────────────────────────

/** Static mission template. Copied into a RouteCard by sotyRouteBuilder.ts. */
export interface MissionDefinition {
  mission_type: MissionType;
  title: string;
  /** Short one-liner — becomes RouteCard.summary. */
  summary: string;
  /** Fuller description shown in the mission selector UI. */
  description: string;
  recommended_mode: Mode;
  /** ID of the recommended RoutePack from routePackDefaults.ts. */
  recommended_route_pack_id: string;
  required_checks: readonly string[];
  recommended_resources: readonly string[];
  risk_warnings: readonly string[];
  scope_requirements: readonly string[];
  evidence_settings: EvidenceLevel;
  /** BOFA module categories allowed for this mission. */
  bofa_allowed_modules: readonly string[];
  /** BOFA module categories that must not run for this mission. */
  bofa_disallowed_modules: readonly string[];
  next_safe_actions: readonly string[];
}

// ─── Catalog ─────────────────────────────────────────────────────────────────

export const MISSION_CATALOG: Readonly<Record<MissionType, MissionDefinition>> = {

  // 1 ──────────────────────────────────────────────────────────────────────────
  investigate_domain: {
    mission_type: "investigate_domain",
    title: "Investigate Domain",
    summary:
      "Passive intelligence gathering on a domain within authorized scope.",
    description:
      "Look up DNS history, WHOIS records, subdomains, certificates and threat" +
      " intelligence for a domain you own or are explicitly authorized to" +
      " investigate. Confirm scope before querying external services.",
    recommended_mode: "socks5",
    recommended_route_pack_id: "osint_route",
    required_checks: ["route", "dns", "scope", "evidence"],
    recommended_resources: [
      "domain_ip_reputation",
      "threat_intelligence",
      "vulnerability_intelligence",
      "reporting_abuse",
    ],
    risk_warnings: [
      "Confirm the target domain is owned, operated or client/lab authorized before making any queries.",
      "Do not query personal data without explicit written authorization.",
      "Passive lookups may reveal your query intent to third-party OSINT services.",
      "Route posture must be verified before querying external resources.",
    ],
    scope_requirements: [
      "Target domain must be declared in your active profile allowed_targets.",
      "Written authorization or client scope document must be available in evidence.",
      "Do not investigate domains outside your authorized target list.",
    ],
    evidence_settings: "standard",
    bofa_allowed_modules: ["passive_enrichment", "domain_lookup", "reputation_check"],
    bofa_disallowed_modules: ["active_probe", "active_scanner", "exploitation", "credential_access"],
    next_safe_actions: [
      "Confirm profile has the target domain in allowed_targets.",
      "Verify SOTY Score ≥ 70 (SOTY_READY or SOTY_WARN) before querying external services.",
      "Enable evidence logging before starting lookups.",
      "Document all query targets and results in the evidence session.",
      "Review OSINT Navigator category policy before selecting data sources.",
    ],
  },

  // 2 ──────────────────────────────────────────────────────────────────────────
  analyze_ip: {
    mission_type: "analyze_ip",
    title: "Analyze IP Address",
    summary:
      "Passive reputation and threat intelligence lookup for an IP address.",
    description:
      "Check reputation data, ASN information, geolocation and threat feeds for an IP" +
      " belonging to your owned infrastructure, authorized client systems or a lab" +
      " environment. Passive lookups only by default.",
    recommended_mode: "socks5",
    recommended_route_pack_id: "osint_route",
    required_checks: ["route", "dns", "scope", "evidence"],
    recommended_resources: [
      "domain_ip_reputation",
      "threat_intelligence",
      "ioc_lookup",
    ],
    risk_warnings: [
      "Confirm the IP belongs to an asset you own, operate or are authorized to assess.",
      "Do not perform active probing against the IP without written scope confirmation.",
      "Route posture must be verified before querying external services.",
    ],
    scope_requirements: [
      "Target IP must be declared in or derivable from your active profile allowed_targets.",
      "Active probing requires explicit written authorization beyond passive lookups.",
      "Do not query IPs outside your authorized target list.",
    ],
    evidence_settings: "standard",
    bofa_allowed_modules: ["passive_enrichment", "reputation_check", "ioc_lookup"],
    bofa_disallowed_modules: ["active_probe", "active_scanner", "exploitation", "credential_access"],
    next_safe_actions: [
      "Confirm the IP is within authorized scope before querying threat feeds.",
      "Verify SOTY Score ≥ 70 before starting lookups.",
      "Log all lookup targets in evidence.",
      "Limit to passive queries unless active probing is explicitly scoped and confirmed.",
    ],
  },

  // 3 ──────────────────────────────────────────────────────────────────────────
  check_hash: {
    mission_type: "check_hash",
    title: "Check File Hash",
    summary:
      "Passive hash lookup and malware triage for an unknown file.",
    description:
      "Submit a file hash (MD5, SHA1, SHA256) to threat intelligence feeds for" +
      " reputation and classification. Hash lookups only — do not execute unknown files." +
      " Keep the file quarantined until analysis is complete.",
    recommended_mode: "observe",
    recommended_route_pack_id: "purple_route",
    required_checks: ["route", "evidence", "host_posture_warning"],
    recommended_resources: [
      "malware_analysis",
      "threat_intelligence",
    ],
    risk_warnings: [
      "Do not execute, open or mount unknown files — hash lookup only.",
      "Keep the file isolated in a quarantine directory or read-only location.",
      "Submitting the file directly (not the hash) to online services may expose sensitive data.",
      "A clean hash result does not certify the file is safe to execute.",
    ],
    scope_requirements: [
      "File must originate from an authorized lab, client engagement or owned asset.",
      "Written authorization required if the file was obtained from a third-party system.",
    ],
    evidence_settings: "standard",
    bofa_allowed_modules: ["malware_triage", "passive_enrichment", "ioc_lookup"],
    bofa_disallowed_modules: ["execution", "active_probe", "active_scanner", "exploitation", "credential_access"],
    next_safe_actions: [
      "Compute the hash locally (e.g. certutil -hashfile or sha256sum) without submitting the file.",
      "Query hash reputation databases passively.",
      "Record all hash values and lookup results in evidence.",
      "If the hash matches a known threat, escalate per engagement rules of engagement.",
      "Do not execute or preview the file during analysis.",
    ],
  },

  // 4 ──────────────────────────────────────────────────────────────────────────
  open_osint_sources: {
    mission_type: "open_osint_sources",
    title: "Open OSINT Sources",
    summary:
      "Structured open-source intelligence gathering using policy-approved categories.",
    description:
      "Browse and query approved open-source intelligence resources across threat" +
      " intelligence, IOC lookup and documentation categories. High-risk resource" +
      " categories require explicit opt-in. No automation of personal data queries.",
    recommended_mode: "socks5",
    recommended_route_pack_id: "osint_route",
    required_checks: ["route", "dns", "scope", "evidence"],
    recommended_resources: [
      "threat_intelligence",
      "ioc_lookup",
      "domain_ip_reputation",
      "training",
      "documentation",
    ],
    risk_warnings: [
      "High-risk resource categories are opt-in and off by default.",
      "Do not use OSINT sources for personal data searches without written authorization.",
      "Do not automate personal data aggregation.",
      "Route and scope posture must be verified before accessing external sources.",
    ],
    scope_requirements: [
      "Authorized use confirmed and active profile loaded.",
      "Only use resources within the policy-approved OSINT categories.",
      "Personal data lookups are prohibited without explicit written authorization.",
    ],
    evidence_settings: "standard",
    bofa_allowed_modules: [],
    bofa_disallowed_modules: ["active_probe", "active_scanner", "exploitation", "credential_access"],
    next_safe_actions: [
      "Load an authorized profile and verify scope.",
      "Verify SOTY Score before querying external services.",
      "Enable evidence logging.",
      "Start with documentation and training resources before accessing live threat feeds.",
      "Review OSINT Navigator category policy before selecting sources.",
    ],
  },

  // 5 ──────────────────────────────────────────────────────────────────────────
  connect_to_lab: {
    mission_type: "connect_to_lab",
    title: "Connect to Lab",
    summary:
      "Establish an authorized VPN or tunnel connection to your lab environment.",
    description:
      "Connect to an authorized lab using WireGuard, SOCKS5 or equivalent. Validate" +
      " that the tunnel endpoint, DNS and route table match the expected lab configuration." +
      " Do not connect to unauthorized endpoints.",
    recommended_mode: "lab",
    recommended_route_pack_id: "lab_route",
    required_checks: ["route", "tunnel", "dns", "scope", "evidence"],
    recommended_resources: ["training", "documentation"],
    risk_warnings: [
      "Only connect to authorized lab VPN configurations.",
      "Validate the tunnel endpoint and DNS against the expected lab profile before operating.",
      "Confirm allowed_targets matches the lab subnet or authorized hosts.",
      "Kill-switch configuration is strongly recommended when connecting to lab.",
    ],
    scope_requirements: [
      "Lab endpoint must be declared in the active profile.",
      "Authorized use confirmation required before connecting.",
      "allowed_targets must list the lab subnet or authorized host range.",
      "Do not use lab credentials on systems outside the authorized lab.",
    ],
    evidence_settings: "full",
    bofa_allowed_modules: ["lab_safe", "passive_enrichment"],
    bofa_disallowed_modules: ["active_probe_external", "exploitation", "credential_access"],
    next_safe_actions: [
      "Load the lab profile and confirm allowed_targets.",
      "Verify SOTY Score — aim for SOTY_READY before connecting.",
      "Start the authorized tunnel and verify kill-switch is active.",
      "Confirm DNS resolves to expected lab servers after connection.",
      "Enable full evidence logging for the session.",
    ],
  },

  // 6 ──────────────────────────────────────────────────────────────────────────
  launch_bofa: {
    mission_type: "launch_bofa",
    title: "Launch BOFA Workflow",
    summary:
      "Prepare and verify the BOFA Route preflight before launching BOFA modules.",
    description:
      "Run the BOFA Route pre-flight check: verify scope, evidence and route posture" +
      " before any BOFA modules are allowed. Active modules require explicit scope" +
      " confirmation and a SOTY_READY or SOTY_WARN state. All BOFA actions are dry-run" +
      " staged until preflight passes.",
    recommended_mode: "lab",
    recommended_route_pack_id: "bofa_route",
    required_checks: ["route", "scope", "host", "evidence"],
    recommended_resources: ["documentation", "training"],
    risk_warnings: [
      "BOFA modules require a valid scope document and evidence enabled before any action.",
      "Active BOFA modules are blocked until preflight passes and scope is confirmed.",
      "Do not launch BOFA against systems outside the authorized scope.",
      "All BOFA actions are staged for dry-run review before execution.",
    ],
    scope_requirements: [
      "Active profile must list the BOFA target in allowed_targets.",
      "Evidence must be enabled and the directory must be ready.",
      "Authorized use confirmation required before any active modules.",
      "BOFA Gate decision must be allow before proceeding beyond preflight.",
    ],
    evidence_settings: "full",
    bofa_allowed_modules: ["preflight_check", "passive_enrichment", "scope_validation"],
    bofa_disallowed_modules: ["active_probe", "active_scanner", "exploitation", "credential_access"],
    next_safe_actions: [
      "Run SOTY Score check — aim for SOTY_READY before launching BOFA.",
      "Verify scope: confirm target is in allowed_targets and blocked_targets is clear.",
      "Enable full evidence logging and confirm evidence directory is ready.",
      "Review BOFA Gate decision — active modules remain blocked until preflight passes.",
      "Run in dry-run mode first to review all planned actions before execution.",
    ],
  },

  // 7 ──────────────────────────────────────────────────────────────────────────
  public_wifi: {
    mission_type: "public_wifi",
    title: "Public Wi-Fi Session",
    summary:
      "Harden route and tunnel posture for working from an untrusted network.",
    description:
      "Operating from a public, shared or untrusted network. Verify tunnel is" +
      " established and DNS is not leaking before any sensitive operations." +
      " Avoid sensitive authentication without a trusted tunnel.",
    recommended_mode: "wireguard",
    recommended_route_pack_id: "travel_route",
    required_checks: ["route", "dns", "proxy", "tunnel", "firewall", "evidence"],
    recommended_resources: ["privacy_self_check", "documentation"],
    risk_warnings: [
      "Untrusted network — treat all traffic as potentially observable by network operators.",
      "Avoid sensitive logins, credentials or confidential data without a trusted tunnel.",
      "Verify tunnel is established and kill-switch is active before operating.",
      "DNS leak check is critical on untrusted networks.",
      "SotyRoute does not guarantee protection against all network-level threats.",
    ],
    scope_requirements: [
      "Limit activity to operations explicitly authorized for untrusted networks.",
      "Do not access lab or sensitive systems from public networks without tunnel confirmation.",
    ],
    evidence_settings: "minimal",
    bofa_allowed_modules: [],
    bofa_disallowed_modules: [
      "active_probe",
      "active_scanner",
      "exploitation",
      "credential_access",
      "passive_enrichment",
    ],
    next_safe_actions: [
      "Connect to your authorized tunnel before any sensitive activity.",
      "Run DNS leak check after tunnel is established.",
      "Verify kill-switch is active.",
      "Minimize session scope: avoid credentials and sensitive data until posture is verified.",
      "Review SOTY Score — SOTY_EXPOSED or SOTY_BLOCKED require route fix before operating.",
    ],
  },

  // 8 ──────────────────────────────────────────────────────────────────────────
  breach_exposure_self_check: {
    mission_type: "breach_exposure_self_check",
    title: "Breach Exposure Self-Check",
    summary:
      "Check your own or authorized client assets for known breach exposure.",
    description:
      "Query breach intelligence services for your own email address, domain or" +
      " authorized client assets to assess exposure. Only check assets you own or are" +
      " explicitly authorized to assess. Do not query third-party personal data.",
    recommended_mode: "observe",
    recommended_route_pack_id: "privacy_route",
    required_checks: ["route", "scope", "evidence"],
    recommended_resources: ["breach_exposure_own_assets", "privacy_self_check"],
    risk_warnings: [
      "Only check your own email, domain or credentials, or those of explicitly authorized clients.",
      "Do not query third-party personal data without written authorization.",
      "Breach exposure services may log your query — use privacy-respecting, trusted services.",
      "Do not log sensitive query contents in plain-text evidence records.",
      "Exposure results are sensitive data — handle per your engagement disclosure rules.",
    ],
    scope_requirements: [
      "Assets under investigation must be owned or explicitly authorized in writing.",
      "Do not use this mission to investigate individuals or organizations outside your scope.",
      "Evidence logging must omit raw email addresses and credential fragments from plain text.",
    ],
    evidence_settings: "minimal",
    bofa_allowed_modules: [],
    bofa_disallowed_modules: [
      "active_probe",
      "active_scanner",
      "exploitation",
      "credential_access",
      "passive_enrichment",
    ],
    next_safe_actions: [
      "Confirm all assets are within your authorized scope before querying.",
      "Use privacy-respecting breach services that do not expose queries to third parties.",
      "Record findings but redact raw identifiers from plain-text evidence logs.",
      "Rotate any exposed credentials through your authorized credential management process.",
      "Do not redistribute breach data outside authorized disclosure channels.",
    ],
  },

  // 9 ──────────────────────────────────────────────────────────────────────────
  privacy_route: {
    mission_type: "privacy_route",
    title: "Privacy Route",
    summary:
      "Validate route, tunnel, DNS and proxy posture for privacy-sensitive operations.",
    description:
      "Establish and verify a privacy-oriented routing posture: check for DNS leaks," +
      " IPv6 leaks, proxy configuration consistency and tunnel integrity." +
      " SotyRoute validates posture — it does not guarantee anonymity.",
    recommended_mode: "wireguard",
    recommended_route_pack_id: "privacy_route",
    required_checks: ["route", "dns", "tunnel", "proxy", "ipv6_leak_check", "evidence"],
    recommended_resources: ["privacy_self_check", "documentation"],
    risk_warnings: [
      "SotyRoute validates routing posture — it does not guarantee anonymity or prevent all forms of identification.",
      "DNS leak check is essential: verify DNS resolves through the tunnel only.",
      "IPv6 leak risk must be assessed separately from IPv4 route posture.",
      "A clean SOTY Score reflects posture, not an anonymity guarantee.",
    ],
    scope_requirements: [
      "Authorized use confirmed and active profile loaded.",
      "Limit activity to operations authorized for privacy-mode routing.",
    ],
    evidence_settings: "standard",
    bofa_allowed_modules: [],
    bofa_disallowed_modules: [
      "active_probe",
      "active_scanner",
      "exploitation",
      "credential_access",
      "passive_enrichment",
    ],
    next_safe_actions: [
      "Establish tunnel and verify kill-switch is active.",
      "Run DNS leak check.",
      "Check IPv6 leak risk.",
      "Verify SOTY Score — route_score must be ≥ 60 before sensitive operations.",
      "Do not rely on SOTY Score alone as a posture guarantee.",
    ],
  },

  // 10 ─────────────────────────────────────────────────────────────────────────
  defensive_workstation_check: {
    mission_type: "defensive_workstation_check",
    title: "Defensive Workstation Check",
    summary:
      "Review local system signals: firewall, antimalware, proxy and route posture.",
    description:
      "Inspect the workstation's defensive posture — firewall state, antimalware agent" +
      " status, proxy configuration and active route table — before beginning any" +
      " operation. Host Guard is a posture reviewer, not antivirus or EDR. User-initiated only.",
    recommended_mode: "observe",
    recommended_route_pack_id: "dirty_host_check",
    required_checks: ["host", "firewall", "defender", "proxy", "route", "evidence"],
    recommended_resources: ["documentation", "training"],
    risk_warnings: [
      "Host Guard reviews posture signals — it is not antivirus, EDR or a malware scanner.",
      "A passing Host Guard result does not certify the workstation is clean.",
      "Suspicious proxy or route warnings may indicate prior compromise — investigate further.",
      "Do not connect to lab or sensitive systems until blocking host posture issues are resolved.",
    ],
    scope_requirements: [
      "Only run Host Guard on workstations you own or are authorized to assess.",
      "Do not connect to lab or sensitive systems until host posture issues are resolved.",
    ],
    evidence_settings: "standard",
    bofa_allowed_modules: [],
    bofa_disallowed_modules: [
      "active_probe",
      "active_scanner",
      "exploitation",
      "credential_access",
      "passive_enrichment",
    ],
    next_safe_actions: [
      "Run Host Guard posture review — user-initiated, no automatic changes.",
      "Review firewall state and antimalware agent status.",
      "Check for suspicious proxy settings and route warnings.",
      "Resolve any blocking SOTY Score deductions before connecting to lab or external resources.",
      "Document host posture signals in the evidence session.",
    ],
  },
} as const satisfies Readonly<Record<MissionType, MissionDefinition>>;

// ─── Convenience arrays ───────────────────────────────────────────────────────

export const MISSION_DEFINITIONS: readonly MissionDefinition[] = Object.values(
  MISSION_CATALOG
) as MissionDefinition[];
