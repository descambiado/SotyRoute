# AGENTS.md

Guidance for AI coding agents — and humans — working in this repository. It complements [CONTRIBUTING.md](CONTRIBUTING.md); where the two overlap, the stricter rule wins.

## What this project is

**SotyRoute** is a local, explainable preflight and evidence layer for authorized security work: a SOTY Score (Route · Host · Scope · Intel · Evidence), read-only Guards, Route Packs, a deterministic route builder, a local OSINT catalog, evidence snapshots and a local BOFA Gate. Desktop app: Tauri 1.5 + Rust + React 19 + TypeScript + Vite, Windows-first. Everything is local. Product overview: [README.md](README.md). Doc index: [docs/README.md](docs/README.md).

## Repository map

```
apps/desktop/
  src/lib/          Pure TypeScript engine: scoring rules, route packs, route builder, OSINT catalog,
                    BOFA gate, evidence builders and mappers. No I/O.
  src/lib/api.ts, *Real.ts, *Persistence.ts
                    The ONLY files that import @tauri-apps (Tauri invoke wrappers). Each *Real.ts pairs a
                    thin fetcher with a pure mapper that turns signals into score input.
  src/pages/        React pages (SotyDashboard.tsx is /soty)
  src/components/   React components (components/soty/ for the SOTY UI)
  src/context/      React context (ActiveProfileContext)
  src/types/        Shared types
  src/__tests__/    Vitest unit tests — pure functions only
  src-tauri/src/    Rust backend: Tauri commands plus the read-only guards
                    (host_guard.rs, route_guard.rs, evidence_guard.rs), evidence, profiles, planner, system
docs/               Documentation (start at docs/README.md)
examples/profiles/  Example YAML profiles
```

## Commands

```powershell
cd apps/desktop
npm ci                    # or npm install
npm test -- --run         # Vitest (28 files, 638 tests when this was written)
npx tsc --noEmit          # type-check — must be clean
npm run build             # tsc + vite build
npm run dev               # UI only, http://localhost:1420/#/soty (no Tauri backend)
npm run tauri dev         # full desktop app (Windows)
# Rust, from apps/desktop/src-tauri:
cargo fmt --check ; cargo clippy -- -D warnings ; cargo build
```

CI (`.github/workflows/ci.yml`) must be green: **Frontend type-check**, **Frontend unit tests**, **Build Rust backend**, **Tauri MSI build (Windows)**. A local Rust toolchain may be unavailable; CI is the source of truth for `cargo fmt`, clippy and the build.

## Hard rules — these are the project's safety boundaries

- **No new outbound network activity.** There is no telemetry and no background traffic. The only existing outbound requests are explicit and operator-initiated: the opt-in public-IP lookup and the `probe_tcp` command. Anything new needs maintainer approval, must be opt-in and user-initiated, and must be documented.
- **No scraping, no embedded WebView, no external APIs, no LLM calls.**
- **No BOFA launch and no SotyHUB upload.** Exports are local files only, under `~/.sotyroute/runs/`.
- **No system mutation** in the current release; anything that could mutate state is dry-run first. Never remove a dry-run gate.
- **No offensive automation**, no target probing, no credential/leak-site searching, no "anonymity" claims.
- **Never fabricate** signals, screenshots or test results. Unknown is `null`, not a guessed pass or fail. Screenshots must be real captures. Say plainly what you could not verify.
- Scope is operator-declared and advisory. Read [docs/soty-scope-architecture.md](docs/soty-scope-architecture.md) before touching anything Scope-related — Scope is intentionally still demo-based.

## Architecture conventions

1. **The engine is pure.** Scoring rules, mappers and builders live in `src/lib/` as side-effect-free functions with unit tests. Tauri `invoke` calls stay in `api.ts` and the `*Real.ts` / `*Persistence.ts` wrappers — UI components never call `invoke` directly.
2. **The real-signal pattern:** a Rust collector (read-only, returns `Option<T>` for anything uncertain) → a Tauri command → a TypeScript fetcher plus a **pure mapper** into `SotyScoreInput` → an override in `SotyDashboard.tsx`'s `scoreInput`. Real data replaces the demo preset only after the operator has run the check or touched the control ("touched-gating"), so the showcase presets are not degraded on first load.
3. **Docs travel with code.** A behavior change updates the relevant doc (usually [docs/soty-score.md](docs/soty-score.md)) and adds an entry under `[Unreleased]` in [CHANGELOG.md](CHANGELOG.md) in the same PR.
4. **Scoring changes need tests and doc updates** — deduction ids, points and severities are part of the public behavior.

## Testing conventions

- Vitest, in `apps/desktop/src/__tests__/`. Tests target pure functions; there is no component-level test setup (no Testing Library, no DOM mocks). To test UI behavior, extract the logic into a pure helper and test that.
- The browser preview (`npm run dev`) has **no Tauri IPC**: the Guards, Profiles and Settings show graceful fallbacks there. A browser preview cannot verify real-signal paths — do not claim it did.

## Git & PR conventions

- Branch from the latest `main` **before** editing. One logical change per PR.
- Conventional commits: `type(scope): summary`. Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `security`, `test`. Scopes in use: `soty`, `ui`, `backend`, `evidence`, `profiles`, `agent`, `ci`, `docs`, `deps`.
- **No AI attribution** anywhere: no `Co-Authored-By` lines for AI tools, no "generated with" footers, no AI badges — in commits, PR bodies, changelogs or docs.
- PR body sections: *What changed · Why it matters · Safety boundaries · Tests / checks run · What is intentionally not included · Follow-up PRs* (omit a section only if it truly does not apply).
- Open the PR, wait for CI, report the result. **Do not merge, and do not close issues or PRs, unless asked** — the maintainer merges.
- Never commit `.claude/`, `node_modules/` or build output. Do not add dependencies without discussing it first.

## Where to look

[docs/README.md](docs/README.md) · [docs/soty-score.md](docs/soty-score.md) · [docs/architecture.md](docs/architecture.md) · [docs/threat-model.md](docs/threat-model.md) · [docs/legal-scope.md](docs/legal-scope.md) · [docs/ai-integration.md](docs/ai-integration.md)
