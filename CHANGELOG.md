# Changelog

All notable changes to SotyRoute are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Added (PR 11)
- `src/types/bofaGate.ts` — extended `BofaGateDecision`: adds `verdict`, `route_pack_id`,
  `soty_state`, `required_evidence_level`, `current_evidence_level`, `allowed_modules`,
  `disallowed_modules`, `blocking_reasons`, `warning_reasons`, `required_preflight_checks`,
  `evidence_snapshot_id`, `generated_at`. `BOFA_ALLOWED_MODULES` (6 safe modules) and
  `BOFA_DISALLOWED_MODULES` (7 always-disallowed modules) exported as `const` arrays.
- `src/types/sotyBofaExport.ts` — `SotyBofaExportPayload`: schema `soty_bofa_v1`, gate
  decision, module lists, redaction guarantees (all-false), local-only path note.
- `src/types/sotyHubExport.ts` — `SotyHubExportPayload`: schema `soty_hub_v1`, score/pack/
  mission/host/OSINT/BOFA gate summaries (counts only), `never_exported` list, `limitations`,
  extended redaction block including `raw_host_data_logged` and `osint_query_content_logged`.
- `src/lib/sotyBofaGate.ts` — `buildBofaGateDecision(score, routePack, snapshotId)`:
  deterministic local gate engine; no external calls. Blocked by `SOTY_BLOCKED`,
  `SOTY_EXPOSED`, `SOTY_DIRTY`, or `disabled` pack mode. `SOTY_WARN` → `warning`.
  `SOTY_READY` + gated/enabled pack → `allowed`. Per-verdict preflight check lists.
- `src/lib/sotyBofaExport.ts` — `buildBofaExportPayload()` + `renderBofaExportJson()`:
  sorted-key serializer, `deepStripUnsafeFields` applied before serialisation.
- `src/lib/sotyHubExport.ts` — `buildSotyhubExportPayload()` + `renderSotyhubExportJson()`:
  same serialisation guards; OSINT/Host Guard summaries contain counts only.
- `src/lib/sotyExportPersistence.ts` — `saveExports()` wrapper: renders both payloads and
  invokes `save_soty_exports` Tauri command; returns `SaveExportsOutcome`.
- `src/lib/sotyEvidenceRedaction.ts` — `SAFE_FIELD_EXCEPTIONS` updated with
  `osint_query_content_logged` so the new SotyHUB redaction field survives `deepStripUnsafeFields`.
- `src/components/soty/SotyBofaGatePanel.tsx` — gate decision display: verdict badge,
  allowed/disallowed module lists, blocking/warning reasons, preflight checks. Local-only notice.
- `src/components/soty/SotyExportPanel.tsx` — export UI: "Prepare BOFA export",
  "Prepare SotyHUB export", "Save exports locally" buttons with idle/preparing/saving/saved/error
  states. No external calls; no SotyHUB upload.
- `src/pages/SotyDashboard.tsx` — "Open BOFA Gate" CTA (replaces disabled "Launch BOFA Route");
  BOFA Gate + Export panel rendered below Evidence panel. Preset/pack changes clear stale gate.
- `src-tauri/src/evidence.rs` — `write_soty_exports(bofa_json, sotyhub_json)`: same path safety
  pattern as `write_soty_evidence` (internally generated timestamp directory, `validate_soty_dir_name`,
  `assert_within_evidence_root`). Returns `SotyExportSaveResult`.
- `src-tauri/src/commands.rs` — `save_soty_exports` Tauri command; no user-controlled path accepted.
- `src-tauri/src/main.rs` — `save_soty_exports` registered in `invoke_handler`.
- Tests: `sotyBofaGate.test.ts` (28 tests) — all gate verdicts, unsafe module absence, preflight
  checks, preflight_passed logic, module counts by integration mode.
  `sotyBofaExport.test.ts` (20 tests) — schema, redaction, allowed/disallowed modules, JSON safety.
  `sotyHubExport.test.ts` (22 tests) — schema, counts-only summaries, redaction including
  `osint_query_content_logged`, `never_exported`, JSON safety.
  `sotyExportPersistence.test.ts` (9 tests) — Tauri invoke command name, arg shape (no path arg),
  JSON validity, success/error paths, fixed filenames.
