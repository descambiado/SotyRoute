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

## v0.3.0 — Tunnels (planned, gated by review)

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
- Cross-platform parity in the first year (Windows-first by design).
- Shipping a kernel driver of our own.
