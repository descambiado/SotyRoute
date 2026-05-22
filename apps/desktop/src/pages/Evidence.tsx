import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { SessionDetail, SessionSummary } from "../lib/types";
import StatusBadge from "../components/StatusBadge";

export default function Evidence() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    try {
      const list = await api.listSessions();
      setSessions(list);
      if (list[0] && !selected) {
        open(list[0].session_id);
      }
    } catch (e) {
      setError(String(e));
    }
  }

  async function open(id: string) {
    setSelected(id);
    setError(null);
    try {
      const d = await api.readSession(id);
      setDetail(d);
    } catch (e) {
      setError(String(e));
      setDetail(null);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Evidence</h1>
        <button className="btn" onClick={() => api.openEvidenceDir()}>
          Open evidence root
        </button>
      </div>
      <div className="page-sub">
        Every session produces a structured bundle: <span className="mono">session.json</span>,{" "}
        <span className="mono">checks.json</span>, <span className="mono">plan.json</span>,{" "}
        <span className="mono">warnings.json</span>, <span className="mono">evidence.md</span>.
      </div>

      <div className="grid cols-2">
        <div>
          <h3>Sessions</h3>
          <div className="list">
            {sessions.map((s) => (
              <div
                key={s.session_id}
                className={selected === s.session_id ? "list-row selected" : "list-row"}
                onClick={() => open(s.session_id)}
              >
                <div>
                  <div className="title">{s.session_id}</div>
                  <div className="subtitle">
                    {s.mode} · {s.profile_name} · {s.started_at}
                  </div>
                </div>
                <StatusBadge
                  variant={
                    s.status === "completed"
                      ? "ok"
                      : s.status === "partial"
                        ? "warn"
                        : "danger"
                  }
                >
                  {s.status}
                </StatusBadge>
              </div>
            ))}
            {sessions.length === 0 && (
              <div className="card muted">
                No sessions yet. Run Observe from the Dashboard.
              </div>
            )}
          </div>
        </div>

        <div>
          <h3>Detail</h3>
          {detail ? (
            <div className="card">
              <div className="kv">
                <div className="k">session_id</div>
                <div className="v">{detail.session_id}</div>
                <div className="k">mode</div>
                <div className="v">{detail.mode}</div>
                <div className="k">profile</div>
                <div className="v">{detail.profile_name}</div>
                <div className="k">status</div>
                <div className="v">{detail.status}</div>
                <div className="k">dry_run</div>
                <div className="v">{String(detail.dry_run)}</div>
                <div className="k">admin</div>
                <div className="v">{String(detail.admin)}</div>
                <div className="k">started_at</div>
                <div className="v">{detail.started_at}</div>
                <div className="k">ended_at</div>
                <div className="v">{detail.ended_at}</div>
                <div className="k">evidence_dir</div>
                <div className="v">{detail.evidence_dir}</div>
              </div>

              {detail.warnings.length > 0 && (
                <>
                  <h3 style={{ marginTop: 16 }}>Warnings</h3>
                  <div className="list">
                    {detail.warnings.map((w, i) => (
                      <div
                        key={i}
                        className={`warning ${
                          w.severity === "error"
                            ? "danger"
                            : w.severity === "warn"
                              ? "warn"
                              : "info"
                        }`}
                      >
                        <div className="code">{w.code}</div>
                        <div className="msg">{w.message}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <h3 style={{ marginTop: 16 }}>Plan</h3>
              <pre>{JSON.stringify(detail.plan, null, 2)}</pre>

              <h3 style={{ marginTop: 16 }}>evidence.md</h3>
              <pre>{detail.evidence_md}</pre>

              <div className="btn-row" style={{ marginTop: 14 }}>
                <button
                  className="btn"
                  onClick={() => api.openEvidenceDir(detail.session_id)}
                >
                  Open folder
                </button>
                <button
                  className="btn primary"
                  onClick={async () => {
                    try {
                      const p = await api.exportBofa(detail.session_id);
                      alert(`Wrote ${p}`);
                    } catch (e) {
                      setError(String(e));
                    }
                  }}
                >
                  Export BOFA
                </button>
                <button
                  className="btn primary"
                  onClick={async () => {
                    try {
                      const p = await api.exportSotyhub(detail.session_id);
                      alert(`Wrote ${p}`);
                    } catch (e) {
                      setError(String(e));
                    }
                  }}
                >
                  Export SotyHUB
                </button>
              </div>
            </div>
          ) : (
            <div className="card muted">Select a session to inspect it.</div>
          )}
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
