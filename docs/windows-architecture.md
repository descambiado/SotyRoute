# Windows Architecture

SotyRoute is Windows-first. Other platforms may follow, but the technical decisions in this document assume Windows 10/11 x64.

## UI vs Agent vs Core

- **UI** runs as the logged-in user. No `requireAdministrator` manifest. Closing the UI must not leave the system in a half-configured state.
- **Agent** (v0.2.0+) runs as a **Windows Service** (`sotyrouted`), `LocalSystem` or a constrained service SID. Started/stopped via `sc.exe` or the Tauri-side installer.
- **Core** is a pure library, no I/O policy of its own — it only knows how to *plan* and *describe* changes.

## Why a privileged service (and not "run UI as admin")

Running the UI as administrator would:

- Force every developer dependency (`npm`, `vite dev`, `Cargo`) into an elevated context.
- Expose every UI bug to elevated I/O.
- Make UAC prompts mandatory on every launch.
- Make the security boundary the entire renderer — which is not a defensible boundary.

A separate service keeps the privileged surface to a single binary with a single named-pipe entrypoint.

## Windows technologies on the roadmap

| Tech | Use | Phase |
|---|---|---|
| **Windows Firewall** (`NetSecurity` PowerShell module, `netsh advfirewall`, `INetFwPolicy2` COM) | Reversible rule planning, fail-closed prototypes | v0.2.0 |
| **Wintun + WireGuard** | Detect existing WG installs, optionally launch user-owned tunnels with their consent | v0.3.0 |
| **Tor (Tor Expert Bundle / Tor Browser)** | Detect installation, surface SOCKS port, never bundle Tor binaries ourselves | v0.3.0 |
| **Windows Filtering Platform (WFP)** | Policy-grade routing/kill-switch via a signed WFP callout/sublayer | v0.4.0 — research first |
| **WinDivert** | Research only. Not a runtime dependency — userspace packet redirection has serious caveats and we will not ship it as a default. | research |
| **Named Pipes / `\\.\pipe\sotyroute`** | UI ↔ agent IPC with SDDL-restricted ACL | v0.2.0 |
| **WebView2** | Tauri rendering — preinstalled on Windows 11 | v0.1.0 |
| **WiX / MSI** | Release packaging | v0.1.0 (Tauri default bundler) |

## What v0.1.0 does **not** ship

- No driver.
- No WFP callout.
- No WinDivert dependency.
- No firewall rule changes.
- No route table edits.
- No DNS modifications.
- No tunnel up/down operations.

Every "destructive" button is a **dry-run** that produces a `plan.json` you can read and diff before any future release executes it.

## Admin status detection (v0.1.0)

The UI calls `run_doctor`, which checks the current token via `IsUserAnAdmin()`-equivalent (Rust crate `is_elevated`). The result is shown clearly on the Doctor page. The UI never elevates itself; it surfaces the state so the operator can decide.

## Evidence directory

Default: `%USERPROFILE%\.sotyroute\`. Structure:

```
.sotyroute/
  settings.json
  profiles/                  (user-managed profiles)
  runs/
    20260521-103045_observe/
      session.json
      checks.json
      plan.json
      warnings.json
      evidence.md
      bofa_export.json
      sotyhub_export.json
```

Path traversal and symlink escapes are rejected at the planner boundary.

## Why not run cross-platform first?

We can. The core is portable Rust. But the **value proposition** — preflight for Windows-based SOC/lab workflows — is strongest on Windows, and shipping a half-cross-platform thing dilutes the product. Linux/macOS targets become trivial once the agent contract is stable.
