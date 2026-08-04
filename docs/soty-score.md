# SOTY Score

> **Status: design spec — not implemented in v0.2.x.** The deterministic scoring engine is
> planned for the v0.3.0 SOTY track (PR 3). Types land in PR 2. This document describes the
> intended behaviour so the schema and engine can be built against a stable contract.

The **SOTY Score** answers one question before you operate: *are you SOTY-ready?*

It is a readiness score, not a security guarantee. A high score means your routing posture, host
posture, scope, intel and evidence settings are consistent with disciplined operation. It does
**not** mean you are anonymous, clean, or safe — see [docs/legal-scope.md](legal-scope.md) and
[docs/threat-model.md](threat-model.md).

## 1. Sub-scores

The Overall SOTY Score is composed from five explainable sub-scores. Each is `0–100`.

| Sub-score | Question it answers | Primary signals (existing today) |
|---|---|---|
| **Route Score** | Where is my traffic going, and is the tunnel what I think it is? | Doctor route/DNS/gateway/interface checks and tunnel detection in `system.rs` |
| **Host Score** | Is my workstation in a defensible posture? | Host Guard posture checks *(planned, PR 7)* |
| **Scope Score** | Am I bound to authorized targets only? | Profile `allowed_targets` / `blocked_targets` in `profiles.rs` |
| **Intel Score** | Am I using OSINT sources responsibly and within policy? | Ethical OSINT Navigator category policy *(planned, PR 8)* |
| **Evidence Score** | Will this session be auditable? | Evidence pipeline in `evidence.rs` (`session.json`, `evidence.md`, exports) |
| **Overall SOTY Score** | Am I SOTY-ready overall? | Weighted roll-up of the five sub-scores |

Sub-scores that depend on not-yet-shipped modules (Host, Intel) will report a neutral
"not assessed" state until those modules land, rather than inflating or deflating the overall
score.

## 2. States

The Overall SOTY Score maps to one of five states. The state — not the raw number — is what the
dashboard leads with.

| State | Meaning | Operator action |
|---|---|---|
| `SOTY_READY` | Route, scope and evidence are consistent with disciplined operation. | Proceed within scope. |
| `SOTY_WARN` | Operational but with non-blocking issues worth reviewing. | Review warnings; fix before high-stakes work. |
| `SOTY_EXPOSED` | A posture problem likely leaks who/where you are (e.g. unexpected public IP, DNS leak). | Fix the exposure before touching external sources. |
| `SOTY_DIRTY` | The host or route shows signs that make it unsafe to operate from. | Investigate the host; do not connect to labs. |
| `SOTY_BLOCKED` | A hard requirement failed (e.g. scope invalid, evidence disabled for a gated action). | Resolve the blocker; gated actions stay disabled. |

State naming reuses the existing UI status vocabulary where possible: the dashboard renders these
through the existing `StatusBadge` variants (`ok` / `warn` / `info` / `danger` / `idle`).

## 3. Explainability

Every deduction must be explainable. The score is never a bare number: each point lost carries a
**reason** and a **recommended fix**. This keeps the score actionable and prevents "mystery
scores."

The intended shape of a single deduction (final struct defined in PR 2):

```jsonc
{
  "sub_score": "route",
  "points": -20,
  "code": "PUBLIC_IP_UNEXPECTED",
  "severity": "warn",          // reuses Warning severity: "info" | "warn" | "error"
  "reason": "Public IP is visible and no tunnel was detected for this mode.",
  "recommended_fix": "Start your authorized tunnel, or switch to Observe mode if exposure is acceptable for this task."
}
```

A score report is then: the five sub-scores, the overall score, the resulting state, and a flat
list of deductions — each pointing back at the sub-score it affected.

## 4. Design principles

- **Deterministic first.** v0.3.0 ships a local rule engine with fixed weights and codes. No
  external AI call is involved in producing a score.
