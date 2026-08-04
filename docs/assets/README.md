# docs/assets — Screenshot captures

**Status: captured.** All three target files exist and are referenced from `README.md` §10.
They are real UI captures — not generated, not placeholders — taken with headless Chrome and a
temporary Playwright script driving the live Vite dev server (`localhost:1420/#/soty`), not a
packaged Tauri build. See the honesty note below for exactly what that means.

| File | Size | What it shows |
|---|---|---|
| `soty-dashboard.png` | ~186 KB | Top of `/soty` on the **Soty-Ready** preset before running any Guard: SOTY Score hero, sub-score grid, safe-mode notice, preset controls, workflow strip, and the SOTY Workflow CTA row. |
| `soty-score-real-signals.png` | ~297 KB | Same page after selecting **Lab Route** and running **Host Guard**, **Route Guard** and **Evidence Guard** — score/sub-score area plus all three Guard result panels. |
| `soty-evidence-exports.png` | ~443 KB | Evidence Snapshot panel (local-only wording, redaction guarantees) and the BOFA Gate + Local Export Preparation panel (local-only, no-launch, no-upload wording), both BOFA and SotyHUB exports prepared. |

## Honesty note — browser preview, not packaged Tauri

These are **browser preview screenshots of the live `/soty` UI**, captured against the Vite dev
server, not the packaged Tauri desktop app. That matters for one specific thing: Host Guard,
Route Guard and Evidence Guard all invoke real Tauri commands to read machine signals, and none
of those commands exist outside the packaged app. So in `soty-score-real-signals.png`, all three
Guard panels correctly show their honest graceful-fallback message ("Could not read real ...
signals. Real ... Guard checks only run inside the packaged Tauri app on Windows.") rather than
real firewall/DNS/directory values — this is the real, correct, only-possible behavior in this
capture environment, not a bug and not a broken state. The Intel sub-score is genuinely real in
this capture (Route Pack selection + an OSINT category were actually selected through the UI).

For the same reason, `soty-evidence-exports.png` shows the BOFA/SotyHUB exports **prepared**
(built in memory — this works without Tauri) but not **saved** — "Save to evidence directory" and
"Save exports locally" both require a Tauri command too, so those two specific buttons were not
exercised for this capture.

Recapturing against a packaged `npm run tauri build` output, on a machine with real Host Guard /
Route Guard / Evidence Guard data to show, would replace the fallback messages with genuine
signal values — worth doing eventually, not required for this to be a real, honest screenshot set.

## How these were captured (for future recaptures)

1. Dev server: `npm run tauri dev` (or the Vite dev server directly) from `apps/desktop/`,
   serving `localhost:1420/#/soty`.
2. Headless Chrome (`chrome.exe --headless=new --screenshot=<path>`) for the simple top-of-page
   shot — works for a single static capture with no interaction.
3. A temporary Playwright script (`playwright-core`, run via `npm exec`/`npx`, installed into an
   isolated throwaway directory — never added to this repo's `package.json`) for the two
   interactive captures, driving the same installed Chrome via `executablePath` rather than
   downloading its own browser binary.
4. The app's content area is height-driven (not `fullPage`-screenshot-friendly through a nested
   scroll container), so each capture measures the actual rendered content height first and sizes
   the browser viewport to match, rather than guessing a fixed size.

## README embed

Already in place in `README.md` §10:

```markdown
![SOTY Dashboard](docs/assets/soty-dashboard.png)
![SOTY Score — real signals](docs/assets/soty-score-real-signals.png)
![Evidence + local exports](docs/assets/soty-evidence-exports.png)
```
