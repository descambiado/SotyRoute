import { DEFAULT_ROUTE_PACKS } from "../../lib/routePackDefaults";

interface Props {
  selectedId: string | null;
  /** Selecting a pack is UI-only in PR 4 — no system changes occur. */
  onSelect: (id: string) => void;
}

/**
 * Visual grid of the 8 default Route Packs.
 * Clicking a card updates local UI state only — the actual pack loader arrives
 * in PR 6. No system mutations occur here.
 */
export default function RoutePackQuickActions({ selectedId, onSelect }: Props) {
  const selectedPack = selectedId
    ? DEFAULT_ROUTE_PACKS.find((p) => p.id === selectedId) ?? null
    : null;

  return (
    <section>
      <h2 style={{ margin: "0 0 12px", fontSize: 16 }}>Route Packs</h2>
      <p className="muted" style={{ marginBottom: 14 }}>
        Select a pack to preview its settings. Pack loading and activation arrive in PR 6 — no
        system changes are made here.
      </p>

      {/* 4-column pack card grid */}
      <div className="pack-grid">
        {DEFAULT_ROUTE_PACKS.map((pack) => (
          <div
            key={pack.id}
            className={`pack-card${selectedId === pack.id ? " selected" : ""}`}
            role="button"
            tabIndex={0}
            aria-pressed={selectedId === pack.id}
            onClick={() => onSelect(pack.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(pack.id);
              }
            }}
          >
            <div className="pack-name">{pack.name}</div>
            <div className="pack-desc">
              {pack.description.length > 64
                ? pack.description.slice(0, 64) + "…"
                : pack.description}
            </div>
          </div>
        ))}
      </div>

      {/* Pack detail panel */}
      {selectedPack && (
        <div className="pack-detail">
          <h3>{selectedPack.name}</h3>
          <p>{selectedPack.description}</p>

          <div className="kv">
            <div className="k">target user</div>
            <div className="v">{selectedPack.target_user}</div>
            <div className="k">evidence level</div>
            <div className="v mono">{selectedPack.evidence_level}</div>
            <div className="k">BOFA integration</div>
            <div className="v mono">{selectedPack.bofa_integration_mode}</div>
            {selectedPack.osint_categories.length > 0 && (
              <>
                <div className="k">OSINT categories</div>
                <div className="v">{selectedPack.osint_categories.join(", ")}</div>
              </>
            )}
          </div>

          {selectedPack.safety_warnings.length > 0 && (
            <div style={{ marginTop: 12 }}>
              {selectedPack.safety_warnings.map((w, i) => (
                <div key={i} className="warning warn" style={{ marginBottom: 6 }}>
                  <div className="code">safety</div>
                  <div className="msg">{w}</div>
                </div>
              ))}
            </div>
          )}

          <p className="muted" style={{ marginTop: 12, marginBottom: 0 }}>
            Route Pack selection is a UI preview in PR 4. The pack loader and posture gating
            arrive in PR 6.
          </p>
        </div>
      )}
    </section>
  );
}
