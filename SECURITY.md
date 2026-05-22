# Security Policy

## Reporting a vulnerability

Please **do not** open public issues for security reports.

Contact: open a private GitHub Security Advisory on this repository, or reach the maintainer privately (`@descambiado`).

Include:

- Affected version / commit
- Reproduction steps
- Expected vs observed behavior
- Impact assessment (UI, agent, evidence integrity)

## Scope

SotyRoute v0.1.0 ships **non-privileged, dry-run-only** functionality. Reports about:

- Local IPC abuse between UI and the in-process backend
- Evidence tampering / path traversal in evidence directory
- Profile parser issues (YAML/JSON)
- Privilege boundary violations once the v0.2.0 agent ships

are all in scope.

Out of scope for v0.1.0:

- Bugs in upstream Tor, WireGuard, OpenVPN clients
- Network behavior of third-party VPN providers
- Browser-level leaks (WebRTC, DNS-over-HTTPS) — documented as limitation

## Disclosure

Coordinated disclosure with a default 90-day window from acknowledgement.