- **Additive, versioned.** Score fields follow the same additive-evolution rule as the evidence
  exports (`schema` bumped on breaking change). See [CHANGELOG.md](../CHANGELOG.md).
- **Never over-claims.** "Not assessed" is a first-class value. The score reflects only what was
  actually checked.
- **Evidence-linked.** The full score report is written into the session evidence bundle so a
  reviewer can reconstruct why an operator was (or was not) SOTY-ready.

## 5. PR 3 engine status

The deterministic scoring engine is now implemented (PR 3, frontend-only). No UI yet — that arrives in PR 4.

**Implemented in `apps/desktop/src/lib/`:**

- `sotyScoreRules.ts` — `SotyScoreInput` type; five pure rule functions (`routeRules`, `hostRules`, `scopeRules`, `intelRules`, `evidenceRules`); `applyDeductions()`.
- `sotyScoreState.ts` — `weightedOverall()` (route 30% · host 20% · scope 25% · intel 10% · evidence 15%) and `determineSotyState()`.
- `sotyScoreEngine.ts` — `computeSotyScore(input, options?)` entry point. Pure, side-effect free, deterministic.

**Deduction IDs implemented:**
`ROUTE_NO_PUBLIC_IP`, `ROUTE_NO_DNS`, `ROUTE_DNS_MISMATCH`, `ROUTE_TUNNEL_MISSING`, `ROUTE_IPV6_LEAK`, `ROUTE_SUSPICIOUS_PROXY`, `ROUTE_NO_ROUTE_TABLE`, `ROUTE_KILL_SWITCH_UNAVAILABLE`, `ROUTE_KILL_SWITCH_DISABLED`; `HOST_OS_UNDETECTED`, `HOST_FIREWALL_DISABLED`, `HOST_DEFENDER_DISABLED`, `HOST_SUSPICIOUS_PROXY`, `HOST_SUSPICIOUS_ROUTE`, `HOST_GUARD_UNAVAILABLE`; `SCOPE_NO_PROFILE`, `SCOPE_INVALID_PROFILE`, `SCOPE_NO_TARGET`, `SCOPE_OUT_OF_SCOPE` (blocking), `SCOPE_BLOCKED_TARGET` (blocking), `SCOPE_NO_AUTHORIZATION`; `INTEL_NO_ROUTE_PACK`, `INTEL_NO_OSINT_CATEGORIES`, `INTEL_HIGH_RISK_RESOURCE`, `INTEL_BLOCKED_RESOURCE` (blocking), `INTEL_QUERY_LOGGING`; `EVIDENCE_DISABLED`, `EVIDENCE_LEVEL_OFF`, `EVIDENCE_LEVEL_MINIMAL`, `EVIDENCE_DIR_NOT_READY`, `EVIDENCE_NO_SESSION_ID`.

**Tests:** 46 unit tests across `sotyScoreEngine.test.ts` and `sotyScoreState.test.ts`.

## 6. PR 4 dashboard status

The SOTY Score dashboard is now live (PR 4, frontend-only). No real system checks run yet —
the dashboard uses four deterministic demo presets computed from the PR 3 engine.

**Route `/soty` — `src/pages/SotyDashboard.tsx`:**

- **Demo preset selector** — four presets (SOTY_READY / SOTY_WARN / SOTY_EXPOSED /
  SOTY_BLOCKED) computed by `computeSotyScore()` with crafted `SotyScoreInput` objects.
- **Big SOTY Score hero** — circular ring coloured by state (ok/warn/danger), operator copy,
  blocking deduction count.
- **Sub-score grid** — five cards (Route 30%, Host 20%, Scope 25%, Intel 10%, Evidence 15%)
  with colour-coded values and hint text.
- **Deduction list** — every deduction with severity badge, reason, signal reference, and
  points lost. Blocking deductions flagged with red left border and BLOCKING badge.
- **Recommended fix list** — de-duplicated fixes extracted from deductions; shows action type,
  confirmation requirement, and autorun safety.