- `docs/bofa-gate.md` — new: gate decision model, module tables, safety boundaries.
- `docs/sotyhub-export.md` — new: SotyHUB export schema, never-exported table, limitations.
- `docs/evidence-model.md` — updated: `bofa_export.json` and `sotyhub_export.json` outputs
  marked live; PR 11 file list added.

### Added (PR 10)
- `src-tauri/src/evidence.rs` — `write_soty_evidence()` persists `soty_evidence.json` and
  `soty_evidence.md` to a new timestamped run directory under `~/.sotyroute/runs/<timestamp>_soty/`.
  `validate_soty_dir_name()` rejects path separators, parent-dir components, and non-alphanumeric
  characters. `assert_within_evidence_root()` re-validated before every write (defense in depth).
  Returns `SotyEvidenceSaveResult` with directory path and fixed filenames.
- `src-tauri/src/commands.rs` — `save_soty_evidence` Tauri command: accepts pre-rendered
  `json_content` and `md_content` strings; no user-controlled path accepted.
- `src/lib/sotyEvidencePersistence.ts` — `saveEvidenceSnapshot()` TypeScript wrapper: calls
  `renderEvidenceJson()` + `renderEvidenceMarkdown()` on the snapshot before invoking the Tauri
  command. Returns `SaveEvidenceOutcome` with status, result, and error.
- `src/components/soty/SotyEvidencePanel.tsx` — "Save to evidence directory" button enabled with
  saving/saved/error states. Success banner shows the local directory path. No external data sent.
- `src/lib/sotyEvidenceRedaction.ts` — `SAFE_FIELD_EXCEPTIONS` now exported (needed by the new
  test suite).
- Tests: `sotyEvidencePersistence.test.ts` — Tauri invoke payload shape, JSON safety (no unsafe
  keys, all-false redaction section), Markdown safety copy, success and error paths.
- `src-tauri/src/evidence.rs` — `#[cfg(test)]` module: 9 tests for `validate_soty_dir_name`
  covering empty input, path separators, parent-dir components, special characters, and valid names.
- `docs/evidence-model.md` — updated to reflect PR 10 filesystem persistence now live.

### Added (PR 9)
- `src/types/sotyEvidence.ts` — `SotyEvidenceSnapshot` and all sub-summary types:
  `SotyEvidenceScoreSummary`, `SotyEvidenceRoutePackSummary`, `SotyEvidenceRouteCardSummary`,
  `SotyEvidenceHostGuardSummary`, `SotyEvidenceOsintOpenedResource`, `SotyEvidenceOsintSummary`,
  `SotyEvidenceRedactionGuarantees`. Schema version constant `SOTY_EVIDENCE_SCHEMA_VERSION = "1"`.
- `src/lib/sotyEvidenceBuilder.ts` — `buildEvidenceSnapshot()` pure function; assembles a
  `SotyEvidenceSnapshot` from SOTY Score, Route Pack, Route Card, Host Guard, and OSINT catalog.
  No query content, credentials, tokens, or external page content captured.
- `src/lib/sotyEvidenceRedaction.ts` — `isUnsafeFieldName()`, `stripUnsafeFields()`,
  `deepStripUnsafeFields()` — defence-in-depth field stripping; safe-exception whitelist for
  redaction guarantee field names.
- `src/lib/sotyEvidenceMarkdown.ts` — `renderEvidenceMarkdown()` — 10-section evidence.md
  preview with explicit redaction copy and safety limitations.
- `src/lib/sotyEvidenceJson.ts` — `renderEvidenceJson()` — alphabetically sorted, stable JSON
  serialization with `deepStripUnsafeFields()` applied before output.
- `src/components/soty/SotyEvidencePanel.tsx` — inline panel: score summary, state badge,
  route pack/card/host guard/OSINT summaries, redaction guarantee grid, copy JSON/Markdown
  buttons, disabled "Save to evidence directory" placeholder.
