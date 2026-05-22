# Icons

This directory holds the application icon set referenced by `tauri.conf.json`:

- `32x32.png`
- `128x128.png`
- `128x128@2x.png`
- `icon.icns` (macOS)
- `icon.ico` (Windows)
- `icon.png` (taskbar / tray fallback)

## How to generate them

Place a single high-resolution source (recommended: 1024×1024 transparent PNG) somewhere on disk, then from `apps/desktop`:

```powershell
npm run tauri icon ../../assets/sotyroute-logo.png
```

The Tauri CLI will write all required derivatives into this folder.

## Why these are not committed

Repository binary hygiene. Provide your own logo and generate locally. CI will skip the bundle step when icons are absent (see `.github/workflows/ci.yml`).

For `tauri dev` you typically do not need real icons — the dev window opens regardless — but `tauri build` does require this set.
