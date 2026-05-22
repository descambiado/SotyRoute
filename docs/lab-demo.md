# Lab Demo

A safe, end-to-end walkthrough you can run on any Windows machine without modifying its network configuration.

## Prerequisites

- Windows 10/11.
- Node.js 18+, Rust stable (`rustup`).
- `apps/desktop` built (`npm run tauri dev` or `npm run tauri build`).

## Walkthrough

### 1. Open the app

Launch SotyRoute Desktop. You should land on the **Dashboard** with status **Idle**.

### 2. Run the Doctor

Click **Doctor** in the sidebar. Click **Run checks**.

Expected fields:

- Windows version (`Microsoft Windows 10/11 …`)
- Administrator: `false` (the UI does not need admin)
- Hostname
- User
- Network interfaces (names + addresses, no MACs)
- DNS servers (per active interface)
- Tor detection: `installed: false` is fine if you have no Tor.
- WireGuard detection: same.

If any check fails, the Doctor page surfaces a clear message — that is the success criterion for this step.

### 3. Load the authorized-lab profile

Click **Profiles → Import**. Pick `examples/profiles/authorized-lab.yaml`.

Click **Validate**. Expected result: `valid: true`, plus a list of normalized fields (owner, allowed/blocked targets, kill-switch desired, etc.).

### 4. Run Observe

Back to **Dashboard**. Click **Start Observe**.

The app:

1. Collects a fresh `checks.json`.
2. Produces a no-op `plan.json` (Observe mode mutates nothing).
3. Writes `session.json`, `warnings.json`, and `evidence.md`.
4. Returns you to the Evidence page with the new session highlighted.

### 5. Dry-run Tor

**Dashboard → Dry Run Tor.**

Expected behavior:

- Warning shown: *"Tor is not a VPN. SotyRoute does not guarantee anonymity."*
- `plan.json` describes the steps SotyRoute **would** take (none are executed in v0.1.0).
- Evidence bundle written.

### 6. Dry-run WireGuard

**Dashboard → Dry Run WireGuard.**

Expected behavior:

- Warning shown: *"WireGuard requires an existing server/configuration. SotyRoute is not a VPN provider."*
- Plan describes detection steps + a placeholder for tunnel selection.

### 7. Dry-run SOCKS5

Pick a SOCKS5 profile (`examples/profiles/socks5-basic.yaml`). Click **Dry Run SOCKS5**.

Expected: validation of `host:port`, warning that not all applications honor SOCKS5.

### 8. Inspect evidence

**Evidence** sidebar entry. Click any session.

You should see:

- `session.json` rendered as a table.
- `evidence.md` rendered as Markdown.
- Buttons: **Open folder**, **Export BOFA**, **Export SotyHUB**.

### 9. Export BOFA JSON

Click **Export BOFA**. The file `bofa_export.json` is written into the session folder.

### 10. Export SotyHUB JSON

Same with **Export SotyHUB**. Produces `sotyhub_export.json`.

## Success criteria

- Five session folders under `%USERPROFILE%\.sotyroute\runs\`.
- Each has `session.json`, `checks.json`, `plan.json`, `warnings.json`, `evidence.md`.
- The two exports exist for the latest session.
- No system network configuration changed at any point.
- No errors in the Tauri devtools console.
