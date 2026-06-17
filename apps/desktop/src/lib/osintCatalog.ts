/**
 * OSINT Navigator resource catalog.
 *
 * Safety rules enforced by this catalog:
 * - No people-search / data-broker / doxxing tools
 * - No credential-dump lookup services
 * - No dark web marketplace indexes
 * - No scraping automation
 * - No fraud / carding / illegal marketplace resources
 * - Blocked entries are labeled risk: "blocked" with url: "" and are never openable
 * - All allowed_use strings are audited by the test suite for banned phrases
 */
import type { OsintResource } from "../types/osintNavigator";

export const OSINT_CATALOG: readonly OsintResource[] = [

  // ─── Low risk — no confirmation modal required ───────────────────────────────

  {
    id: "mitre_attack",
    name: "MITRE ATT&CK",
    url: "https://attack.mitre.org",
    categories: ["threat_intelligence", "documentation"],
    risk: "low",
    description:
      "Globally accessible knowledge base of adversary tactics, techniques and procedures based on real-world observations.",
    allowed_use:
      "Reference adversary TTPs for defensive planning, detection engineering, and authorized purple-team exercises.",
    requires_confirmation: false,
    relevant_missions: ["open_osint_sources", "defensive_workstation_check", "investigate_domain"],
    relevant_pack_ids: ["osint_route", "purple_route", "lab_route"],
  },
  {
    id: "mitre_defend",
    name: "MITRE D3FEND",
    url: "https://d3fend.mitre.org",
    categories: ["documentation", "threat_intelligence"],
    risk: "low",
    description:
      "Ontology of cybersecurity countermeasures mapped to ATT&CK offensive techniques.",
    allowed_use:
      "Defensive control selection, detection engineering, and security gap analysis for authorized environments.",
    requires_confirmation: false,
    relevant_missions: ["defensive_workstation_check", "open_osint_sources"],
    relevant_pack_ids: ["purple_route", "lab_route"],
  },
  {
    id: "nvd_nist",
    name: "NVD (National Vulnerability Database)",
    url: "https://nvd.nist.gov",
    categories: ["vulnerability_intelligence"],
    risk: "low",
    description:
      "NIST's comprehensive vulnerability database with CVSS scores, references, and CPE mappings.",
    allowed_use:
      "Vulnerability research, patch prioritization, and CVE-ID lookup for authorized environments.",
    requires_confirmation: false,
    relevant_missions: ["open_osint_sources", "connect_to_lab", "defensive_workstation_check"],
    relevant_pack_ids: ["lab_route", "purple_route", "osint_route"],
  },
  {
    id: "cve_org",
    name: "CVE.org",
    url: "https://www.cve.org",
    categories: ["vulnerability_intelligence", "documentation"],
    risk: "low",
    description:
      "Official CVE Program website. Authoritative source for CVE records and vulnerability identifiers.",
    allowed_use:
      "Vulnerability identification and reference. Authorized defensive research only.",
    requires_confirmation: false,
    relevant_missions: ["open_osint_sources", "connect_to_lab"],
    relevant_pack_ids: ["lab_route", "purple_route"],
  },
  {
    id: "arin_whois",
    name: "ARIN WHOIS",
    url: "https://search.arin.net",
    categories: ["domain_ip_reputation"],
    risk: "low",
    description:
      "Authoritative IP address and ASN registration data for the ARIN region (North America).",
    allowed_use:
      "Identify IP address and ASN ownership for authorized infrastructure review and abuse reporting.",
    requires_confirmation: false,
    relevant_missions: ["investigate_domain", "analyze_ip"],
    relevant_pack_ids: ["osint_route", "lab_route", "bofa_route"],
  },
  {
    id: "abuseipdb",
    name: "AbuseIPDB",
    url: "https://www.abuseipdb.com",
    categories: ["ioc_lookup", "reporting_abuse"],
    risk: "low",
    description:
      "Community-driven IP reputation database and abuse reporting platform.",
    allowed_use:
      "Look up IP reputation and report abusive IPs observed in authorized monitoring contexts. Do not report IPs from unauthorized environments.",
    requires_confirmation: false,
    relevant_missions: ["analyze_ip", "investigate_domain", "open_osint_sources"],
    relevant_pack_ids: ["osint_route", "purple_route"],
  },
  {
    id: "spamhaus",
    name: "Spamhaus",
    url: "https://www.spamhaus.org",
    categories: ["domain_ip_reputation", "reporting_abuse", "threat_intelligence"],
    risk: "low",
    description:
      "Blocklists and threat intelligence covering spam, malware distribution, and botnet command infrastructure.",
    allowed_use:
      "Check IP and domain reputation against blocklists. Report spam or malware infrastructure observed in authorized defensive contexts.",
    requires_confirmation: false,
    relevant_missions: ["investigate_domain", "analyze_ip", "open_osint_sources"],
    relevant_pack_ids: ["osint_route", "purple_route"],
  },
  {
    id: "have_i_been_pwned",
    name: "Have I Been Pwned",
    url: "https://haveibeenpwned.com",
    categories: ["breach_exposure_own_assets", "privacy_self_check"],
    risk: "low",
    description:
      "Check whether email addresses or domains appear in publicly disclosed data breach datasets.",
    allowed_use:
      "Check only email addresses or domains you own or are explicitly authorized to check on behalf of. Do not query addresses belonging to third parties without authorization.",
    requires_confirmation: false,
    relevant_missions: ["breach_exposure_self_check", "privacy_route"],
    relevant_pack_ids: ["privacy_route", "student_route"],
  },
  {
    id: "sans_isc",
    name: "SANS Internet Storm Center",
    url: "https://isc.sans.edu",
    categories: ["threat_intelligence", "documentation"],
    risk: "low",
    description:
      "Daily threat intelligence diaries, IP reputation queries, and community security incident reporting.",
    allowed_use:
      "Defensive research, threat intelligence review, and IOC lookup for authorized monitoring and incident response contexts.",
    requires_confirmation: false,
    relevant_missions: ["open_osint_sources", "investigate_domain", "analyze_ip"],
    relevant_pack_ids: ["osint_route", "purple_route"],
  },
  {
    id: "bgpview",
    name: "BGPView",
    url: "https://bgpview.io",
    categories: ["domain_ip_reputation"],
    risk: "low",
    description:
      "BGP routing information, ASN lookups, IP prefix announcements, and peering relationships.",
    allowed_use:
      "Authorized network intelligence: AS origin verification, IP prefix ownership, and routing path research for infrastructure you own or are authorized to assess.",
    requires_confirmation: false,
    relevant_missions: ["analyze_ip", "investigate_domain"],
    relevant_pack_ids: ["osint_route", "lab_route"],
  },
  {
    id: "cyberchef",
    name: "CyberChef",
    url: "https://gchq.github.io/CyberChef/",
    categories: ["malware_analysis", "documentation"],
    risk: "low",
    description:
      "In-browser data manipulation tool: encoding, hashing, encryption, file carving. Runs entirely client-side — no data is sent to a server.",
    allowed_use:
      "Local file and data analysis. CyberChef runs entirely in-browser — no data leaves your machine when used offline or with the hosted version in isolation.",
    requires_confirmation: false,
    relevant_missions: ["check_hash", "open_osint_sources"],
    relevant_pack_ids: ["student_route", "osint_route", "purple_route"],
  },
  {
    id: "urlhaus",
    name: "URLhaus (abuse.ch)",
    url: "https://urlhaus.abuse.ch",
    categories: ["reporting_abuse", "threat_intelligence"],
    risk: "low",
    description:
      "Community-driven malicious URL tracking and abuse reporting. Maintains a live feed of URLs distributing malware.",
    allowed_use:
      "Look up and report malicious URLs observed in authorized security monitoring. Do not access or visit listed malicious URLs.",
    requires_confirmation: false,
    relevant_missions: ["investigate_domain", "open_osint_sources"],
    relevant_pack_ids: ["osint_route", "purple_route"],
  },
  {
    id: "tryhackme",
    name: "TryHackMe",
    url: "https://tryhackme.com",
    categories: ["training"],
    risk: "low",
    description:
      "Browser-based, gamified security training with structured learning paths and isolated lab environments.",
    allowed_use:
      "Training and skill development only. All activities run in TryHackMe's isolated environments under their authorized-use terms.",
    requires_confirmation: false,
    relevant_missions: ["open_osint_sources", "connect_to_lab"],
    relevant_pack_ids: ["student_route"],
  },
  {
    id: "osint_framework",
    name: "OSINT Framework",
    url: "https://osintframework.com",
    categories: ["documentation"],
    risk: "low",
    description:
      "Structured map of OSINT tool categories and resource links maintained by the security community.",
    allowed_use:
      "Reference catalog for authorized OSINT research. Individual tools linked from the framework vary in risk — vet each before use.",
    requires_confirmation: false,
    relevant_missions: ["open_osint_sources"],
    relevant_pack_ids: ["osint_route", "student_route"],
  },

  // ─── Medium risk — confirmation modal required ────────────────────────────────

  {
    id: "virustotal",
    name: "VirusTotal",
    url: "https://www.virustotal.com",
    categories: ["ioc_lookup", "malware_analysis"],
    risk: "medium",
    description:
      "Multi-engine file, URL, domain, and IP analysis service. Submissions are public and accessible to VirusTotal users and commercial partners.",
    allowed_use:
      "Authorized IOC analysis and malware investigation. Do not submit files containing PII, proprietary data, or credentials. Submissions are visible to third parties.",
    requires_confirmation: true,
    relevant_missions: ["check_hash", "investigate_domain", "analyze_ip", "open_osint_sources"],
    relevant_pack_ids: ["osint_route", "purple_route", "lab_route", "bofa_route"],
  },
  {
    id: "urlscan_io",
    name: "urlscan.io",
    url: "https://urlscan.io",
    categories: ["ioc_lookup", "domain_ip_reputation"],
    risk: "medium",
    description:
      "Automated browser-based URL scanning with screenshot capture. Scan results are public by default.",
    allowed_use:
      "Analyze suspicious URLs observed in authorized investigations. Do not scan internal, sensitive, or authenticated URLs — results are public by default.",
    requires_confirmation: true,
    relevant_missions: ["investigate_domain", "analyze_ip", "open_osint_sources"],
    relevant_pack_ids: ["osint_route", "purple_route"],
  },
  {
    id: "threatfox",
    name: "ThreatFox (abuse.ch)",
    url: "https://threatfox.abuse.ch",
    categories: ["threat_intelligence", "ioc_lookup"],
    risk: "medium",
    description:
      "Community IOC sharing platform covering malware C2 IPs, domains, URLs, and file hashes.",
    allowed_use:
      "Look up and contribute malware IOCs in authorized incident response and threat hunting contexts.",
    requires_confirmation: true,
    relevant_missions: ["investigate_domain", "analyze_ip", "check_hash"],
    relevant_pack_ids: ["osint_route", "purple_route"],
  },
  {
    id: "malwarebazaar",
    name: "MalwareBazaar (abuse.ch)",
    url: "https://bazaar.abuse.ch",
    categories: ["malware_analysis", "threat_intelligence"],
    risk: "medium",
    description:
      "Repository of malware samples shared by the security community. Contains live malware files.",
    allowed_use:
      "Hash lookup and malware sample research in authorized analysis contexts. Do not execute samples outside an isolated, authorized analysis environment.",
    requires_confirmation: true,
    relevant_missions: ["check_hash", "open_osint_sources"],
    relevant_pack_ids: ["osint_route", "purple_route", "lab_route"],
  },
  {
    id: "anyrun",
    name: "ANY.RUN",
    url: "https://any.run",
    categories: ["malware_analysis"],
    risk: "medium",
    description:
      "Interactive online malware sandbox. Submitted samples are analyzed inside an isolated cloud VM with live process and network visualization.",
    allowed_use:
      "Authorized dynamic malware analysis. Do not submit files containing PII or sensitive proprietary data. Use only with samples you are authorized to analyze.",
    requires_confirmation: true,
    relevant_missions: ["check_hash", "open_osint_sources"],
    relevant_pack_ids: ["lab_route", "purple_route"],
  },
  {
    id: "hybrid_analysis",
    name: "Hybrid Analysis",
    url: "https://www.hybrid-analysis.com",
    categories: ["malware_analysis"],
    risk: "medium",
    description:
      "Free malware analysis service powered by Falcon Sandbox. Provides behavioral reports and extracted network IOCs.",
    allowed_use:
      "Authorized malware analysis. Do not submit files containing PII, proprietary information, or credentials.",
    requires_confirmation: true,
    relevant_missions: ["check_hash", "open_osint_sources"],
    relevant_pack_ids: ["lab_route", "purple_route"],
  },

  // ─── High risk — explicit confirmation, authorized scope only ─────────────────

  {
    id: "shodan",
    name: "Shodan",
    url: "https://www.shodan.io",
    categories: ["domain_ip_reputation"],
    risk: "high",
    description:
      "Internet-wide device and service discovery engine. Returns banners, certificates, and service fingerprints for internet-exposed infrastructure.",
    allowed_use:
      "Review exposure of infrastructure you own or are explicitly authorized to assess. Do not use to enumerate targets outside your written authorization scope.",
    requires_confirmation: true,
    relevant_missions: ["analyze_ip", "investigate_domain", "connect_to_lab"],
    relevant_pack_ids: ["lab_route", "purple_route", "bofa_route"],
  },
  {
    id: "censys",
    name: "Censys",
    url: "https://search.censys.io",
    categories: ["domain_ip_reputation"],
    risk: "high",
    description:
      "Internet-wide certificate and banner scanning data. Provides host and certificate intelligence on internet-exposed systems.",
    allowed_use:
      "Authorized infrastructure exposure review. Use only against assets within your declared and authorized scope.",
    requires_confirmation: true,
    relevant_missions: ["analyze_ip", "investigate_domain"],
    relevant_pack_ids: ["purple_route", "bofa_route"],
  },
  {
    id: "exploit_db",
    name: "Exploit-DB",
    url: "https://www.exploit-db.com",
    categories: ["vulnerability_intelligence"],
    risk: "high",
    description:
      "Archive of public exploits and proof-of-concept code for disclosed vulnerabilities. Maintained by Offensive Security.",
    allowed_use:
      "Authorized lab environments and scoped testing with written authorization only. Do not use exploit code against systems you do not own or are not explicitly authorized to test.",
    requires_confirmation: true,
    relevant_missions: ["connect_to_lab", "open_osint_sources"],
    relevant_pack_ids: ["lab_route", "purple_route", "bofa_route"],
  },

  // ─── Blocked by policy — visible, never openable ──────────────────────────────

  {
    id: "blocked_people_search",
    name: "People-Search / Data Broker Tools",
    url: "",
    categories: ["domain_ip_reputation"],
    risk: "blocked",
    description:
      "Tools that aggregate personal data to locate or profile private individuals using commercially compiled records.",
    allowed_use:
      "Blocked by policy. People-search and data-broker tools present significant privacy and legal risks and are not authorized within any SotyRoute workflow.",
    requires_confirmation: false,
    relevant_missions: [],
    relevant_pack_ids: [],
  },
  {
    id: "blocked_credential_lookup",
    name: "Credential Dump Lookup Services",
    url: "",
    categories: ["breach_exposure_own_assets"],
    risk: "blocked",
    description:
      "Services that provide lookup into stolen credential datasets sourced from data breaches.",
    allowed_use:
      "Blocked by policy. Querying stolen credential databases is not authorized in any SotyRoute workflow.",
    requires_confirmation: false,
    relevant_missions: [],
    relevant_pack_ids: [],
  },
  {
    id: "blocked_dark_web_index",
    name: "Dark Web / .onion Directories",
    url: "",
    categories: ["threat_intelligence"],
    risk: "blocked",
    description:
      "Indexes or directories of .onion services including markets, forums, and underground services.",
    allowed_use:
      "Blocked by policy. Dark web navigation is outside the scope of SotyRoute's authorized defensive workflows. Threat intelligence derived from dark web sources should be consumed through authorized commercial TI platforms.",
    requires_confirmation: false,
    relevant_missions: [],
    relevant_pack_ids: [],
  },
];

// ─── Convenience helpers ───────────────────────────────────────────────────────

export const OSINT_CATALOG_BY_ID: Readonly<Record<string, OsintResource>> = Object.fromEntries(
  OSINT_CATALOG.map(r => [r.id, r])
);
