import { useState } from "react";
import { api } from "../lib/api";
import type { DoctorReport } from "../lib/types";
import StatusBadge from "../components/StatusBadge";

export default function Doctor() {
  const [report, setReport] = useState<DoctorReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const r = await api.runDoctor();
      setReport(r);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Doctor</h1>
        <button className="btn primary" onClick={run} disabled={busy}>
          {busy ? "Running…" : "Run checks"}
        </button>
      </div>
      <div className="page-sub">
        Non-destructive system snapshot. Read-only. Surfaces what SotyRoute would need to
        plan a real session.
      </div>

      {!report && !error && (
        <div className="card muted">
          Click <span className="mono">Run checks</span> to capture system state. Nothing
          is modified.
        </div>
      )}

      {report && (
        <>
          <div className="grid cols-2">
            <div className="card">
              <h3>Host</h3>
              <div className="kv">
                <div className="k">os</div>
                <div className="v">{report.os_name}</div>
                <div className="k">version</div>
                <div className="v">{report.os_version}</div>
                <div className="k">hostname</div>
                <div className="v">{report.hostname}</div>
                <div className="k">user</div>
                <div className="v">{report.user}</div>
                <div className="k">admin</div>
                <div className="v">
                  <StatusBadge variant={report.admin ? "warn" : "ok"}>
                    {report.admin ? "elevated" : "standard user"}
                  </StatusBadge>
                </div>
                <div className="k">captured_at</div>
                <div className="v">{report.generated_at}</div>
              </div>
            </div>

            <div className="card">
              <h3>Transport availability</h3>
              <div className="kv">
                <div className="k">Tor</div>
                <div className="v">
                  <StatusBadge variant={report.tor_installed ? "ok" : "idle"}>
                    {report.tor_installed ? "detected" : "not detected"}
                  </StatusBadge>
                </div>
                <div className="k">tor hint</div>
                <div className="v">{report.tor_hint}</div>
                <div className="k">WireGuard</div>
                <div className="v">
                  <StatusBadge variant={report.wireguard_installed ? "ok" : "idle"}>
                    {report.wireguard_installed ? "detected" : "not detected"}
                  </StatusBadge>
                </div>
                <div className="k">wg hint</div>
                <div className="v">{report.wireguard_hint}</div>
              </div>
            </div>
          </div>

          <h2>DNS</h2>
          <div className="card">
            {report.dns_servers.length > 0 ? (
              <ul className="mono" style={{ margin: 0, paddingLeft: 18 }}>
                {report.dns_servers.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            ) : (
              <div className="muted">No DNS servers reported.</div>
            )}
          </div>

          <h2>Network interfaces</h2>
          <div className="list">
            {report.interfaces.map((iface) => (
              <div key={iface.name} className="card">
                <div className="kv">
                  <div className="k">name</div>
                  <div className="v">{iface.name}</div>
                  <div className="k">description</div>
                  <div className="v">{iface.description}</div>
                  <div className="k">state</div>
                  <div className="v">
                    <StatusBadge variant={iface.is_up ? "ok" : "idle"}>
                      {iface.is_up ? "up" : "down"}
                    </StatusBadge>
                  </div>
                  <div className="k">addresses</div>
                  <div className="v">{iface.addresses.join(", ") || "—"}</div>
                </div>
              </div>
            ))}
          </div>

          <h2>Recommended next steps</h2>
          <div className="card muted">
            <ol style={{ margin: 0, paddingLeft: 18 }}>
              <li>Load an authorized profile from the <strong>Profiles</strong> tab.</li>
              <li>Run <strong>Observe</strong> to capture a baseline snapshot.</li>
              <li>Use <strong>Dry Run</strong> to preview a transport plan without changes.</li>
              <li>Export <strong>BOFA</strong> / <strong>SotyHUB</strong> JSON when ready.</li>
            </ol>
          </div>
        </>
      )}

      {error && (
        <div className="warning danger" style={{ marginTop: 16 }}>
          <div className="code">error</div>
          <div className="msg">{error}</div>
        </div>
      )}
    </div>
  );
}
