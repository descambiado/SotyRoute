# SotyRoute documentation

The [project README](../README.md) is the short version. This is the map of everything else. Machine-readable version for AI tools: [`llms.txt`](../llms.txt).

## Start here

| Doc | What it covers |
|---|---|
| [Demo walkthrough](demo-walkthrough.md) | An 11-step tour of the `/soty` dashboard, from the score to local exports |
| [Lab demo](lab-demo.md) | A safe end-to-end run of the classic Observe / dry-run flow, with no network changes |
| [SOTY Score](soty-score.md) | The five sub-scores, weights, deductions, states — and which signals are real today |

## Concepts

| Doc | What it covers |
|---|---|
| [Route Packs](route-packs.md) | The 8 workflow bundles that pre-set mode, checks, evidence level and BOFA mode |
| [Soty Agent](soty-agent.md) | The deterministic mission-to-route builder that produces Route Cards (no external AI) |
| [Host Guard](host-guard.md) | Read-only host posture checks — a posture check, not an antivirus or EDR |
| [Ethical OSINT Navigator](osint-navigator.md) | The local, authorized resource catalog with confirmation gates and blocked-by-policy entries |
| [Evidence model](evidence-model.md) | Evidence snapshots, redaction guarantees and the on-disk layout |
| [BOFA Gate](bofa-gate.md) | The local go/no-go decision for BOFA-style workflows — it never launches BOFA |

## Integrations

| Doc | What it covers |
|---|---|
| [AI & MCP integration](ai-integration.md) | The planned local MCP server for AI agents, its security model and its limits |
| [BOFA integration](bofa-integration.md) | The preflight contract BOFA workflows can consume |
| [SotyHUB integration](sotyhub-integration.md) | How SotyRoute relates to the SotyHUB platform (local export only, no upload) |
| [SotyHUB export](sotyhub-export.md) | The `sotyhub_export.json` format |

## Architecture & design

| Doc | What it covers |
|---|---|
| [Architecture](architecture.md) | Layers, IPC contract and data flow |
| [Windows architecture](windows-architecture.md) | Windows-specific technical decisions |
| [Scope architecture](soty-scope-architecture.md) | The design for making the Scope sub-score real |
| [Threat model](threat-model.md) | What SotyRoute helps with — and what it does not protect against |

## Project

| Doc | What it covers |
|---|---|
| [Roadmap](roadmap.md) | What is shipped, what is in progress and what is deliberately out of scope |
| [Comparison](comparison.md) | SotyRoute versus a VPN, Nipe, proxychains and manual setup |
| [Legal & ethical scope](legal-scope.md) | Authorized use only, and what that means |
| [Release notes](release-notes/) | Draft milestone notes (currently [the SOTY real-signals demo](release-notes/v0.4.0-soty-demo.md)) |
| [Screenshots](assets/README.md) | The real UI captures, how they were taken and what they do and do not show |

Also at the repository root: [CHANGELOG](../CHANGELOG.md) · [CONTRIBUTING](../CONTRIBUTING.md) · [AGENTS.md](../AGENTS.md) · [SECURITY](../SECURITY.md) · [CODE_OF_CONDUCT](../CODE_OF_CONDUCT.md).