- **Route Pack quick actions** — interactive 8-pack grid preview (UI-only; loader arrives PR 6).
- **CTA placeholders** — five action buttons (Make me SOTY-ready · Build Mission Route ·
  Run Host Guard · Open OSINT Navigator · Launch BOFA Route) are all **disabled** with
  `title` tooltip explaining which future PR enables each. No mutations occur.

**Supporting components in `src/components/soty/`:**
`SotyStateBadge`, `SotyScoreHero`, `SotySubscoreGrid`, `SotyDeductionList`,
`RecommendedFixList`, `RoutePackQuickActions`.

**New presenter helpers in `src/lib/sotyPresenter.ts`:**
`sotyStateToVariant()`, `sotyStateToCopy()`, `scoreToVariant()`, `severityToVariant()`,
`subscoreHint()`, `dedupFixes()`.

**Tests:** 57 new unit tests across `sotyDemoInput.test.ts` and `sotyPresenter.test.ts`.

Total vitest suite: 122 passing. No Rust changes. No external API calls. No system mutations.

## 8. PR 6 Route Pack context status

Route Packs are now interactive workflow presets that influence the SOTY Score dashboard
context (PR 6, frontend-only). Selecting a pack updates the demo score preset, shows
score focus bars and compatible missions.

**New demo preset: `SOTY_DIRTY`**

A fifth demo preset (`dirty`) has been added to `src/lib/sotyDemoInput.ts`:
- `firewall_enabled: false` → HOST_FIREWALL_DISABLED (−20, high)
- `defender_enabled: false` → HOST_DEFENDER_DISABLED (−20, high)
- `host_guard_available: false` → HOST_GUARD_UNAVAILABLE (−10, info)
- Result: host_score = 50 → **SOTY_DIRTY** state (host < 60, no blocking deductions)

All five SOTY states are now reachable from the demo preset selector.

**Pack-to-score-context integration:**

| Pack | Suggested demo preset | Rationale |
|---|---|---|
| Student, Privacy, OSINT, Purple | `warn` | Non-blocking issues typical for these workflows |
| Lab, BOFA | `blocked` | Scope gate not yet confirmed — most restrictive start |
| Travel | `exposed` | Untrusted network → tunnel likely absent |
| Dirty Host Check | `dirty` | Host posture is the focus; firewall and antimalware checks expected to fail |

When a pack is selected, the demo preset auto-updates to the pack's suggested context.
The operator can override via the preset selector at any time. **No system state is changed.**

**Score focus visualization:**

Each pack now shows a five-bar focus visualization (Route / Host / Scope / Intel / Evidence)
indicating which sub-scores this pack's workflow exercises most. Data lives in
`src/lib/sotyRoutePackContext.ts`; display helpers in `src/lib/sotyRoutePackPresenter.ts`.

**Safety guarantees maintained in PR 6:**
No system mutations. No external API calls. No firewall/DNS/proxy changes.
No OSINT URLs. No BOFA launch. No host scanning.
Route Packs remain workflow preview contexts and recommendation surfaces only.

Total vitest suite: 257 passing. No Rust changes.

## 7. PR 2 schema status

The following TypeScript types are now available (PR 2, frontend-only):

- `SotyState` — the five state values and the `SOTY_STATES` runtime array.
- `ScoreCategory`, `ScoreSeverity`, `ActionType` — supporting types.
- `RecommendedFix`, `ScoreDeduction` — explainable deduction shape.
- `SotyScore` — the full score record.
- `createEmptySotyScore()` — fail-closed factory (state: `SOTY_BLOCKED`, all sub-scores 0).
- `SCORE_RANGE` — `{ min: 0, max: 100 }` constant.
- `SUB_SCORE_FIELDS` — ordered list of sub-score field names.

Rust serde structs and the scoring engine arrive in PR 3.

## 9. PR 7 Host Guard status

