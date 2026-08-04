import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Profile, ValidationResult } from "../lib/types";
import { useActiveProfile } from "../context/ActiveProfileContext";
import { shouldPublishActiveProfile } from "../lib/activeProfileState";

export default function Profiles() {
  const { setActiveProfile } = useActiveProfile();
  const [examples, setExamples] = useState<{ name: string; path: string }[]>([]);
  const [selected, setSelected] = useState<{ name: string; path: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listExampleProfiles()
      .then(setExamples)
      .catch((e) => setError(String(e)));
  }, []);

  async function open(p: { name: string; path: string }) {
    setSelected(p);
    setError(null);
    setResult(null);
    try {
      const loaded = await api.loadProfile(p.path);
      setProfile(loaded);
    } catch (e) {
      setError(String(e));
      setProfile(null);
    }
  }

  async function validate() {
    if (!profile) return;
    setError(null);
    try {
      const r = await api.validateProfile(profile);
      setResult(r);
      // Only a profile that has actually passed validation becomes the
      // shared active profile — a loaded-but-invalid profile never does.
      if (shouldPublishActiveProfile(r)) {
        setActiveProfile(profile);
      }
    } catch (e) {
      setError(String(e));
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Profiles</h1>
      </div>
      <div className="page-sub">
        YAML / JSON profiles describing the operator's authorized scope and transport.
      </div>

      <div className="grid cols-2">
        <div>
          <h3>Example profiles</h3>
          <div className="list">
            {examples.map((p) => (
              <div
                key={p.path}
                className={
                  selected?.path === p.path ? "list-row selected" : "list-row"
                }
                onClick={() => open(p)}
              >
                <div>
                  <div className="title">{p.name}</div>
                  <div className="subtitle">{p.path}</div>
                </div>
                <span className="mono muted">open</span>
              </div>
            ))}
            {examples.length === 0 && (
              <div className="card muted">No example profiles found.</div>
            )}
          </div>
        </div>

        <div>
          <h3>Detail</h3>
          {profile ? (
            <div className="card">
              <div className="kv">
                <div className="k">name</div>
                <div className="v">{profile.name}</div>
                <div className="k">mode</div>
                <div className="v">{profile.mode}</div>
                <div className="k">owner</div>
                <div className="v">{profile.owner ?? "—"}</div>
                <div className="k">purpose</div>
                <div className="v">{profile.purpose ?? "—"}</div>
                <div className="k">transport</div>
                <div className="v">{profile.transport}</div>
                <div className="k">kill_switch</div>
                <div className="v">{String(profile.kill_switch ?? false)}</div>
                <div className="k">dns_check</div>
                <div className="v">{String(profile.dns_check ?? false)}</div>
                <div className="k">evidence</div>
                <div className="v">{String(profile.evidence ?? false)}</div>
                <div className="k">allowed</div>
                <div className="v">
                  {(profile.allowed_targets ?? []).join(", ") || "—"}
                </div>
                <div className="k">blocked</div>
                <div className="v">
                  {(profile.blocked_targets ?? []).join(", ") || "—"}
                </div>
                <div className="k">tags</div>
                <div className="v">{(profile.tags ?? []).join(", ") || "—"}</div>
              </div>

              <div className="btn-row" style={{ marginTop: 14 }}>
                <button className="btn primary" onClick={validate}>
                  Validate
                </button>
              </div>

              {result && (
                <div
                  className={`warning ${result.valid ? "info" : "danger"}`}
                  style={{ marginTop: 14 }}
                >
                  <div className="code">{result.valid ? "valid" : "invalid"}</div>
                  <div className="msg">
                    {result.valid
                      ? "Profile shape is valid. Scope is the operator's responsibility."
                      : result.errors.join(" · ")}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card muted">Pick an example to inspect it.</div>
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