- `src/pages/SotyDashboard.tsx` — "Generate Evidence" CTA enabled; snapshot clears on preset
  change; evidence panel renders below Host Guard.
- `src/styles/global.css` — evidence panel, limitation banner, score row, state badges,
  kv grid, redaction grid, and action bar styles.
- `docs/evidence-model.md` — full evidence model doc: schema, redaction guarantees, outputs,
  and what is never captured.
- Tests: `sotyEvidenceBuilder.test.ts` (57 tests), `sotyEvidenceRedaction.test.ts` (57 tests),
  `sotyEvidenceMarkdown.test.ts` (35 tests) — 149 new tests. Suite total: 497 passing.

### Added (PR 8)
- `src/types/osintNavigator.ts` — `OsintRiskLevel`, `OsintCategory`, `OsintResource`,
  `OsintFilterState`, `OsintConfirmationStatus`, `OsintConfirmationState`.
- `src/lib/osintCatalog.ts` — 26 curated resources (14 low, 6 medium, 3 high, 3 blocked).
  Blocked entries include people-search tools, credential-dump lookup, and dark-web indexes.
  All allowed-use copy audited by test suite against banned phrases. `OSINT_CATALOG_BY_ID` helper.
- `src/lib/osintNavigatorPresenter.ts` — `riskToVariant()`, `riskToConfirmationWarning()`,
  `filterResources()`, `OSINT_CATEGORY_LABELS`, `OSINT_RISK_LABELS`, `OSINT_CATEGORIES`,
  `OSINT_RISK_LEVELS`, `OSINT_LIMITATION_COPY`, `OSINT_EXTERNAL_RESOURCE_WARNING`.
- `src/components/soty/SotyOsintNavigator.tsx` — category + risk filter bar; resource grid
  split into active/blocked sections; confirmation modal state; pack-relevance badges.
- `src/components/soty/OsintResourceCard.tsx` — card with risk badge, category chips,
  description, allowed-use copy, mission tags, and open/blocked action button.
- `src/components/soty/OsintConfirmationModal.tsx` — risk-aware confirmation gate; displays
  allowed-use policy and URL for inspection; copies URL to clipboard on confirm.
  Tauri shell::open is a future-PR placeholder.
- `src/pages/SotyDashboard.tsx` — "Open OSINT Navigator" CTA enabled; panel renders below
  Host Guard with a close button; passes selectedPackId for pack-relevance badges.
- `src/styles/global.css` — OSINT Navigator, filter bar, resource card, and modal styles.
- `docs/osint-navigator.md` — full doc: risk levels, categories, full resource catalog,
  blocked-list rationale, confirmation gate behavior, Intel sub-score connection.
- `src/__tests__/osintCatalog.test.ts` — 24 unit tests covering integrity, URL presence,
  risk/category validity, confirmation requirements, and copy-safety (banned phrases absent).
- `src/__tests__/osintNavigatorPresenter.test.ts` — 29 unit tests covering all presenter
  functions, label maps, filter logic, and safety copy audits.

**Safety guarantees maintained in PR 8:**
No external API calls. No WebView embedding. No scraping automation. No query logging.
No people-search, credential-dump, or dark-web resources are openable.
Blocked entries are visible as policy cards only — no open button, no URL.
All allowed-use and limitation copy audited by test suite for 15 banned phrases.
No Rust files changed. No Tauri commands added or modified. No dependency updates.

### Added (PR 7)
- `src/types/hostGuard.ts` — `HostGuardStatus`, `HostGuardCheckId`, `HostGuardCheckPhase`,
  `HostGuardCheck`, `HostGuardInput`, `HostGuardSummary` types.
- `src/lib/sotyHostGuardEngine.ts` — `runHostGuard(input)` deterministic, read-only posture
  check engine; `DEMO_HOST_GUARD_INPUTS` (one per DemoPresetKey, mirroring sotyDemoInput host
  objects); `HOST_GUARD_LIMITATION_COPY` required disclaimer string.