Host Guard posture checks are now implemented (PR 7, demo mode). The "Run Host Guard" CTA on
the dashboard is enabled. Clicking it runs the deterministic engine against demo signals
matching the active preset — no real system calls are made.

**New in PR 7:**

- `src/types/hostGuard.ts` — `HostGuardStatus`, `HostGuardCheckId`, `HostGuardCheckPhase`,
  `HostGuardCheck`, `HostGuardInput`, `HostGuardSummary`.
- `src/lib/sotyHostGuardEngine.ts` — `runHostGuard(input)` pure function; `DEMO_HOST_GUARD_INPUTS`
  (one per DemoPresetKey); `HOST_GUARD_LIMITATION_COPY`.
- `src/lib/sotyHostGuardMapper.ts` — `hostGuardToHostInput(summary)` maps Host Guard results
  back to a `SotyScoreInput["host"]`-compatible shape.
- `src/lib/sotyHostGuardPresenter.ts` — `statusToVariant()`, `statusToLabel()`, `overallCopy()`.
- `src/components/soty/SotyHostGuardPanel.tsx` — phase-grouped check display.
- `src/pages/SotyDashboard.tsx` — "Run Host Guard" enabled; panel rendered below CTAs.
- `docs/host-guard.md` — full Host Guard doc with check table, limitation copy, and Host-Score mapping.

**Host Guard → Host Score mapping:**

| Host Guard check | SOTY deduction when failing |
|---|---|
| `HG_FIREWALL` | `HOST_FIREWALL_DISABLED` (−20 pts, high) |
| `HG_DEFENDER` | `HOST_DEFENDER_DISABLED` (−15 pts, medium) |
| `HG_SUSPICIOUS_PROXY` | `HOST_SUSPICIOUS_PROXY` (−20 pts, high) |
| `HG_SUSPICIOUS_ROUTE` | `HOST_SUSPICIOUS_ROUTE` (−20 pts, high) |

See [docs/host-guard.md](host-guard.md) for the full check catalog and limitation copy.

**Safety guarantees maintained in PR 7:**
No system mutations. No external API calls. No firewall/routing/DNS/proxy changes.
No process killing. No memory scanning. No AV/EDR replacement claims.
Host Guard is a read-only posture check surface — it cannot guarantee the host is clean.

## 10. PR 8 Ethical OSINT Navigator status

The Ethical OSINT Navigator is now live on the SOTY Dashboard (PR 8, frontend-only). "Open
OSINT Navigator" CTA enabled. The navigator displays a local catalog of 26 authorized
defensive research resources with category and risk filters, confirmation gates, and
blocked-by-policy cards.

**New in PR 8:**

- `src/types/osintNavigator.ts` — `OsintRiskLevel`, `OsintCategory`, `OsintResource`,
  `OsintFilterState`, `OsintConfirmationStatus`, `OsintConfirmationState`.
- `src/lib/osintCatalog.ts` — 26 resources (14 low, 6 medium, 3 high, 3 blocked);
  `OSINT_CATALOG_BY_ID` lookup; all allowed-use copy audited against banned phrases.
- `src/lib/osintNavigatorPresenter.ts` — `riskToVariant()`, `riskToConfirmationWarning()`,
  `filterResources()`, label maps, `OSINT_LIMITATION_COPY`, `OSINT_EXTERNAL_RESOURCE_WARNING`.
- `src/components/soty/SotyOsintNavigator.tsx` — filter bar + resource grid + confirmation modal.
- `src/components/soty/OsintResourceCard.tsx` — per-resource card with risk badge, categories,
  allowed-use, mission relevance, and open/blocked action.
- `src/components/soty/OsintConfirmationModal.tsx` — risk-aware confirmation gate; copies URL
  to clipboard (Tauri `shell::open` is a future-PR placeholder).
- `docs/osint-navigator.md` — full doc: risk levels, categories, resource catalog, blocked list.

