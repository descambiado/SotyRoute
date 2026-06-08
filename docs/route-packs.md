# Route Packs

> **Status: design spec — not implemented in v0.2.x.** The pack catalog and loader are planned
> for the v0.3.0 SOTY track (PR 6); types land in PR 2. This document describes the intended
> behaviour.

A **Route Pack** is a higher-level bundle that selects a mode, a set of checks, an evidence level
and a BOFA integration mode for a particular kind of operator and task. Where a **profile**
(`examples/profiles/`) describes *one* routing configuration, a Route Pack describes *how a whole
class of work should be set up to be SOTY-ready*.

Packs **compose** the existing profile schema (`profiles.rs`) — they do not replace it. Selecting
a pack pre-fills the checks, scope expectations and evidence settings that the Soty Agent and SOTY
Score then operate on.

## 1. Pack schema

Each pack defines (final struct in PR 2):

| Field | Meaning |
|---|---|
| `description` | What the pack is for. |
| `target_user` | Who it is aimed at (e.g. student, privacy-conscious user, purple team). |
| `enabled_checks` | Route Guard / Host Guard checks turned on for this pack. |
| `required_confirmations` | Explicit confirmations the operator must give before proceeding. |
| `osint_categories` | Which Ethical OSINT Navigator categories are in scope (default-allowed only, unless opted in). |
| `evidence_level` | How much evidence the pack records. |
| `bofa_integration_mode` | `disabled` / `gated` / `enabled` — how BOFA modules are treated. |
| `safety_warnings` | Pack-specific cautions shown up front. |

## 2. Predefined packs

| Pack | Target user | Default posture |
|---|---|---|
| **Student Route** | Learners / CTF / home lab | Conservative; education-focused OSINT; BOFA disabled. |
| **Privacy Route** | Privacy-conscious operator | Leak-aware checks; own-asset breach exposure; no offensive modules. |
| **OSINT Route** | Analyst opening external sources | Default-allowed OSINT categories; external browser only; no scraping. |
| **Purple Route** | Purple team / detection eng | Defensive posture + scoped offensive context; BOFA gated. |
| **Lab Route** | Authorized lab operator | Scope-bound profile; full evidence; BOFA gated. |
| **Travel Route** | Operating from untrusted networks | Public-WiFi warnings; tunnel-required gates. |
| **Dirty Host Check** | Triage of a suspect workstation | Host Guard posture checks; no lab connection. |
| **BOFA Route** | Authorized engagement using BOFA | Strictest gates; scope + evidence + confirmation required. |

## 3. Worked example — Student Route

```jsonc
{
  "name": "Student Route",
  "description": "A conservative route for learners working in their own home lab or CTF.",
  "target_user": "Students, CTF players, self-taught operators in owned/authorized labs.",
  "enabled_checks": [
    "public_ip", "dns_servers", "gateway", "active_interface", "tunnel_detection"
  ],
  "required_confirmations": [
    "I am working only in my own lab or an authorized CTF.",
    "I understand SotyRoute does not make me anonymous."
  ],
  "osint_categories": ["training", "documentation", "security_communities"],
  "evidence_level": "standard",
  "bofa_integration_mode": "disabled",
  "safety_warnings": [
    "This pack is for learning. Do not point any tool at systems you do not own or are not authorized to test."
  ]
}
```

## 4. Relationship to profiles and scope

- A pack selects a base **mode** and pre-fills checks; the operator still supplies a **profile**
  with concrete `allowed_targets` / `blocked_targets` for scope.
- A pack never widens scope on its own — scope is always operator-declared and validated.
- `bofa_integration_mode` feeds the **BOFA Gate**: a pack can only ever *narrow* what BOFA may do,
  never bypass the gate. See [docs/bofa-integration.md](bofa-integration.md).

## 5. Route Pack schema status (PR 2)

The following TypeScript types and data are now available (PR 2, frontend-only):

- `BofaIntegrationMode` — `"disabled" | "gated" | "enabled"`.
- `RoutePack` — the full pack record shape.
- `DEFAULT_ROUTE_PACKS` — all 8 packs as a readonly const array in
  `apps/desktop/src/lib/routePackDefaults.ts`.

The pack loader, UI and runtime selection arrive in PR 6.

## 6. Roadmap position

- **PR 2** — schema/types for Route Packs.
- **PR 6** — pack catalog + loader (this document's behaviour).

See [docs/roadmap.md](roadmap.md).
