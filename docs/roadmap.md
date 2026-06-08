# Roadmap

Calendar dates are intentionally absent — milestones ship when they are safe to ship.

## v0.1.0 — Foundation *(this release)*

- Tauri + React desktop UI (Windows-first).
- Pages: Dashboard, Profiles, Evidence, Doctor, Settings.
- Modes: **Observe** (real, non-destructive) + **Dry-Run** for Tor / WireGuard / SOCKS5 / Lab.
- Profile schema + YAML/JSON load + validation.
- Evidence directory + `session.json`, `checks.json`, `plan.json`, `warnings.json`, `evidence.md`.
- BOFA + SotyHUB JSON exports.
- Doctor checks: Windows version, admin status, hostname, interfaces, DNS, Tor / WireGuard detection.
- No destructive network changes.

## v0.2.0 — Agent

- Standalone Windows Service (`sotyrouted`) installed via the desktop app.
- Named-pipe IPC with restrictive SDDL.
- Controlled Windows Firewall planning + reversible rule strategy.
- Better DNS posture checks.
- Tray actions: start/stop, switch profile, open evidence.
- Persistent settings + theme.

## v0.3.0 — SOTY direction (design, gated by review)

The product gains a **readiness layer**: SotyRoute becomes an AI-assisted OPSEC route builder that
makes an operator **SOTY-ready** before they operate. Everything in this track is
**recommend-only, dry-run and evidence-first** — no destructive system changes. It ships as a
sequence of focused PRs:

- **PR 1 — Product docs** for SOTY Score, Soty Agent and Route Packs. *(this PR; docs only)*
- **PR 2 — Schemas/types** for SOTY Score, Route Card and Route Packs.
- **PR 3 — Deterministic scoring engine** (no external AI call).
- **PR 4 — Dashboard** with the big SOTY Score and state.
- **PR 5 — Mission-to-Route builder** (Soty Agent) using the local rule engine.
- **PR 6 — Route Packs** catalog + loader.
- **PR 7 — Host Guard** safe defensive posture checks (not an AV/EDR).
- **PR 8 — Ethical OSINT Navigator** (curated local catalog; external browser; no scraping).
- **PR 9 — Evidence Engine** extension (score report, route card, gate decision).
- **PR 10 — BOFA / SotyHUB export** extension (BOFA Gate).
- **PR 11 — Demo data, screenshots and README examples.**

Design specs: [soty-score.md](soty-score.md) · [soty-agent.md](soty-agent.md) · [route-packs.md](route-packs.md).

## v0.3.x — Tunnels (planned, gated by review)

- WireGuard tunnel orchestration for **user-provided** configurations (detect, validate, optionally start with explicit consent).
- Tor backend research — only ship if we can do it reversibly and honestly.
- Kill-switch prototype: firewall rule scoped to a session, automatically removed on exit.
- Full rollback system: every change tracked, every change undone on stop or crash.

## v0.4.0 — Policy

- Windows Filtering Platform (WFP) research and prototype (signed sublayer / callout).
- Signed evidence bundles (cryptographic integrity).
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
- Cross-platform parity in the first year (Windows-first by design).
- Shipping a kernel driver of our own.