- `src/lib/sotyHostGuardMapper.ts` — `hostGuardToHostInput(summary)` maps a `HostGuardSummary`
  back to a `SotyScoreInput["host"]`-compatible object for future live SOTY integration.
- `src/lib/sotyHostGuardPresenter.ts` — `statusToVariant()`, `statusToLabel()`, `overallCopy()`,
  re-exports `HOST_GUARD_LIMITATION_COPY`.
- `src/components/soty/SotyHostGuardPanel.tsx` — read-only panel; phase-grouped check list
  with status badges, detail text, limitation copy, and demo-mode footer.
- `src/pages/SotyDashboard.tsx` — "Run Host Guard" CTA enabled; clicking runs the engine
  against the active preset's demo signals and renders `SotyHostGuardPanel` below the CTAs.
  Preset change clears the stale Host Guard result.
- `src/styles/global.css` — `.host-guard-panel`, `.host-guard-overall`, `.host-guard-phase-group`,
  `.host-guard-check-item`, `.host-guard-check-header`, `.host-guard-check-detail`,
  `.host-guard-footer` styles.
- `docs/host-guard.md` — full Host Guard doc: check catalog, status values, limitation copy,
  Host Guard → Host Score deduction mapping, what Host Guard does NOT do, demo mode table.
- `src/__tests__/sotyHostGuardEngine.test.ts` — 27 unit tests (overall status, check IDs,
  summary shape, demo input correctness, fail-over-warn precedence).
- `src/__tests__/sotyHostGuardPresenter.test.ts` — 12 unit tests including copy-safety audit
  (banned phrases absent, "cannot guarantee" present in limitation copy).

**Safety guarantees maintained in PR 7:**
No system mutations. No external API calls. No firewall/routing/DNS/proxy changes.
No process killing. No memory scanning. No YARA. No threat intelligence. No AV/EDR replacement.
Host Guard is a read-only posture check surface. "Run Host Guard" requires explicit user click;
no automatic execution occurs. Demo mode only — no real Tauri backend calls.

### Added (PR 6)
- `src/lib/sotyRoutePackContext.ts` — `RoutePackContext` type, `ScoreFocus` interface,
  `FocusLevel` type, `ROUTE_PACK_CONTEXTS` record for all 8 packs. Each context defines:
  compatible missions, five-category score focus (Low/Medium/High per sub-score),
  the demo preset that best illustrates the pack's workflow context, and safe operator-facing
  "what this route improves / does not do" copy audited by the test suite.
- `src/lib/sotyRoutePackScoring.ts` — `getPackDemoPreset()`, `getPackScoreFocus()`,
  `focusLevelForCategory()` — deterministic lookups keyed by pack id with safe fallbacks.
- `src/lib/sotyRoutePackPresenter.ts` — `focusLevelToVariant()`, `focusLevelToLabel()`,
  `focusLevelToPercent()`, `focusLevelToClass()`, `focusCategoryToLabel()`,
  `bofaModeToLabel()`, `bofaModeToTagClass()`, `packMismatchWarning()`, `FOCUS_CATEGORIES`.
- `src/components/soty/SotyRoutePackSelector.tsx` — enhanced 8-pack grid with compatible
  mission count and BOFA mode tag per card.
- `src/components/soty/SotyRoutePackDetail.tsx` — rich pack detail panel: score focus bars,
  compatible mission chips, mismatch warning, what-improves / what-doesn't (2-col), KV
  metadata rows, safety warnings.
- `src/components/soty/SotyRoutePackMissionSuggestions.tsx` — chip list of compatible missions;
  clicking a chip calls `buildRouteCard()` immediately and scrolls to the Mission Builder.
- `src/lib/sotyDemoInput.ts` — **DIRTY preset**: firewall_enabled/defender_enabled/
  host_guard_available all false → host_score = 50 → `SOTY_DIRTY`. `DemoPresetKey` now
  includes `"dirty"`. All five SOTY states reachable from the demo preset selector.
