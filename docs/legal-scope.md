# Legal & Ethical Scope

SotyRoute exists to support **authorized** security work. The operator carries the legal responsibility for every action taken on or through the host running this software.

## Authorized use

SotyRoute is intended for, and only for:

- Your own infrastructure that you own and operate.
- Lab environments you control (home lab, training environments, CTF infrastructure you set up).
- Systems for which you hold **explicit written authorization** to perform security testing (a signed scope letter, Rules of Engagement, or equivalent).
- Defensive privacy posture validation on systems you administer.

## Prohibited use

Do not use SotyRoute to:

- Access systems you are not authorized to access.
- Evade law enforcement, sanctions, or court orders.
- Attempt to defeat detection on third-party infrastructure.
- Conduct unauthorized penetration testing of any third party.
- Stalk, harass, or surveil any individual.
- Circumvent geographic restrictions in violation of applicable law.

If you are unsure whether your use case qualifies as authorized: **stop and obtain written authorization first**.

## No anonymity guarantee

SotyRoute does **not** make anyone anonymous. It does not:

- Hide your identity from a determined adversary with legal process.
- Defeat browser fingerprinting.
- Defeat behavioral analytics.
- Substitute for OPSEC training.

Anyone marketing routing software as "untraceable" is either uninformed or dishonest. SotyRoute is neither.

## Not a VPN provider

SotyRoute is software. There are no SotyRoute servers. There is no SotyRoute network. WireGuard mode requires a server the operator controls or is authorized to use; Tor mode requires the operator's own Tor installation; SOCKS5 mode requires a SOCKS proxy the operator is authorized to use.

## Not an antivirus, EDR, or OSINT scraper

The SOTY direction (v0.3.0, design — see [roadmap.md](roadmap.md)) does **not** change these
boundaries:

- **Host Guard is not an antivirus or EDR.** It provides defensive posture checks and cannot
  guarantee that the host is clean.
- The **Ethical OSINT Navigator does not scrape** any source, does not log user queries, and opens
  external resources in the system browser — never an embedded WebView.
- High-risk OSINT categories (pastebin search, dark-web research, credential-exposure platforms,
  high-risk forums, people-search) are **opt-in and disabled by default**.
- Doxxing, carding, fraud, stolen-account use, CVV shops, illegal malware marketplaces and
  identity lookup without authorization are **blocked by policy** and will not be shipped as
  resources.
- SotyRoute does **not** automate credential-dump searches.

## Operator responsibility

By running SotyRoute the operator declares that they:

1. Understand the scope of their authorization.
2. Will not use the tool against unauthorized targets.
3. Accept that SotyRoute provides **no anonymity, no immunity, and no legal cover**.
4. Are responsible for compliance with all applicable laws and contracts in their jurisdiction.

## Evidence handling

Evidence files may contain hostnames, interface names, public IPs, and other information about the operator's environment. The operator is responsible for handling evidence files in accordance with their organization's data classification and retention policies.