**SOTY Intel sub-score connection:**

The `intel_score` (10% of overall) is influenced by whether an appropriate route pack is
selected and whether OSINT categories are enabled. The OSINT Navigator surfaces the resources
within those enabled categories.

**Safety guarantees maintained in PR 8:**
No external API calls. No WebView embedding. No scraping automation. No query logging.
No people-search, credential-dump, or dark-web resources are openable.
Blocked entries are visible as policy cards but have no action available.
All allowed-use copy audited by test suite for banned phrases.

## 11. PR 9 Evidence Snapshot status

SOTY Dashboard sessions can now produce a local evidence snapshot (PR 9, frontend-only).
Clicking "Generate Evidence" assembles a `SotyEvidenceSnapshot` from the current dashboard
state and renders it in a panel with copy-to-clipboard actions. No filesystem writes in PR 9.

**New in PR 9:**

- `src/types/sotyEvidence.ts` — `SotyEvidenceSnapshot` and all sub-summary types.
- `src/lib/sotyEvidenceBuilder.ts` — `buildEvidenceSnapshot()` pure function; assembles snapshot
  from score, route pack, route card, Host Guard summary, and OSINT catalog counts.
- `src/lib/sotyEvidenceRedaction.ts` — `isUnsafeFieldName()`, `stripUnsafeFields()`,
  `deepStripUnsafeFields()` — defence-in-depth field stripping before serialization.
- `src/lib/sotyEvidenceMarkdown.ts` — `renderEvidenceMarkdown()` — 10-section evidence.md preview.
- `src/lib/sotyEvidenceJson.ts` — `renderEvidenceJson()` — sorted, stable JSON serialization.
- `src/components/soty/SotyEvidencePanel.tsx` — inline panel with score, pack, card, Host Guard,
  OSINT summary, redaction guarantees, and copy-to-clipboard actions.
- `src/pages/SotyDashboard.tsx` — "Generate Evidence" CTA enabled; snapshot clears on preset change.
- `docs/evidence-model.md` — full evidence model documentation.

**Evidence Score connection:**

The Evidence sub-score (15% of overall) reflects whether the session has evidence enabled,
an active evidence directory, and a session ID. In PR 9, the snapshot captures the current
`evidence_score` from the active demo preset. Filesystem integration that would actually
advance the Evidence Score arrives in PR 10.

**Safety guarantees maintained in PR 9:**
No query content, credentials, tokens, cookies, or external page content captured.
No external API calls. No filesystem writes. No system mutations.
Redaction guarantees are structurally false at the type level — not runtime-derived.

## 10. PR 15 + PR 19 — real Host Guard and Route Guard now feed the live score

Two corrections to the sections above, now that real signal collection exists:

- **PR 15** made Host Guard read real signals from the local machine (firewall, Defender, proxy,
  known tunnel processes, elevation) — the "no real system calls are made" line in §9 was
  accurate for PR 7 at the time, but is stale now. However, PR 15 only wired those real signals
  into the standalone Host Guard panel — `hostGuardToHostInput()` (§9, PR 7) existed but was
  never actually called from `SotyDashboard.tsx`, so the Score ring and sub-score grid kept
  showing the static demo `host_score` regardless of what Host Guard found.
