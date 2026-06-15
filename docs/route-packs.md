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

## 5. Mission → Route Pack mapping (PR 5)

The PR 5 Mission-to-Route Builder recommends a Route Pack for every mission type.
This is read-only UI guidance — the actual pack loader arrives in PR 6.

| Mission | Recommended Pack | Rationale |
|---|---|---|
| `investigate_domain` | **OSINT Route** | Passive domain/IP queries; reputation checks. |
| `analyze_ip` | **OSINT Route** | Passive IP reputation and threat feeds. |
| `check_hash` | **Purple Route** | Malware triage and threat intelligence. |
| `open_osint_sources` | **OSINT Route** | Policy-approved OSINT category browsing. |
| `connect_to_lab` | **Lab Route** | Authorized lab VPN; full evidence; BOFA gated. |
| `launch_bofa` | **BOFA Route** | Strictest gate; scope + evidence + preflight required. |
| `public_wifi` | **Travel Route** | Tunnel-required; public-WiFi warnings; BOFA blocked. |
| `breach_exposure_self_check` | **Privacy Route** | Own-asset check; minimal evidence; BOFA blocked. |
| `privacy_route` | **Privacy Route** | Leak-aware checks; no offensive modules. |
| `defensive_workstation_check` | **Dirty Host Check** | Host posture review; BOFA blocked until host is clean. |

The mapping is implemented in `apps/desktop/src/lib/sotyMissionCatalog.ts` via the
`recommended_route_pack_id` field on each `MissionDefinition`.

## 6. Route Pack schema status (PR 2)

The following TypeScript types and data are now available (PR 2, frontend-only):

- `BofaIntegrationMode` — `"disabled" | "gated" | "enabled"`.
- `RoutePack` — the full pack record shape.
- `DEFAULT_ROUTE_PACKS` — all 8 packs as a readonly const array in
  `apps/desktop/src/lib/routePackDefaults.ts`.

The pack loader, UI and runtime selection arrive in PR 6.

## 7. PR 6 interactive workflow status

Route Packs are now interactive workflow presets in the SOTY Score dashboard (PR 6,
frontend-only). The pack catalog, context data and presenter helpers are live.

**What is now available:**

- **`SotyRoutePackSelector`** — enhanced 8-pack grid (replaces the static PR 4 preview).
  Each card shows the compatible mission count and BOFA integration mode.
- **`SotyRoutePackDetail`** — rich detail panel shown when a pack is selected:
  - **Score focus bars** — five bars (Route / Host / Scope / Intel / Evidence) showing
    which sub-scores this pack's workflow exercises most. Levels: Low / Medium / High.
  - **Compatible mission chips** — clickable; selecting one builds a Route Card immediately
    via `buildRouteCard()` and scrolls to the Mission Builder panel.
  - **What this route improves** — honest, operator-facing benefit summary.
  - **What this route does not do** — explicit limitation copy (no unsafe wording).
  - **Required confirmations, OSINT categories, enabled checks** — from the pack definition.
  - **Safety warnings** — from the pack definition.
- **Pack → SOTY Score context** — selecting a pack auto-updates the dashboard demo preset
  to illustrate the expected SOTY state for that workflow context (e.g. Dirty Host Check →
  SOTY_DIRTY). The operator can override at any time via the preset selector.
- **Pack mismatch warning** — if a built Route Card recommends a different pack than the one
  selected, a soft inline warning is shown. Informational only.

**New library files:**

| File | Purpose |
|---|---|
| `src/lib/sotyRoutePackContext.ts` | `RoutePackContext` type and `ROUTE_PACK_CONTEXTS` record — compatible missions, score focus, demo preset, what-improves/doesn't for all 8 packs |
| `src/lib/sotyRoutePackScoring.ts` | `getPackDemoPreset()`, `getPackScoreFocus()`, `focusLevelForCategory()` — score lookups keyed by pack id |
| `src/lib/sotyRoutePackPresenter.ts` | Focus level variants/labels/percentages, `bofaModeToLabel()`, `packMismatchWarning()` |

**Safety guarantees maintained in PR 6:**
No system mutations. No firewall/DNS/proxy/routing changes. No OSINT URLs added.
No BOFA launch. No host scanning. Route Packs remain recommendation contexts only.
The `what_this_route_does_not_do` copy is audited by the test suite for unsafe phrases.

Total vitest suite: 257 passing. No Rust changes.

## 8. Roadmap position

- **PR 2** — schema/types for Route Packs. ✓ Done
- **PR 5** — Mission → Pack recommendations wired in the Route Builder. ✓ Done
- **PR 6** — Pack context, score integration, interactive mission suggestions. ✓ Done
- **PR 7** — Host Guard safe posture checks (user-initiated, no auto-mutation).
- **PR 9** — Evidence Engine extension.
- **PR 10** — BOFA Gate and export extension.

See [docs/roadmap.md](roadmap.md).
