# Architecture

SotyRoute Desktop is built as three deliberately separated layers. The separation matters because the **UI must never run as administrator**, and any future privileged network changes must live behind a small, auditable boundary.

## Layers

### 1. Desktop UI (`apps/desktop`)

- **Stack:** Tauri 1.5 + React 19 + TypeScript + Vite.
- **Privileges:** standard user. Never elevated.
- **Responsibilities:**
  - Render dashboard, profiles, evidence, doctor, settings.
  - Talk to the local agent via Tauri `invoke` calls (v0.1.0) or a named pipe / localhost mTLS endpoint (v0.2.0+).
  - Show warnings clearly; refuse to start when checks fail.
  - Never perform network mutations directly.

### 2. Local Agent (`crates/sotyroute-agent`, v0.2.0+)

- **Stack:** Rust binary running as a Windows Service (`sotyrouted`).
- **Privileges:** elevated, but **only** for declared, reversible actions.
- **Responsibilities:**
  - Receive plans from UI.
  - Execute reversible firewall / routing changes.
  - Provide rollback on disconnect.
  - Sign evidence bundles.

In **v0.1.0** the agent is **stubbed in-process** inside the Tauri Rust backend (`src-tauri/src/commands.rs`). No service is installed. This lets the UI exercise the full surface without privileged operations.

### 3. Core Engine (`crates/sotyroute-core`, in-process for v0.1.0)

- **Stack:** Rust modules.
- **Modules:**
  - `profiles` — load/validate YAML + JSON.
  - `checks` — non-destructive system checks.
  - `planner` — produce `plan.json` for any mode without executing.
  - `evidence` — write session/checks/plan/warnings/markdown.
  - `exports` — BOFA + SotyHUB serializers.
  - `warnings` — central catalog of safety messages.

In v0.1.0 the core lives inline in `src-tauri/src/{profiles,planner,evidence,system}.rs` to keep the build single-crate. It will be extracted into its own crate in v0.2.0.

## IPC contract

Tauri commands exposed to the UI (registered in `src-tauri/src/main.rs`):

| Command | Returns | Effect on the system |
|---|---|---|
| `run_doctor` | `DoctorReport` | read-only (the public-IP lookup runs only if the operator opted in) |
| `run_host_guard_signals` | `HostGuardSignals` | read-only |
| `run_route_guard_signals` | `RouteGuardSignals` | read-only |
| `run_evidence_guard_signals` | `EvidenceGuardSignals` | read-only; never creates the evidence directory |
| `load_profile(path)` | `Profile` | read-only |
| `validate_profile(profile)` | `ValidationResult` | none |
| `list_example_profiles` | `ExampleProfileEntry[]` | read-only |
| `start_observe(profile)` | `SessionSummary` | none — reads, and writes evidence |
| `dry_run(mode, profile)` | `SessionSummary` | none — produces `plan.json` |
| `list_sessions` | `SessionSummary[]` | read-only |
| `read_session(id)` | `SessionDetail` | read-only |
| `open_evidence_dir(id?)` | `void` | opens Explorer at the evidence root |
| `export_bofa(id)` / `export_sotyhub(id)` | path | writes an export file inside that session's evidence directory |
| `save_soty_evidence` / `save_soty_exports` | save result | write the SOTY snapshot / exports under `~/.sotyroute/runs/<timestamp>_soty/` |
| `get_settings` / `set_settings` | `AppSettings` | writes the settings JSON |
| `probe_tcp(host, port)` | `TcpProbeResult` | opens and immediately closes one TCP connection to the host and port the operator supplies; not used by the UI yet |

No command changes system network configuration. Writes happen only inside the evidence directory (`%USERPROFILE%\.sotyroute\`).

## SOTY layer

The SOTY track adds a readiness layer on top of the three layers above, without changing their privilege model:

- **Scoring engine** — pure TypeScript in `apps/desktop/src/lib/`: deterministic rules, mappers and builders with no I/O (the SOTY Score, Route Cards, the BOFA gate decision, evidence snapshots).
- **Guards** — read-only Rust collectors (`host_guard.rs`, `route_guard.rs`, `evidence_guard.rs`) exposed as Tauri commands. Each returns signals; a pure TypeScript mapper turns them into score input, and unknown signals stay `null` rather than being guessed.
- **Shared state** — a small React context holds the validated active profile, as groundwork for the Scope sub-score.

See [soty-score.md](soty-score.md) for what is real today, and [ai-integration.md](ai-integration.md) for how the engine could be exposed to AI agents.

## Why this separation

1. **Least privilege.** UI bugs cannot cause network damage because the UI has no privilege.
2. **Auditable surface.** Privileged operations will live in a small Rust binary with a single IPC entrypoint — easier to review, easier to sign.
3. **Reversibility.** The planner is the source of truth for "what will change". Rollback is computed from the same plan.
4. **Future-proofing.** Replacing the in-process backend with a real agent does not require UI changes — only the IPC adapter.

## Data flow (a single Observe run)

```
User clicks "Start Observe"
        │
        ▼
UI invokes  start_observe(profile)
        │
        ▼
Tauri backend:
  1. checks::collect_system_info()
  2. planner::plan_observe(profile)
  3. evidence::write_session(...)
        │
        ▼
Returns SessionSummary to UI
        │
        ▼
UI navigates to Evidence page, highlights new session
```

No network state was mutated. A full evidence bundle exists on disk.
