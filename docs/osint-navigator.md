# Ethical OSINT Navigator

**Status: implemented — PR 8 (local catalog, confirmation gates, frontend-only).**

The Ethical OSINT Navigator is a curated, read-only catalog of authorized defensive research
resources. It provides category and risk filters, per-resource allowed-use policy statements,
and a confirmation gate before any external URL is made available to the operator.

> SotyRoute does not embed, proxy, or automate queries to external OSINT resources.
> All resources open in your external browser. Authorized defensive use only — for owned assets,
> authorized targets, and written-scope engagements.

---

## Risk levels

| Risk | Meaning | Default behavior |
|---|---|---|
| `low` | Well-established defensive reference | Enabled; confirmation gate shows the URL for inspection |
| `medium` | Useful but submissions/queries may be visible to third parties | Requires confirmation; operator must review allowed-use policy |
| `high` | Contains sensitive data (scanning, exploits); misuse may violate law or policy | Requires explicit confirmation; authorized scope statement shown |
| `blocked` | Never openable — blocked by policy | Visible as a policy card; no open button available |

---

## Categories

| Category | Description |
|---|---|
| `threat_intelligence` | IOC feeds, adversary reports, threat landscape references |
| `ioc_lookup` | Single-resource IOC query (IP, domain, hash, URL) |
| `domain_ip_reputation` | WHOIS, BGP, passive DNS, internet-wide reputation |
| `malware_analysis` | Sandbox analysis, static analysis, hash/file lookup |
| `vulnerability_intelligence` | CVE databases, patch tracking, PoC archives |
| `privacy_self_check` | Check your own network footprint |
| `breach_exposure_own_assets` | Check whether your own domains/emails appeared in a breach |
| `reporting_abuse` | Report malicious infrastructure to registrars/blocklists |
| `training` | Authorized lab and skill-development platforms |
| `documentation` | Reference frameworks, TTP knowledge bases |
| `security_communities` | Researcher forums and trusted community resources |

---

## Resource catalog (PR 8)

### Low risk

| Resource | Categories |
|---|---|
| MITRE ATT&CK | threat_intelligence, documentation |
| MITRE D3FEND | documentation, threat_intelligence |
| NVD (National Vulnerability Database) | vulnerability_intelligence |
| CVE.org | vulnerability_intelligence, documentation |
| ARIN WHOIS | domain_ip_reputation |
| AbuseIPDB | ioc_lookup, reporting_abuse |
| Spamhaus | domain_ip_reputation, reporting_abuse, threat_intelligence |
| Have I Been Pwned | breach_exposure_own_assets, privacy_self_check |
| SANS Internet Storm Center | threat_intelligence, documentation |
| BGPView | domain_ip_reputation |
| CyberChef | malware_analysis, documentation |
| URLhaus (abuse.ch) | reporting_abuse, threat_intelligence |
| TryHackMe | training |
| OSINT Framework | documentation |

### Medium risk (confirmation required)

| Resource | Categories | Key risk |
|---|---|---|
| VirusTotal | ioc_lookup, malware_analysis | Submissions are public and visible to partners |
| urlscan.io | ioc_lookup, domain_ip_reputation | Scan results public by default |
| ThreatFox (abuse.ch) | threat_intelligence, ioc_lookup | Community-shared IOC data |
| MalwareBazaar (abuse.ch) | malware_analysis, threat_intelligence | Live malware samples present |
| ANY.RUN | malware_analysis | Cloud sandbox; do not submit sensitive files |
| Hybrid Analysis | malware_analysis | Do not submit files containing PII or credentials |

### High risk (explicit confirmation required)

| Resource | Categories | Key risk |
|---|---|---|
| Shodan | domain_ip_reputation | Internet-wide scanning data; authorized use only |
| Censys | domain_ip_reputation | Internet-wide certificate/banner data; authorized use only |
| Exploit-DB | vulnerability_intelligence | Contains working PoC exploit code; lab/authorized use only |

### Blocked by policy

| Entry | Reason |
|---|---|
| People-Search / Data Broker Tools | Privacy and legal risks; not authorized in any SotyRoute workflow |
| Credential Dump Lookup Services | Not authorized in any SotyRoute workflow |
| Dark Web / .onion Directories | Outside scope of authorized defensive workflows |

---

## What the OSINT Navigator does NOT do

- Does not embed or proxy external resources in a WebView
- Does not make API calls to any OSINT resource
- Does not automate queries or log your searches
- Does not open links automatically (requires explicit operator action)
- Does not include people-search, credential-dump lookup, or dark web tools
- Does not scrape any external service
- Does not perform any system mutations

---

## Confirmation gate

When an operator clicks "Open" on a non-blocked resource:

1. A modal appears showing the resource name, risk level, and allowed-use policy statement.
2. The URL is displayed for inspection (not auto-followed).
3. The operator can cancel or confirm.
4. On confirm: the URL is copied to the clipboard with a "Paste into your authorized research browser" message.

**Tauri `shell::open` integration** (which would open the URL in the system browser directly)
is a placeholder for a future PR. In PR 8, the copy-to-clipboard approach is the safe default
that requires no new Tauri command surface.

---

## Mission / Route Pack relevance

Each resource declares which missions and route packs it is most relevant to. When a Route
Pack is selected on the SOTY Score dashboard, resources relevant to that pack receive a
"Pack match" badge in the navigator.

| Pack | Relevant categories |
|---|---|
| OSINT Route | threat_intelligence, ioc_lookup, domain_ip_reputation, malware_analysis, vulnerability_intelligence |
| Purple Route | threat_intelligence, ioc_lookup, malware_analysis, vulnerability_intelligence, reporting_abuse |
| Lab Route | threat_intelligence, ioc_lookup, vulnerability_intelligence |
| Student Route | training, documentation |
| Privacy Route | privacy_self_check, breach_exposure_own_assets |

---

## Intel sub-score connection

Selecting an appropriate route pack and opening authorized OSINT sources within it
contributes to the SOTY Intel sub-score (10% of Overall Score). The categories enabled
per pack are defined in `routePackDefaults.ts` (`osint_categories` field).

---

## Follow-up PRs

- PR 9: Evidence Engine extension
- Future: Tauri `shell::open` integration for one-click browser launch
- Future: Route-pack-aware category pre-filtering based on the active pack's `osint_categories`
