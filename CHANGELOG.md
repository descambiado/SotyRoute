# Changelog

All notable changes to SotyRoute are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

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
