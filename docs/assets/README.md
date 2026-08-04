# docs/assets — Screenshot captures

Place screenshot captures here and reference them from `README.md`. None of the three target
files below exist yet — this repo does not ship placeholder or fabricated images. Capture real
ones from a running build and drop them in with these exact filenames.

## Capture instructions

Start the dev app (`npm run tauri dev` from `apps/desktop/`) — the packaged Tauri app, not just
the Vite dev server in a browser tab, since Host/Route/Evidence Guard need real Tauri commands
to return real values. Navigate to `/soty` and follow
[docs/demo-walkthrough.md](../demo-walkthrough.md) up to each capture point below.

| File | When to capture |
|---|---|
| `soty-dashboard.png` | On the **Soty-Ready** preset, before running any Guard. Shows the SOTY Score hero, the sub-score grid (Route/Host/Scope/Intel/Evidence), the deduction list and the workflow strip. |
| `soty-score-real-signals.png` | After running **Host Guard**, **Route Guard** and **Evidence Guard** in sequence (walkthrough steps 5, 6, 8). Capture the Score hero + sub-score grid together with at least one of the three Guard result panels visible below, so the real values are legible. |
| `soty-evidence-exports.png` | After **Generate Evidence** (step 9), **Save to evidence directory** (step 10), and **Prepare BOFA export** / **Prepare SotyHUB export** / **Save exports locally** (step 11) — the Evidence Snapshot panel and the Local Export Preparation panel both showing their "saved" success states. |

## Recommended tool

Use the Tauri window at 1280 × 800 and capture with your OS screenshot tool or
[ShareX](https://getsharex.com/) on Windows. Crop to the content area only (no OS chrome). PNG,
no more than ~1MB each — downscale or crop rather than compressing into artifacts.

## README embed

Once captured, this is the exact block already in `README.md` §10 — no further edits needed
there:

```markdown
![SOTY Dashboard](docs/assets/soty-dashboard.png)
![SOTY Score — real signals](docs/assets/soty-score-real-signals.png)
![Evidence + local exports](docs/assets/soty-evidence-exports.png)
```
