# Architecture

SotyRoute Desktop is built as three deliberately separated layers. The separation matters because the **UI must never run as administrator**, and any future privileged network changes must live behind a small, auditable boundary.

## Layers

### 1. Desktop UI (`apps/desktop`)

- **Stack:** Tauri 1.5 + React 18 + TypeScript + Vite.
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

## IPC contract (v0.1.0)

Tauri commands exposed to the UI:

| Command | Returns | Mutates system? |
|---|---|---|
| `run_doctor` | `DoctorReport` | no |
| `list_profiles` | `Profile[]` | no |
| `load_profile(path)` | `Profile` | no |
| `validate_profile(profile)` | `ValidationResult` | no |
| `start_observe(profile)` | `SessionSummary` | no — only reads + writes evidence |
| `dry_run(mode, profile)` | `SessionSummary` | no — produces `plan.json` |
| `list_sessions` | `SessionSummary[]` | no |
| `read_session(id)` | `SessionDetail` | no |
| `open_evidence_dir` | `void` | opens Explorer at evidence root |
| `get_settings` / `set_settings` | `Settings` | writes settings JSON |

Every command is **read-only** at the system level. Writes happen only inside the evidence directory (`%USERPROFILE%\.sotyroute\`).

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
