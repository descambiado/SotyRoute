import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { AppSettings } from "../lib/types";

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getSettings()
      .then(setSettings)
      .catch((e) => setError(String(e)));
  }, []);

  if (!settings) {
    return (
      <div>
        <h1>Settings</h1>
        <div className="card muted">Loading…</div>
      </div>
    );
  }

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings({ ...settings, [key]: value });
    setSaved(false);
  };

  async function save() {
    if (!settings) return;
    setError(null);
    try {
      const result = await api.setSettings(settings);
      setSettings(result);
      setSaved(true);
    } catch (e) {
      setError(String(e));
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
      </div>
      <div className="page-sub">Local preferences. Telemetry is disabled by default.</div>

      <div className="card">
        <label htmlFor="evdir">Evidence directory</label>
        <input
          id="evdir"
          type="text"
          value={settings.evidence_dir}
          onChange={(e) => update("evidence_dir", e.target.value)}
        />

        <label style={{ marginTop: 14 }} htmlFor="defmode">
          Default mode
        </label>
        <select
          id="defmode"
          value={settings.default_mode}
          onChange={(e) => update("default_mode", e.target.value as AppSettings["default_mode"])}
        >
          <option value="observe">observe</option>
          <option value="tor">tor</option>
          <option value="wireguard">wireguard</option>
          <option value="socks5">socks5</option>
          <option value="lab">lab</option>
        </select>

        <label style={{ marginTop: 14 }} htmlFor="theme">
          Theme
        </label>
        <select
          id="theme"
          value={settings.theme}
          onChange={(e) => update("theme", e.target.value as AppSettings["theme"])}
        >
          <option value="dark">dark</option>
          <option value="light">light (not yet implemented)</option>
        </select>

        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          <label>
            <input
              type="checkbox"
              checked={settings.telemetry_enabled}
              onChange={(e) => update("telemetry_enabled", e.target.checked)}
            />{" "}
            Enable telemetry (off by default — currently no telemetry endpoint exists)
          </label>
          <label>
            <input
              type="checkbox"
              checked={settings.public_ip_check_enabled}
              onChange={(e) => update("public_ip_check_enabled", e.target.checked)}
            />{" "}
            Allow opt-in public IP check (Doctor page)
          </label>
          <label>
            <input
              type="checkbox"
              checked={settings.export_bofa_default}
              onChange={(e) => update("export_bofa_default", e.target.checked)}
            />{" "}
            Auto-export BOFA JSON after every session
          </label>
          <label>
            <input
              type="checkbox"
              checked={settings.export_sotyhub_default}
              onChange={(e) => update("export_sotyhub_default", e.target.checked)}
            />{" "}
            Auto-export SotyHUB JSON after every session
          </label>
        </div>

        <div className="btn-row" style={{ marginTop: 18 }}>
          <button className="btn primary" onClick={save}>
            Save
          </button>
          {saved && <span className="muted">Saved.</span>}
        </div>
      </div>

      {error && (
        <div className="warning danger" style={{ marginTop: 16 }}>
          <div className="code">error</div>
          <div className="msg">{error}</div>
        </div>
      )}
    </div>
  );
}