- `src/pages/SotyDashboard.tsx` — Route Pack section upgraded: new selector + detail
  components replace the PR 4 quick-action grid. Pack selection auto-updates the demo preset
  to the pack's suggested context; operator can override at any time.
- `src/styles/global.css` — focus bar CSS, mission chip CSS, pack detail grid CSS,
  `.pack-context-note` inline notification style.
- `src/__tests__/sotyRoutePackContext.test.ts` — 37 new unit tests.
- `src/__tests__/sotyRoutePackPresenter.test.ts` — 37 new unit tests including a
  copy-safety audit (no unsafe phrases in PR 6 copy).
- `docs/route-packs.md`, `docs/soty-agent.md`, `docs/soty-score.md` — PR 6 status sections.

**Safety guarantees maintained in PR 6:**
No external AI API calls. No OSINT URLs. No host scanning. No firewall/DNS/proxy/routing
changes. No Rust or Tauri command changes. No automatic fixes. No mutations of any kind.
Route Packs remain workflow preview contexts and recommendation surfaces only.

Total vitest suite: **257 passing**. `tsc --noEmit` exit 0. No Rust changes.

### Added
- Product docs for the **SOTY direction** (v0.3.0 design track): `docs/soty-score.md`,
  `docs/soty-agent.md`, `docs/route-packs.md` — design specs for SOTY Score, Soty Agent
  (Route Card) and Route Packs.
- README rebrand to "the AI OPSEC Route" with the tagline *Before you operate, become
  SOTY-ready.*, a "What SOTY means" section, and SOTY Score / Soty Agent / Route Packs overviews.
- Expanded permanent safety boundaries in README §7 (not an AV/EDR, not a doxxing tool, no leak
  scraping, no credential-dump automation) and new roadmap non-goals.
- Roadmap: v0.3.0 SOTY track mapped to the PR 1–11 plan.

Docs only — no code, schema, or behaviour changes.

### Added (PR 2)
- `src/types/` — frontend-only TypeScript types for the v0.3.0 SOTY direction:
  `SotyState`, `ScoreCategory`, `ScoreSeverity`, `ActionType`, `RecommendedFix`,
  `ScoreDeduction`, `SotyScore` (`sotyScore.ts`); `MissionType`, `RouteCard` (`routeCard.ts`);
  `BofaIntegrationMode`, `RoutePack` (`routePack.ts`); `BofaGateDecision` (`bofaGate.ts`);
  `EvidenceLevel`, `RiskLevel` (`risk.ts`); barrel `index.ts`.
- `src/lib/sotyScoreDefaults.ts` — `createEmptySotyScore()` fail-closed factory,
  `SCORE_RANGE`, `SUB_SCORE_FIELDS`.
- `src/lib/routePackDefaults.ts` — all 8 default `RoutePack` definitions as inert readonly data.
- `src/__tests__/sotyScore.test.ts` and `src/__tests__/routePackDefaults.test.ts` — 19 unit tests
  covering state validity, score range (0–100), route pack uniqueness and evidence levels.
- `vitest` devDependency; `npm test` / `npm run test:watch` scripts; vitest config in
  `vite.config.ts`.
- CI: `test-frontend` job; `tauri-build` depends on it.
- Docs: PR 2 schema status sections in `soty-score.md`, `soty-agent.md`, `route-packs.md`.

No runtime behaviour changed — all new code is inert types and data.

### Added (PR 5)
- `src/lib/sotyMissionCatalog.ts` — static `MissionDefinition` catalog for all 10 mission
  types. Each definition includes: title, summary, selector description, recommended mode,
  recommended route pack ID, required checks, OSINT resource categories, risk warnings, scope
  requirements, evidence settings, BOFA allowed/disallowed modules, next safe actions.
- `src/lib/sotyRouteBuilder.ts` — `buildRouteCard(missionType, options?)` pure deterministic
  entry point. Produces a fully-populated `RouteCard` from the catalog. Pure: no I/O, no
  side-effects, fully deterministic for fixed `options.timestamp`.
  `generateRouteCardId()` produces stable IDs with format `rc_<mission>_<ts>`.
