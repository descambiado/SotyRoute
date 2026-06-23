# docs/assets — Screenshot captures

Place screenshot captures here and reference them from `README.md`.

## Capture instructions

Start the dev app (`npm run tauri dev` from `apps/desktop/`), navigate to `/soty`, and take
captures at these workflow moments:

| File | When to capture |
|---|---|
| `soty-dashboard.png` | Score ring visible — use **Soty-Ready** preset. Shows SOTY Score hero, sub-score grid, deduction list and workflow strip. |
| `soty-evidence.png` | After clicking **Generate Evidence** — snapshot panel open, JSON/Markdown preview visible. |
| `soty-exports.png` | After clicking **Open BOFA Gate** then **Prepare BOFA export** + **Prepare SotyHUB export** — both payloads prepared, save button enabled. |

## Recommended tool

Use the Tauri window (1280 × 800) and capture with your OS screenshot tool or
[ShareX](https://getsharex.com/) on Windows. Crop to the content area only (no OS chrome).

## README embed

```markdown
![SOTY Dashboard](docs/assets/soty-dashboard.png)
![Evidence Snapshot](docs/assets/soty-evidence.png)
![BOFA Gate + Exports](docs/assets/soty-exports.png)
```
