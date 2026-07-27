# Host Guard

**Status: implemented — PR 7 (deterministic engine), real signals since PR 15.**

Host Guard provides read-only defensive posture checks. Since PR 15 it reads real, read-only
signals from the local machine via a Tauri command; the deterministic engine that evaluates
those signals is unchanged from PR 7. No system modifications occur — Host Guard never writes
to the firewall, registry, or any system setting.

> **Host Guard provides defensive posture checks. It cannot guarantee the host is clean.**

---

## What Host Guard checks

Host Guard evaluates seven signals grouped into three phases:

### Host phase

| Check ID | Signal | Real source | Pass condition |
|---|---|---|---|
| `HG_OS_DETECTED` | OS detection | Always true if the Tauri command returned | OS information available |
| `HG_ELEVATED` | Privilege level | `is_elevated` crate | Not running as admin/root |
| `HG_FIREWALL` | Host firewall | `Get-NetFirewallProfile` — all profiles must be enabled | Firewall enabled (null = unknown → warn) |
| `HG_DEFENDER` | AV / EDR status | `Get-MpComputerStatus` — reflects Windows Defender only, not third-party AV | Defender enabled (null = warn) |

### Route phase

| Check ID | Signal | Real source | Pass condition |
|---|---|---|---|
| `HG_SUSPICIOUS_PROXY` | System proxy settings | Registry `ProxyEnable` flag | No system-level proxy configured |
| `HG_SUSPICIOUS_ROUTE` | Route table | **Not yet implemented** — always reports `skip` in real mode | n/a |

### Process phase

| Check ID | Signal | Real source | Pass condition |
|---|---|---|---|
| `HG_KNOWN_TUNNEL` | Known tunnel process | `Get-Process`, exact match against a known VPN/Tor/tunnel binary list | No known tunnel process running |

---

## Check status values

| Status | Meaning |
|---|---|
| `pass` | Signal is nominal |
| `warn` | Signal could not be determined, or warrants review |
| `fail` | Signal indicates a posture issue that should be addressed |
| `skip` | Check was not evaluated (unsupported platform, or not yet implemented) |

**Overall status**: `fail` if any check fails; `warn` if any check warns (no fails); `pass` if all pass (skips are ignored unless every check is skipped).

Detecting a known tunnel process is a neutral/informational `warn`, not a `fail` — the operator
may be intentionally running one. A configured system proxy is treated as a `fail`, surfaced for
the operator to confirm it is expected before starting a session.

---

## How Host Guard maps to SOTY Host Score

The Host Guard checks correspond directly to the deductions in the SOTY Host sub-score:

| Host Guard check | SOTY deduction triggered when failing |
|---|---|
| `HG_FIREWALL` | `HOST_FIREWALL_DISABLED` (−20 pts, high) |
| `HG_DEFENDER` | `HOST_DEFENDER_DISABLED` (−15 pts, medium) |
| `HG_ELEVATED` | n/a (signals elevated privilege, review warranted) |
| `HG_SUSPICIOUS_PROXY` | `HOST_SUSPICIOUS_PROXY` (−20 pts, high) |
| `HG_SUSPICIOUS_ROUTE` | `HOST_SUSPICIOUS_ROUTE` (−20 pts, high) |

Running Host Guard and resolving its `fail` checks directly improves the SOTY Host sub-score.

---

## What Host Guard does NOT do

- Does not modify firewall rules, proxy settings, or routing tables
- Does not kill processes
- Does not scan memory
- Does not query external APIs or threat intelligence feeds
- Does not detect or remove malware
- Does not replace antivirus or EDR tools
- Does not guarantee the host is free of threats
- Route-table analysis is not yet implemented — that one check always reports `skip`
- Only reflects Windows Defender's own state — cannot see third-party AV/EDR agents directly

---

## Real signal collection (PR 15)

Clicking **Run Host Guard** invokes the `run_host_guard_signals` Tauri command, which shells out
to read-only PowerShell queries and OS APIs — the same pattern already used by the existing
Doctor page (`system.rs`). No new external crate dependency was added.

| Signal | Command |
|---|---|
| Elevation | `is_elevated::is_elevated()` |
| Firewall | `(Get-NetFirewallProfile).Enabled` |
| Defender | `Get-MpComputerStatus` → `AntivirusEnabled`, `RealTimeProtectionEnabled` |
| Proxy | `Get-ItemProperty '...\Internet Settings' -Name ProxyEnable` |
| Known tunnel process | `Get-Process` → exact match against a known binary list |

Any signal the underlying command cannot determine (unsupported platform, cmdlet unavailable,
process error) returns `null`, which the engine reports as an honest `warn`/`skip` rather than a
fabricated pass or fail. Outside the packaged Tauri app (e.g. a plain browser preview) the
command is unavailable entirely — the dashboard shows a clear error instead of crashing.

The rest of the SOTY Score (route/scope/intel/evidence sub-scores) still runs against demo
presets in `sotyDemoInput.ts` — only Host Guard reads the real local machine so far.

---

## Follow-up PRs

- Real route-table analysis (currently `skip` in real mode)
- Real signal collection for the remaining SOTY Score sub-scores (route, scope, intel, evidence)
- Integration with `sotyDemoInput` preset switching so SOTY Score reflects Host Guard findings live
