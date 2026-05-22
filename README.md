# SotyRoute Desktop

**Windows-first traffic routing, tunnel orchestration and OPSEC evidence app for authorized security labs.**

> *Before running tools, know where your traffic goes.*

SotyRoute Desktop is a desktop application for security engineers, detection engineers, and pentesters working in **authorized** lab environments. It validates routing posture, tunnel readiness, DNS configuration, and lab scope **before** you run offensive tooling — and generates structured evidence (`session.json`, `evidence.md`, BOFA / SotyHUB exports) suitable for engagement reports and audit trails.

Maintained by [@descambiado](https://github.com/descambiado) as part of the **SotyHUB** ecosystem (alongside **BOFA**).

---

## 1. What is SotyRoute?

SotyRoute is not a VPN. It is not Tor. It does not promise anonymity.

It is a **preflight + evidence layer** for network operations:

- Captures **where your traffic is going** before you run tools.
- Validates **lab scope** declared in YAML profiles.
- Plans (dry-run) every routing change before executing it.
- Generates **evidence bundles** for audit.
- Exports to **BOFA** and **SotyHUB** for downstream automation.

## 2. Why not just use a VPN?

| A VPN gives you | SotyRoute gives you |
|---|---|
| An encrypted tunnel | A documented routing posture |
| Maybe a kill-switch | Scope-bound profiles per lab |
| Maybe a leak test page | DNS / routing / firewall checks captured as evidence |
| No idea what your tooling will do | A dry-run plan you read **before** execution |
| No audit trail | `session.json` + `evidence.md` per run |

A VPN does not know whether you are inside an authorized lab. SotyRoute does.

## 3. Why better than Nipe?

[Nipe](https://github.com/htrgouvea/nipe) is a Perl script that routes Linux traffic through Tor. SotyRoute is broader and safer:

| Feature | Nipe | SotyRoute Desktop |
|---|---|---|
| Windows GUI | no | **yes** |
| Multi-transport (Tor / WG / SOCKS5 / Observe / Lab) | no | **yes** |
| YAML profiles | no | **yes** |
| Dry-run planner | no | **yes** |
| Evidence reports | no | **yes** |
| Lab scope validation | no | **yes** |
| BOFA / SotyHUB exports | no | **yes** |
| Honest copy about anonymity | partial | **yes** |
| Reversible / fail-closed design | no | **goal** |

## 4. Core features (v0.1.0)

- **Dashboard** with current mode, profile, routing/DNS/tunnel/kill-switch status.
- **Profiles** page: load, validate, import/export YAML/JSON.
- **Evidence** page: browse sessions, open `evidence.md`, export BOFA / SotyHUB JSON.
- **Doctor** page: Windows version, admin status, interfaces, DNS, Tor / WireGuard detection.
- **Settings**: evidence directory, default mode, telemetry off, theme.
- **Observe mode**: non-destructive system snapshot.
- **Dry-run** for Tor / WireGuard / SOCKS5 / Lab.
- **Local evidence directory**: `%USERPROFILE%\.sotyroute\runs\<timestamp>_<mode>\`.

## 5. Windows-first architecture

```
Desktop UI (Tauri + React, no admin)
        │  Tauri IPC
        ▼
Local Agent  (v0.1.0 stub; v0.2.0 Windows Service, elevated)
        │
        ▼
Core Engine  (profiles · checks · planner · evidence · exports)
```

See [docs/windows-architecture.md](docs/windows-architecture.md) and [docs/architecture.md](docs/architecture.md).

## 6. Safety model

- **UI never runs as admin.** Privileged actions are reserved for the agent (future).
- **Dry-run by default** for any action that would mutate the system.
- **Fail-closed** design goal: if a check fails, the operation does not proceed.
- **Evidence first**: every session writes `session.json`, `checks.json`, `plan.json`, `evidence.md`.
- **No third-party network changes** in v0.1.0.

See [docs/threat-model.md](docs/threat-model.md).

## 7. What SotyRoute does **not** do

- It is **not** a VPN provider. No servers are shipped.
- It does **not** guarantee anonymity.
- It does **not** evade law enforcement or detection.
- It does **not** ship offensive payloads.
- It does **not** modify the system network configuration in v0.1.0.
- WireGuard requires an existing server/configuration you own or are authorized to use.
- Tor is not a VPN; SOCKS5 is not honored by every application.

See [docs/legal-scope.md](docs/legal-scope.md).

## 8. Quickstart

**Prerequisites**

- Windows 10/11 (x64)
- [Node.js](https://nodejs.org/) 18+
- [Rust](https://www.rust-lang.org/tools/install) stable (`rustup`)
- Microsoft C++ Build Tools (installed by Rust on Windows)
- WebView2 runtime (preinstalled on Win11)

**Install & run dev**

```powershell
cd apps/desktop
npm install
npm run tauri dev
```

The first run will compile the Rust backend (a few minutes). Subsequent runs are fast.

**Build a release MSI**

```powershell
cd apps/desktop
npm run tauri build
```

Artifacts: `apps/desktop/src-tauri/target/release/bundle/msi/`.

> If Tauri complains about missing icons, generate them with `npx @tauri-apps/cli icon path/to/logo.png` and re-run.

## 9. Screenshots

_Placeholders — to be added after first build._

- `docs/screenshots/dashboard.png`
- `docs/screenshots/doctor.png`
- `docs/screenshots/evidence.png`

## 10. Evidence files

Every run writes to `%USERPROFILE%\.sotyroute\runs\<timestamp>_<mode>\`:

- `session.json` — high-level session metadata
- `checks.json` — system checks captured
- `plan.json` — dry-run plan (read this before any real execution)
- `warnings.json` — collected warnings
- `evidence.md` — human-readable report
- `bofa_export.json` — for BOFA preflight ingestion
- `sotyhub_export.json` — for SotyHUB lab session adapter

## 11. BOFA integration

SotyRoute emits a `bofa_export.json` per session intended as a **preflight signal**: BOFA workflows can refuse to launch offensive modules until SotyRoute reports `preflight_passed: true` for a matching profile.

See [docs/bofa-integration.md](docs/bofa-integration.md).

## 12. SotyHUB integration

SotyHUB lab sessions can ingest `sotyhub_export.json` to attach SotyRoute evidence to a lab execution record (`operator`, `profile_name`, `evidence_bundle`, `status`).

See [docs/sotyhub-integration.md](docs/sotyhub-integration.md).

## 13. Roadmap

See [docs/roadmap.md](docs/roadmap.md). Summary:

- **v0.1.0** — Desktop UI, observe + dry-run, evidence, exports. *(this release)*
- **v0.2.0** — Windows Service agent, controlled firewall planning, reversible rules.
- **v0.3.0** — WireGuard orchestration, Tor backend research, kill-switch prototype.
- **v0.4.0** — WFP policy engine research, signed evidence bundles, BOFA preflight live.
- **v1.0.0** — Stable agent, audited rollback, signed releases.

## 14. Legal & ethical scope

SotyRoute is for **authorized** security work only: your own assets, your own lab, or systems for which you hold written authorization. See [docs/legal-scope.md](docs/legal-scope.md).

## License

MIT — see [LICENSE](LICENSE).
