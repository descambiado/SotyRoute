# Roadmap

Calendar dates are intentionally absent — milestones ship when they are safe to ship. Last reviewed: November 2026.

## Where we are

| Track | Status |
|---|---|
| v0.1.0 — Foundation | ✓ In the codebase. No published release yet. |
| v0.3.0 — SOTY direction | ✓ In the codebase — see below. |
| Scope becomes real | **Now** — design done, shared active-profile state shipped; target declaration and the real Scope mapper remain. |
| AI & MCP integration | **Next** — AI-friendly repo files are done; the MCP server is planned. |
| First public release | **Next** — MSI with SHA-256 checksums; nothing has been published yet. |

## v0.1.0 — Foundation *(in the codebase)*

- Tauri + React desktop UI (Windows-first).
- Pages: Dashboard, Profiles, Evidence, Doctor, Settings.
- Modes: **Observe** (real, non-destructive) + **Dry-Run** for Tor / WireGuard / SOCKS5 / Lab.
- Profile schema + YAML/JSON load + validation.
- Evidence directory + `session.json`, `checks.json`, `plan.json`, `warnings.json`, `evidence.md`.
- BOFA + SotyHUB JSON exports.
- Doctor checks: Windows version, admin status, hostname, interfaces, DNS, Tor / WireGuard detection.
- No destructive network changes.

## v0.3.0 — SOTY direction *(in the codebase)*

The product gained a **readiness layer**: SotyRoute makes an operator **SOTY-ready** before they operate. Everything in this track is **recommend-only, dry-run and evidence-first** — no destructive system changes. It shipped as a sequence of focused PRs (see the [changelog](../CHANGELOG.md)):

- **SOTY Score** — deterministic, explainable scoring engine and dashboard ([soty-score.md](soty-score.md)).
- **Soty Agent** — mission-to-route builder using a local rule engine, no external AI ([soty-agent.md](soty-agent.md)).
- **Route Packs** — 8 workflow presets ([route-packs.md](route-packs.md)).
- **Ethical OSINT Navigator** — curated local catalog, no scraping ([osint-navigator.md](osint-navigator.md)).
- **Evidence snapshots** with local persistence, and **BOFA Gate + SotyHUB local exports** ([evidence-model.md](evidence-model.md), [bofa-gate.md](bofa-gate.md)).
- **Real signals, one sub-score at a time:** Host Guard → Route Guard → Intel → Evidence Guard ([host-guard.md](host-guard.md)). Route, Host, Intel and Evidence now read real signals.
- **Shared active-profile state** — the foundation for Scope.
- **Demo & docs:** real UI screenshots, a guided walkthrough and [draft milestone notes](release-notes/v0.4.0-soty-demo.md).

**Still demo-based, by design:** the Scope sub-score.

## Now — complete the SOTY Score: Scope

Target declaration UI, an exact-match scope check against the active profile's allow/block lists, an explicit authorization confirmation control, and the mapper that feeds the real Scope input — gated so the showcase presets are not degraded on first load. Design: [soty-scope-architecture.md](soty-scope-architecture.md).

## Next — AI & MCP integration

- ✓ AI-friendly repository: [`AGENTS.md`](../AGENTS.md) and [`llms.txt`](../llms.txt).
- Extract the pure scoring engine into a reusable library.
- A **local, read-only MCP server** (stdio) so AI agents can ask for a SOTY Score, a Route Card, a BOFA Gate decision or a scope check *before* they act — advisory, not enforcement.
- Distribution via npm, an MCPB bundle for Claude Desktop and the MCP Registry.

Design and limits: [ai-integration.md](ai-integration.md). SotyRoute itself never calls an AI.

## Next — first public release

A published release with an MSI and SHA-256 checksums (the release workflow already builds the MSI on every version tag, but creates a *draft*, and no release has been published yet), refreshed screenshots from the packaged app, and a demo video. The version number is decided at release time; the draft notes under `release-notes/` predate that decision.

## v0.2.0 — Agent *(planned)*

- Core engine extracted into its own crate ([#16](https://github.com/descambiado/SotyRoute/issues/16)).
- Standalone Windows Service (`sotyrouted`) installed via the desktop app ([#17](https://github.com/descambiado/SotyRoute/issues/17)).
- Named-pipe IPC with restrictive SDDL.
- Controlled Windows Firewall planning + reversible rule strategy.
- Better DNS posture checks.
- Tray actions: start/stop, switch profile, open evidence ([#10](https://github.com/descambiado/SotyRoute/issues/10)).
- Persistent settings + theme.

## v0.3.x — Tunnels *(planned, gated by review)*

- WireGuard tunnel orchestration for **user-provided** configurations (detect, validate, optionally start with explicit consent).
- Tor backend research — only ship if we can do it reversibly and honestly.
- Kill-switch prototype: firewall rule scoped to a session, automatically removed on exit.
- Full rollback system: every change tracked, every change undone on stop or crash.

## v0.4.0 — Policy *(planned)*

- Windows Filtering Platform (WFP) research and prototype (signed sublayer / callout).
- Signed evidence bundles with a SHA-256 manifest ([#20](https://github.com/descambiado/SotyRoute/issues/20)).
- BOFA preflight live integration (BOFA refuses offensive modules until SotyRoute reports `preflight_passed`).
- SotyHUB lab session adapter live.

## v1.0.0 — Stable

- Audited Windows agent.
- Audited rollback.
- Signed releases.
- Hardened evidence pipeline.
- Threat-model review by an external reviewer.
- Documentation freeze.

## Explicit non-goals

- Becoming a VPN provider.
- Bundling Tor or WireGuard binaries.
- Anonymity marketing.
- Becoming an antivirus or EDR — Host Guard provides posture checks only.
- Scraping leak sites or any external source.
- Doxxing or people-search; high-risk OSINT categories are opt-in and disabled by default.
- Automating credential-dump searches.
- SotyRoute calling an AI or LLM service — the integration direction is agents calling SotyRoute, never the reverse.
- Cross-platform parity in the first year (Windows-first by design).
- Shipping a kernel driver of our own.
