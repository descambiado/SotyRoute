# SOTY Demo Walkthrough

A step-by-step tour of the `/soty` dashboard as it stands today: SOTY Score, Route Packs,
Mission Route builder, Host/Route/Evidence Guard, the Ethical OSINT Navigator, Evidence
Snapshots, and local BOFA/SotyHUB exports.

> Local only. No external APIs, no network traffic, no BOFA launch, no SotyHUB upload, no
> anonymity guarantee, no offensive execution. See [docs/legal-scope.md](legal-scope.md).

## Prerequisites

```powershell
cd apps/desktop
npm install
npm run tauri dev
```

Run inside the packaged Tauri dev app, not just a browser tab against the Vite dev server —
Host Guard, Route Guard and Evidence Guard all invoke real Tauri commands to read signals from
the machine. Outside Tauri they fail gracefully with a clear "could not read real signals"
message instead of crashing, which is expected and itself demonstrates the fallback path — but
you won't see the real values without the packaged app.

## Walkthrough

### 1. Open `/soty`

Click **SOTY Score** in the left navigation. Start on the **Soty-Ready** demo preset for the
cleanest first impression.

### 2. Review SOTY Score

The hero ring shows the **Overall SOTY Score** (`0`–`100`) and state
(`SOTY_READY` / `SOTY_WARN` / `SOTY_EXPOSED` / `SOTY_DIRTY` / `SOTY_BLOCKED`). Below it, the
sub-score grid breaks the score into **Route (30%)**, **Host (20%)**, **Scope (25%)**,
**Intel (10%)** and **Evidence (15%)**, each with its own deduction list and recommended fixes.
Nothing here is a mystery number — every deduction names its cause and its fix.

### 3. Select a Route Pack

Pick one of the eight packs (Student, Privacy, OSINT, Purple, Lab, Travel, Dirty Host Check,
BOFA Route). The demo preset context updates to match, compatible missions appear, and — once
you've picked a pack at least once this session — the Intel sub-score starts reflecting your
real selection instead of the demo default.

### 4. Build Mission Route

Pick a mission type in the Mission Route section and click **Build Route Card**. The local Soty
Agent (a deterministic planner, no external AI call) produces a Route Card: recommended mode,
required checks, allowed/disallowed modules, and next safe actions.

### 5. Run Host Guard

Click **Run Host Guard**. Reads real, read-only posture signals from this machine — firewall
state, Defender state, proxy configuration, known tunnel processes, elevation — and the Host
sub-score recomputes live from what it finds. No mutation, no external call.

### 6. Run Route Guard

Click **Run Route Guard**. Reads real DNS servers, public IP (only if you've opted into that
check in Settings), tunnel installation/process state, proxy configuration, and route table
readability. The Route sub-score — the largest single weight at 30% — recomputes live.

### 7. Open OSINT Navigator and select categories

Click **Open OSINT Navigator**. Filter the local, authorized resource catalog by category
(Threat Intel, IOC Lookup, Domain/IP, Malware Analysis, and more) and risk level
(Low/Medium/High). Blocked-by-policy resources are visible but never clickable. Your filter
selections feed the Intel sub-score in real time — including a real deduction if you enable a
high-risk category.

### 8. Run Evidence Guard

Click **Run Evidence Guard**. Reads whether the configured evidence directory actually exists
and is writable, how many sessions have been recorded, and your real BOFA/SotyHUB export
settings. Never creates the directory itself — a fresh install with nothing there yet is
reported honestly as not ready, not silently fixed. The Evidence sub-score recomputes live.

### 9. Generate Evidence

Click **Generate Evidence**. Assembles a local `SotyEvidenceSnapshot` from the current dashboard
state — score, route pack, route card, Host Guard result, OSINT catalog summary, redaction
guarantees (query content, credentials, cookies and tokens are never logged). Preview it with
**Copy JSON preview** / **Copy Markdown preview** (clipboard only, nothing sent anywhere).

### 10. Save local evidence

In the same Evidence Snapshot panel, click **Save to evidence directory**. Writes
`soty_evidence.json` and `soty_evidence.md` to `~/.sotyroute/runs/<timestamp>_soty/` — local
disk only.

### 11. Prepare BOFA/SotyHUB local exports

Click **Open BOFA Gate**. Shows the local, deterministic gate decision (allowed / warning /
blocked) and the module lists it implies. In the Local Export Preparation panel below, click
**Prepare BOFA export** and **Prepare SotyHUB export** to build both payloads in memory, then
**Save exports locally** to write `bofa_export.json` and `sotyhub_export.json` to the same
`~/.sotyroute/runs/<timestamp>_soty/` directory. No BOFA launch. No SotyHUB upload.

## What this demonstrates

Four of five sub-scores — Route, Host, Intel and Evidence — now read real signals from the
machine and the operator's own selections, not just precomputed demo numbers. Scope is the one
sub-score still intentionally demo-only (see the release notes for why).

## Quick checklist

Use this for a fast pre-release or pre-demo pass:

- [ ] `/soty` loads on the Soty-Ready preset with a clean 100/100
- [ ] Selecting a Route Pack updates context and shows compatible missions
- [ ] Building a Mission Route produces a Route Card
- [ ] Run Host Guard → panel appears, Host sub-score reflects real signals
- [ ] Run Route Guard → panel appears, Route sub-score reflects real signals
- [ ] OSINT Navigator filters change the Intel sub-score live
- [ ] Run Evidence Guard → panel appears, Evidence sub-score reflects real signals
- [ ] Generate Evidence → snapshot panel renders, copy buttons work
- [ ] Save to evidence directory → success message with file paths
- [ ] Open BOFA Gate → gate decision renders
- [ ] Prepare + Save exports locally → success message with file paths
- [ ] No console errors at any step; no network requests fired

See [docs/release-notes/v0.4.0-soty-demo.md](release-notes/v0.4.0-soty-demo.md) for what this
milestone means and what's still deferred.