- `src/lib/sotyRouteCardPresenter.ts` — pure presenter helpers: `missionTypeToLabel()`,
  `missionTypeToDescription()`, `recommendedRoutePackId()`, `modeToLabel()`,
  `evidenceLevelToHint()`, `routeCardHasBofaRestrictions()`, `routeCardBofaIsBlocked()`,
  `routeCardBofaSummary()`.
- `src/components/soty/SotyMissionBuilder.tsx` — controlled mission selector grid (10 buttons)
  with description card, "Build Route Card" button, and "Local deterministic planner —
  no external AI call in this version." disclaimer badge.
- `src/components/soty/SotyRouteCardPanel.tsx` — full Route Card display: metadata row
  (mode, evidence, pack, created), two-column body (required checks, risk warnings, scope
  requirements · resources, evidence hint, BOFA status, pack detail), next safe actions,
  read-only footer disclaimer.
- `src/pages/SotyDashboard.tsx` — mission builder section added; "Build Mission Route" CTA
  **enabled** (scrolls to builder, pre-selects a default mission — no mutations).
- `src/styles/global.css` — mission builder CSS: `.mission-grid`, `.mission-btn`,
  `.mission-builder`, `.mission-desc-card`, `.route-card-panel`, `.rc-*` classes,
  `.planner-badge`, `.section-divider`.
- `src/__tests__/sotyRouteBuilder.test.ts` and `sotyRouteCardPresenter.test.ts` —
  61 new unit tests including every-MissionType coverage, determinism, BOFA blocking rules,
  privacy disclaimer, execute-file warning, scope validation, and full safety audit
  (no doxxing / no guaranteed anonymity wording).
- `docs/soty-agent.md` — PR 5 local route builder status section added.
- `docs/route-packs.md` — Mission → Route Pack mapping table added (§5).

**Safety guarantees maintained in PR 5:**
No external AI API calls. No OSINT resource URLs or catalogs added. No host scanning.
No firewall/routing/DNS/proxy modifications. No Rust or Tauri command changes.
No mutations of any kind — all Route Cards are read-only recommendations.
Total vitest suite: 183 passing. `tsc --noEmit` exit 0.

### Added (PR 4)
- `src/pages/SotyDashboard.tsx` — SOTY Score dashboard page at route `/soty`.
  Surfaces the PR 3 deterministic scoring engine via four demo presets
  (SOTY_READY · SOTY_WARN · SOTY_EXPOSED · SOTY_BLOCKED) computed at module load
  time from `computeSotyScore()`. Demo preset selector, Big SOTY Score hero
  (circular ring, variant colour, operator copy), sub-score grid (5 cards with
  weight labels and hint text), deduction list with severity badges and blocking
  flags, de-duplicated recommended fix list, Route Pack quick-action grid (8 packs,
  UI-preview only), and five disabled CTA placeholders
  (Make me SOTY-ready · Build Mission Route · Run Host Guard · Open OSINT Navigator ·
  Launch BOFA Route).
- `src/components/soty/` — six focused components:
  `SotyStateBadge`, `SotyScoreHero`, `SotySubscoreGrid`, `SotyDeductionList`,
  `RecommendedFixList`, `RoutePackQuickActions`.
- `src/lib/sotyDemoInput.ts` — four `SotyScoreInput` presets and the computed
  `DEMO_PRESETS` record. Zero I/O, zero side-effects.
- `src/lib/sotyPresenter.ts` — pure presenter helpers:
  `sotyStateToVariant()`, `sotyStateToCopy()`, `scoreToVariant()`,
  `severityToVariant()`, `subscoreHint()`, `dedupFixes()`.
- `src/styles/global.css` — SOTY-specific CSS classes:
  `.soty-score-hero`, `.soty-score-ring`, `.soty-score-number`, `.subscore-grid`,
  `.subscore-card`, `.deduction-row`, `.fix-row`, `.pack-grid`, `.pack-card`,
  `.soty-cta-row`, `.demo-selector`.