- **PR 19** closed that gap and added the same treatment for Route:
  - `src-tauri/src/route_guard.rs` — `collect_route_guard_signals()`: DNS servers and public IP
    (reused from `system::collect_doctor()`), tunnel-process and proxy checks (reused from
    `host_guard`), and a new route-table-readable check. No new external call — the public-IP
    lookup only runs if the operator already enabled it in Settings.
  - `src/lib/sotyRouteGuardReal.ts` — `mapRouteSignalsToScoreInput()` maps real signals to
    `SotyScoreInput["route"]`. `dns_matches_profile` stays `null` (Scope-sub-score work, not yet
    wired), `ipv6_leak_risk` stays `false` (not yet implemented, documented as such — never
    fabricates a leak finding), `kill_switch_available`/`kill_switch_enabled` stay `null` (no
    generic Windows API for an arbitrary VPN client's kill-switch state).
  - `src/lib/sotyDemoInput.ts` — now also exports `DEMO_SCORE_INPUTS` (the underlying
    `SotyScoreInput` objects, not just the precomputed `SotyScore` results) and
    `DEMO_PRESET_PROFILE_NAMES`, so the dashboard can override individual sub-inputs.
  - `src/pages/SotyDashboard.tsx` — the displayed `score` is now `computeSotyScore()` called
    live on every render: the selected demo preset's base input, with `route` overridden by
    `mapRouteSignalsToScoreInput()` once Route Guard has run, and `host` overridden by the
    now-actually-used `hostGuardToHostInput()` once Host Guard has run. Scope/Intel/Evidence
    remain demo-based until their own real-signal work lands. Real signals persist across demo
    preset changes — switching presets no longer silently discards a real check result.

Scope, Intel, and Evidence sub-scores are the remaining follow-up: Scope needs real loaded-profile
state, Intel needs live Route Pack/OSINT Navigator selection state, and Evidence needs to reflect
whether a snapshot was actually generated/saved this session — none of these require new external
calls, all are wiring work against state that already exists in the app.

## 12. PR 20 — real Intel signals (Route Pack + OSINT Navigator)

Intel turned out to need no new system signal at all — Route Pack selection and OSINT Navigator
category/risk filters were already real, in-memory UI state on `SotyDashboard.tsx`; the score
input just never read them.

- `src/components/soty/SotyOsintNavigator.tsx` — new optional `onFiltersChange` prop, reported via
  `useEffect` on every filter change, so the dashboard can read the Navigator's live
  `OsintFilterState` without the Navigator needing to know about scoring.
- `src/lib/sotyIntelReal.ts` (NEW) — `mapIntelToScoreInput()`:
  - `route_pack_selected` / `osint_categories_selected` / `high_risk_resource_enabled` fall back to
    the demo preset's value until the operator has actually touched the corresponding control this
    session (Route Pack selection, or the OSINT Navigator's filters), then reflect the real state
    from then on — including a real `false` if that's what the operator's own selection means. This
    mirrors the Host/Route Guard precedent of only overriding once positive evidence exists, so the
    showcase demo presets (e.g. `SOTY_READY`) aren't degraded just because the page loaded and
    nothing has been clicked yet.
  - `blocked_resource_requested` is always real `false`, unconditionally — `OsintResourceCard.tsx`
    renders blocked-risk resources as a static "Blocked by policy" badge with no click handler at
    all, so there is no code path by which one could ever be requested. This is a structural
    guarantee verified by reading the component, not a demo guess.
  - `query_logging_disabled` always passes through the demo value. The deduction it backs
    (`INTEL_QUERY_LOGGING`) asks whether the *operator's own browser or OSINT tools* log queries
    externally — that is outside anything SotyRoute itself can observe, so it stays manual/demo
    until a future PR adds an explicit operator attestation control, the same treatment already
    given to `dns_matches_profile` in §10.
- `src/pages/SotyDashboard.tsx` — new `routePackTouched` and `osintFilters` state; `scoreInput`
  composition extended with a live `intel` override alongside the existing `route`/`host` ones.

Scope and Evidence remain the last two demo-based sub-scores.

## 13. Evidence Guard — real evidence-readiness signals

Evidence's fields split cleanly into two groups once checked against what `AppSettings` and the
evidence pipeline actually track today:

- **Real and live** (both have an active deduction rule):
  - `evidence_directory_ready` — a genuine read-only filesystem check: the configured
    `evidence_dir` exists, is a directory, and is not marked read-only. Deliberately never
    creates the directory or writes a probe file to test it — a fresh install with nothing
    there yet is reported honestly as not ready, not silently fixed by the check itself.
  - `session_id_available` — proxied by "at least one session has ever been recorded"
    (`evidence::list_sessions().len() > 0`). Imperfect (it answers "has this pipeline ever run,"
    not "is a session ID assigned right now") but honest and documented as such, the same
    trade-off already accepted for `tunnel_process_running` in Route Guard.
- **Real but currently inert**: `bofa_export_enabled` / `sotyhub_export_enabled` map directly to
  `AppSettings.export_bofa_default` / `export_sotyhub_default` — but neither field is referenced
  by any deduction rule in `evidenceRules()` today, so wiring them real has no visible score
  effect yet. Still worth doing: it avoids a future landmine where someone adds a deduction for
  either field and it silently starts scoring real users against stale demo defaults.
- **No real backing exists**: `evidence_enabled` and `evidence_level` have no corresponding field
  anywhere in `AppSettings` or `Profile` — `evidence_level` in particular is a 4-state concept
  (`off`/`minimal`/`standard`/`full`) that doesn't exist in the real settings schema at all. Both
  stay demo-based, the same treatment given to `query_logging_disabled` in §12.

Implementation, mirroring Host/Route Guard exactly (a "Run Evidence Guard" CTA, not always-live
like Intel — the directory-readiness check needs actual read-only I/O, and gating behind an
explicit action keeps a fresh install from looking artificially bad before the operator asks):

- `src-tauri/src/evidence_guard.rs` (NEW) — `collect_evidence_guard_signals()`. Reuses
  `evidence::load_settings()` and `evidence::list_sessions()` rather than duplicating either.
- `src-tauri/src/commands.rs` — `run_evidence_guard_signals` Tauri command.
- `src/lib/sotyEvidenceGuardReal.ts` (NEW) — `mapEvidenceSignalsToScoreInput()`.
- `src/pages/SotyDashboard.tsx` — "Run Evidence Guard" CTA and results panel, live `evidence`
  override added to the score composition alongside `route`/`host`/`intel`.

Scope is now the only sub-score still fully demo-based.

## 14. Roadmap position

- **PR 2** — schema/types for the score report and deductions. ✓ Done
- **PR 3** — deterministic scoring engine. ✓ Done
- **PR 4** — dashboard surfaces the big SOTY Score and state. ✓ Done
- **PR 5** — Mission Route builder (Soty Agent). ✓ Done
- **PR 6** — Route Pack context, score integration, and mission suggestions. ✓ Done
- **PR 7** — Host Guard posture scan (user-initiated; no auto-mutation). ✓ Done
- **PR 8** — Ethical OSINT Navigator. ✓ Done
- **PR 9** — score report folded into the Evidence Engine. ✓ Done
- **PR 10** — BOFA Gate and export extension. ✓ Done
- **PR 15** — Host Guard reads real signals. ✓ Done
- **PR 19** — Route Guard reads real signals; Host + Route now feed the live Score. ✓ Done
- **PR 20** — Intel reads real Route Pack/OSINT Navigator selection state. ✓ Done
- **Evidence Guard** — real evidence-readiness signals (directory, session count, export
  settings). ✓ Done
- **PR 58** — Scope architecture design (planning only, no implementation). ✓ Done
- **PR 59** — shared active-profile state (`ActiveProfileContext`, `Profiles.tsx` publishes on
  successful validation, `SotyDashboard.tsx` displays it read-only). Infrastructure only — Scope
  itself is still fully demo-based; `scope` remains absent from `SotyDashboard`'s real-signal
  override object, exactly as it was before this PR. ✓ Done
- **Follow-up** — real Scope signals: the last remaining demo-based sub-score. See
  [docs/soty-scope-architecture.md](soty-scope-architecture.md) for the full design — target
  declaration UX, exact-match scope checking, and the mapper that will actually feed
  `scoreInput.scope` — before any of that code is written.

See [docs/roadmap.md](roadmap.md).
