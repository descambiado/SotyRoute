# Contributing to SotyRoute

Thank you for your interest. SotyRoute is a serious tool for authorized security labs — contributions follow the same standards.

## Before you start

1. Read [docs/threat-model.md](docs/threat-model.md) and [docs/legal-scope.md](docs/legal-scope.md).
2. Check the [roadmap](docs/roadmap.md) — your idea may already be scheduled or explicitly out of scope.
3. Open an issue before writing significant code. Alignment first, implementation second.

## Development setup

```powershell
# Prerequisites: Node.js 18+, Rust stable, MS C++ Build Tools, WebView2
cd apps/desktop
npm install
npm run tauri dev
```

First run compiles the Rust backend (~3 min). Subsequent runs are fast.

## Code standards

### TypeScript / React

- Strict TypeScript (`"strict": true` in tsconfig).
- No `any` casts without a comment explaining why.
- Components receive typed props; no runtime prop munging.
- `api.ts` is the only file that calls `invoke()` — UI components import from `api.ts`.

### Rust

- `cargo fmt` before every commit.
- `cargo clippy -- -D warnings` must pass clean.
- No `unwrap()` in command handlers — return `Err(String)` with a user-readable message.
- No `unsafe` blocks without a written justification comment.

### Evidence / safety boundary

- **No mode may modify system network state in v0.1.x.** Every network-mutating `PlanStep` must have `executes_in_v0_1_0: false`.
- New plan steps require a corresponding `Warning` entry if they touch anything reversibility-sensitive.
- New evidence fields must be additive; never remove or rename a field without bumping the schema version.

## Pull requests

- Target `main`.
- Fill in the PR template completely — especially the *Safety / reversibility* section.
- One logical change per PR. Large refactors get their own PR.
- CI must be green before review.

## Commit messages

```
<type>(<scope>): <short summary>

<body — optional, explain WHY not WHAT>
```

Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `security`, `test`.  
Scopes: `ui`, `backend`, `evidence`, `profiles`, `agent`, `ci`, `docs`.

Examples:
```
feat(evidence): add profile.json to session bundle for operator lookup
fix(backend): handle missing evidence dir gracefully in list_sessions
docs(threat-model): clarify browser leak limitations
chore(deps): bump serde_yaml to 0.9.34
```

## Security contributions

For vulnerability reports, use **GitHub Security Advisories** (private), not public issues.  
See [SECURITY.md](SECURITY.md).

## What we will not merge

- Any change that removes the dry-run gate from a network-mutating operation.
- "Anonymity" claims in UI copy or docs.
- Bundled Tor or WireGuard binaries.
- Features targeting unauthorized use cases.
- Driver code without a full safety review.

## License

By contributing you agree that your contributions are licensed under the [MIT License](LICENSE).
