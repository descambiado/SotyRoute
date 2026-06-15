# Host Guard

**Status: implemented — PR 7 (demo mode, deterministic engine).**

Host Guard provides read-only defensive posture checks. It runs a deterministic engine against
the active demo preset signals and reports what it finds. No system modifications occur.

> **Host Guard provides defensive posture checks. It cannot guarantee the host is clean.**

---

## What Host Guard checks

Host Guard evaluates seven signals grouped into three phases:

### Host phase

| Check ID | Signal | Pass condition |
|---|---|---|
| `HG_OS_DETECTED` | OS detection | OS information available |
| `HG_ELEVATED` | Privilege level | Not running as admin/root |
| `HG_FIREWALL` | Host firewall | Firewall enabled (null = unknown → warn) |
| `HG_DEFENDER` | AV / EDR status | Defender or equivalent enabled (null = warn) |

### Route phase

| Check ID | Signal | Pass condition |
|---|---|---|
| `HG_SUSPICIOUS_PROXY` | System proxy settings | No suspicious proxy detected |
| `HG_SUSPICIOUS_ROUTE` | Route table | No unexpected route entries |

### Process phase

| Check ID | Signal | Pass condition |
|---|---|---|
| `HG_KNOWN_TUNNEL` | Known tunnel process | No unexpected tunnel process running |

---

## Check status values

| Status | Meaning |
|---|---|
| `pass` | Signal is nominal |
| `warn` | Signal could not be determined, or warrants review |
| `fail` | Signal indicates a posture issue that should be addressed |
| `skip` | Check was not evaluated |

**Overall status**: `fail` if any check fails; `warn` if any check warns (no fails); `pass` if all pass.

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

---

## Demo mode (PR 7)

In the current implementation the engine runs against static demo signals that mirror the
active SOTY Score preset (Ready, Warn, Exposed, Blocked, or Dirty). No real system calls are
made. The demo signals match the `host` fields in `sotyDemoInput.ts`:

| Preset | Expected Host Guard overall |
|---|---|
| Ready | pass |
| Warn | fail (firewall disabled) |
| Exposed | pass (host is nominal; route has the problem) |
| Blocked | pass (host is nominal; scope has the problem) |
| Dirty | fail (firewall + defender disabled) |

Real system signal collection from the Tauri backend is planned for a future PR.

---

## Follow-up PRs

- Real system signal collection (Tauri command → `HostGuardInput`) — planned
- Integration with `sotyDemoInput` preset switching so SOTY Score reflects Host Guard findings live
- PR 8: Ethical OSINT Navigator