- `src/App.tsx` — `/soty` route added.
- `src/components/Sidebar.tsx` — "SOTY Score" nav item added (position 2).
- `src/__tests__/sotyDemoInput.test.ts` and `sotyPresenter.test.ts` —
  57 new unit tests covering state correctness, score ranges, deduction structure,
  presenter helpers, and fix deduplication.
- `docs/soty-score.md` — PR 4 dashboard status section added; roadmap section updated.

**All CTAs are disabled placeholders. No system checks run. No mutations occur.**
Total vitest suite: 122 passing. No Rust changes.

### Added (PR 3)
- `src/lib/sotyScoreRules.ts` — `SotyScoreInput` type; five deterministic, pure rule
  functions (`routeRules`, `hostRules`, `scopeRules`, `intelRules`, `evidenceRules`);
  `applyDeductions()` clamped utility. 29 deduction codes across 5 categories; 3 blocking
  deductions (`SCOPE_OUT_OF_SCOPE`, `SCOPE_BLOCKED_TARGET`, `INTEL_BLOCKED_RESOURCE`).
  Every deduction carries `reason`, `recommended_fix`, `related_signal`, `blocking`.
- `src/lib/sotyScoreState.ts` — `weightedOverall()` (route 30% · host 20% · scope 25% ·
  intel 10% · evidence 15%) and `determineSotyState()` with the full 6-case precedence
  chain. Exports `SCORE_WEIGHTS` constant.
- `src/lib/sotyScoreEngine.ts` — `computeSotyScore(input, options?)` entry point.
  Pure, side-effect free, fully deterministic for fixed `options.timestamp`.
- `src/__tests__/sotyScoreEngine.test.ts` — 28 tests covering all rule categories,
  clamping, blocking override, side-effect freedom, and recommended_fix completeness.
- `src/__tests__/sotyScoreState.test.ts` — 18 tests covering every state transition,
  weight correctness and determinism.
- `docs/soty-score.md`: PR 3 engine status section added.

Total vitest suite: 65 passing. No Rust changes. No UI changes.

---

## [0.1.0] — 2026-05-22

First public release. Foundation milestone.

### Added
- Initial scaffold: Tauri 1.5 + React 18 + TypeScript + Vite desktop app.
- Three-layer architecture: Desktop UI / Local Agent (stub) / Core Engine.
- Five operating modes: Observe, Tor, WireGuard, SOCKS5, Lab.
- Thirteen Tauri IPC commands — none mutate system network state.
- Evidence pipeline: `session.json`, `profile.json`, `checks.json`, `plan.json`, `warnings.json`, `evidence.md`.
- BOFA export contract (`bofa_export.json`, `preflight_passed` signal).
- SotyHUB export contract (`sotyhub_export.json`, lab session adapter).
- Doctor page: OS, admin status, hostname, interfaces, DNS, Tor/WireGuard detection.
- Four example profiles: `authorized-lab`, `tor-basic`, `wireguard-lab`, `socks5-basic`.
- Nine documentation pages including threat model, legal scope, and comparison.
- GitHub Actions: type-check, Rust clippy, MSI build, release, security audit.
- GitHub templates: bug, feature, security, PR, CODEOWNERS, Dependabot.
- Dark-mode UI with SOC palette (black/grey base, green/cyan ok, yellow warn, red danger, purple brand).

### Security
- `load_profile`: validate path rejects `..` traversal components and enforces `.yaml`/`.yml`/`.json` extension (closes #12).
- `save_settings`: `validate_evidence_dir` rejects `..` components and blocked system roots (`C:\Windows`, `/etc`, etc.).
- `write_session`, `write_bofa`, `write_sotyhub`: `assert_within_evidence_root` defense-in-depth check on every evidence write target.
- `profiles::load_from_path`: fix unreachable-pattern lint (`"yaml" | "yml" | _` → `_`) that would have failed `clippy -D warnings` in CI.

[Unreleased]: https://github.com/descambiado/SotyRoute/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/descambiado/SotyRoute/releases/tag/v0.1.0
