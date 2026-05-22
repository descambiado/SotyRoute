import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { Mode, Profile, SessionSummary } from "../lib/types";
import StatusBadge from "../components/StatusBadge";

type Status = "idle" | "observe" | "dryrun" | "running" | "error";

export default function Dashboard() {
  const navigate = useNavigate();
  const [examples, setExamples] = useState<{ name: string; path: string }[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profilePath, setProfilePath] = useState<string>("");
  const [status, setStatus] = useState<Status>("idle");
  const [recent, setRecent] = useState<SessionSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .listExampleProfiles()
      .then(setExamples)
      .catch((e) => setError(String(e)));
    refreshRecent();
  }, []);

  async function refreshRecent() {
    try {
      const list = await api.listSessions();
      setRecent(list[0] ?? null);
    } catch (e) {
      setError(String(e));
    }
  }

  async function pickProfile(path: string) {
    setError(null);
    setProfilePath(path);
    try {
      const p = await api.loadProfile(path);
      setProfile(p);
    } catch (e) {
      setError(String(e));
      setProfile(null);
    }
  }

  async function run(action: "observe" | Mode) {
    if (!profile) {
      setError("Select a profile first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const summary =
        action === "observe"
          ? await api.startObserve(profile)
          : await api.dryRun(action, profile);
      setRecent(summary);
      setStatus(action === "observe" ? "observe" : "dryrun");
    } catch (e) {
      setError(String(e));
      setStatus("error");
    } finally {
      setBusy(false);
    }
  }

  const heroVariant: "ok" | "warn" | "info" | "danger" | "idle" =
    status === "error"
      ? "danger"
      : status === "observe"
        ? "info"
        : status === "dryrun"
          ? "warn"
          : "idle";

  const heroLabel =
    status === "error"
      ? "Error"
      : status === "observe"
        ? "Observe only"
        : status === "dryrun"
          ? "Dry-run completed"
          : "Idle";

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <StatusBadge variant={heroVariant}>{heroLabel}</StatusBadge>
      </div>
      <div className="page-sub">Before running tools, know where your traffic goes.</div>

      <div className={`hero ${heroVariant}`}>
        <div>
          <div className="label">Current status</div>
          <div className="value">{heroLabel}</div>
          <div className="meta">
            {profile ? (
              <>
                Profile <span className="mono">{profile.name}</span> · mode{" "}
                <span className="mono">{profile.mode}</span>
              </>
            ) : (
              "No profile loaded"
            )}
          </div>
        </div>
        <StatusBadge variant={heroVariant}>{status.toUpperCase()}</StatusBadge>
      </div>

      <div className="banner">
        SotyRoute v0.1.0 never modifies system network configuration. All non-observe modes
        produce a dry-run <span className="mono">plan.json</span>; nothing is executed.
      </div>

      <div className="grid cols-2">
        <div className="card">
          <h3>Profile</h3>
          <label htmlFor="prof">Example profile</label>
          <select
            id="prof"
            value={profilePath}
            onChange={(e) => pickProfile(e.target.value)}
          >
            <option value="">-- select --</option>
            {examples.map((p) => (
              <option key={p.path} value={p.path}>
                {p.name}
              </option>
            ))}
          </select>
          {profile && (
            <div className="kv" style={{ marginTop: 14 }}>
              <div className="k">name</div>
              <div className="v">{profile.name}</div>
              <div className="k">mode</div>
              <div className="v">{profile.mode}</div>
              <div className="k">owner</div>
              <div className="v">{profile.owner ?? "—"}</div>
              <div className="k">transport</div>
              <div className="v">{profile.transport}</div>
              <div className="k">allowed</div>
              <div className="v">{(profile.allowed_targets ?? []).join(", ") || "—"}</div>
              <div className="k">blocked</div>
              <div className="v">{(profile.blocked_targets ?? []).join(", ") || "—"}</div>
            </div>
          )}
        </div>

        <div className="card">
          <h3>Actions</h3>
          <div className="btn-row">
            <button
              className="btn primary"
              disabled={!profile || busy}
              onClick={() => run("observe")}
            >
              Start Observe
            </button>
            <button
              className="btn warn"
              disabled={!profile || busy}
              onClick={() => run("tor")}
            >
              Dry Run Tor
            </button>
            <button
              className="btn warn"
              disabled={!profile || busy}
              onClick={() => run("wireguard")}
            >
              Dry Run WireGuard
            </button>
            <button
              className="btn warn"
              disabled={!profile || busy}
              onClick={() => run("socks5")}
            >
              Dry Run SOCKS5
            </button>
            <button
              className="btn"
              disabled={!profile || busy}
              onClick={() => run("lab")}
            >
              Lab Mode
            </button>
          </div>
          <p className="muted" style={{ marginTop: 14 }}>
            Every action writes a session bundle to{" "}
            <span className="mono">%USERPROFILE%\.sotyroute\runs\</span>.
          </p>
        </div>
      </div>

      <h2>Most recent session</h2>
      {recent ? (
        <div className="card">
          <div className="kv">
            <div className="k">session_id</div>
            <div className="v">{recent.session_id}</div>
            <div className="k">mode</div>
            <div className="v">{recent.mode}</div>
            <div className="k">profile</div>
            <div className="v">{recent.profile_name}</div>
            <div className="k">status</div>
            <div className="v">{recent.status}</div>
            <div className="k">dry_run</div>
            <div className="v">{recent.dry_run ? "true" : "false"}</div>
            <div className="k">started_at</div>
            <div className="v">{recent.started_at}</div>
            <div className="k">warnings</div>
            <div className="v">{recent.warnings_count}</div>
            <div className="k">evidence_dir</div>
            <div className="v">{recent.evidence_dir}</div>
          </div>
          <div className="btn-row" style={{ marginTop: 14 }}>
            <button className="btn" onClick={() => navigate("/evidence")}>
              View in Evidence
            </button>
            <button
              className="btn"
              onClick={() => api.openEvidenceDir(recent.session_id)}
            >
              Open folder
            </button>
          </div>
        </div>
      ) : (
        <div className="card muted">No sessions yet. Start with Observe.</div>
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
