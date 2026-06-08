# Soty Agent

> **Status: design spec — not implemented in v0.2.x.** The local rule engine is planned for the
> v0.3.0 SOTY track (PR 5); its types land in PR 2. **No external AI API is called in this
> direction yet.** This document describes the intended behaviour.

The **Soty Agent** is an AI-assisted **OPSEC route builder**. You tell it your mission; it
produces a **Route Card** — a recommended, scope-aware, evidence-backed plan for becoming
SOTY-ready before you start.

The agent **only recommends.** It never mutates the system. Like the existing planner
(`planner.rs`), every output is a dry-run plan gated behind explicit operator confirmation.

## 1. Deterministic first, LLM-ready later

v0.3.0 ships a **local deterministic rule engine**: a mission maps, through fixed rules, to a
Route Card. There is no network call and no model inference.

The UI copy and the Route Card contract are designed so an LLM can later be slotted in *behind*
the same interface — turning free-text missions into structured Route Cards — without changing the
safety model. Until then, free-text missions are matched against the known mission catalog below.

## 2. Mission catalog

The operator can pick or type a mission:

- Investigate a domain
- Analyze an IP
- Check a hash
- Open OSINT sources
- Connect to a lab
- Launch BOFA
- Work from public WiFi
- Check personal / domain breach exposure (own assets)
- Prepare a privacy route
- Perform a defensive workstation check

Missions outside this catalog are not invented or guessed at — the agent asks the operator to pick
the closest supported mission rather than fabricating a route.

## 3. Route Card

The agent's output is a **Route Card**. Intended shape (final struct defined in PR 2):

| Field | Meaning |
|---|---|
| `mission` | The selected/typed mission. |
| `recommended_mode` | One of the existing modes: `observe` / `tor` / `wireguard` / `socks5` / `lab`. |
| `required_checks` | Route Guard / Host Guard checks that must pass first. |
| `recommended_tools` | Tools and OSINT resources appropriate to the mission (links open in the external browser; no embedded WebView). |
| `risk_warnings` | Mission-specific risks, using the existing `Warning` `{code, severity, message}` shape. |
| `scope_requirements` | What scope must be declared/valid (ties to profile `allowed_targets`). |
| `evidence_settings` | Evidence level the mission expects (and whether evidence is mandatory). |
| `bofa_modules` | BOFA modules marked allowed / disallowed for this mission (see [BOFA Gate](bofa-integration.md)). |
| `next_safe_actions` | The concrete, reversible next steps. |

### Worked example (illustrative)

Mission **"work from public WiFi"** might yield:

- `recommended_mode`: `observe` (then a user-provided tunnel before any sensitive work)
- `required_checks`: public IP visible, DNS servers, gateway, tunnel detection, IPv6 leak warning
- `risk_warnings`: captive-portal risk, untrusted network, DNS interception risk
- `scope_requirements`: none for observation; scope required before any lab connection
- `evidence_settings`: evidence on, standard level
- `bofa_modules`: **all disallowed** until a tunnel is up and scope is valid
- `next_safe_actions`: start your authorized tunnel → re-run Route Guard → re-check SOTY Score

## 4. Safety model

- **Recommend, don't execute.** A Route Card is a plan, not an action.
- **Dry-run + confirm.** Any action a Route Card suggests still flows through the existing
  dry-run planner and an explicit confirmation gate.
- **Scope-bound.** The agent will not recommend targets outside declared scope.
- **No high-risk automation.** It does not scrape, does not search credential dumps, and does not
  open policy-blocked OSINT categories. See [docs/legal-scope.md](legal-scope.md).

## 5. PR 5 local route builder status

The deterministic Mission-to-Route Builder is now live (PR 5, frontend-only).
No external AI is called. No system checks are run. The builder is a pure
local rule engine.

**Route `/soty` — Mission Builder section in `src/pages/SotyDashboard.tsx`:**

- **Mission type grid** — 10 mission buttons; selecting one shows the mission description.
- **"Build Route Card" button** — calls `buildRouteCard(missionType)` (pure, deterministic).
- **Route Card panel** — full `SotyRouteCardPanel` showing all RouteCard fields:
  recommended mode, recommended route pack, required checks, risk warnings, scope
  requirements, evidence settings, BOFA allowed/disallowed modules, and next safe actions.
- **Disclaimer badge**: "Local deterministic planner — no external AI call in this version."
- **"Build Mission Route" CTA** (previously disabled) now scrolls to the builder.

**New library files:**

| File | Purpose |
|---|---|
| `src/lib/sotyMissionCatalog.ts` | Static definitions for all 10 missions (`MissionDefinition` shape, `MISSION_CATALOG` record). |
| `src/lib/sotyRouteBuilder.ts` | `buildRouteCard(missionType, options?)` — pure, deterministic, no I/O. |
| `src/lib/sotyRouteCardPresenter.ts` | Presenter helpers: `missionTypeToLabel`, `modeToLabel`, `evidenceLevelToHint`, `routeCardBofaSummary`, `recommendedRoutePackId`, etc. |

**New components in `src/components/soty/`:**
`SotyMissionBuilder` (controlled mission selector), `SotyRouteCardPanel` (card display).

**Tests:** 61 new unit tests across `sotyRouteBuilder.test.ts` and
`sotyRouteCardPresenter.test.ts`, including:
- every MissionType generates a RouteCard ✓
- determinism with fixed timestamp ✓
- BOFA is fully blocked for `public_wifi` ✓
- `privacy_route` disclaims anonymity in risk_warnings ✓
- `check_hash` warns against executing unknown files ✓
- no RouteCard contains unsafe wording (doxxing, guaranteed anonymity, etc.) ✓

Total vitest suite: 183 passing. No Rust changes. No external API calls. No system mutations.

## 6. Route Card type status (PR 2)

The following TypeScript types are now available (PR 2, frontend-only):

- `MissionType` — the ten mission values and the `MISSION_TYPES` runtime array.
- `RouteCard` — the full Route Card record shape.

## 7. Roadmap position

- **PR 2** — schema/types for the Route Card. ✓ Done
- **PR 5** — Mission-to-Route builder (this document's behaviour). ✓ Done
- **PR 8** — Route Cards reference the Ethical OSINT Navigator catalog.

See [docs/roadmap.md](roadmap.md).
