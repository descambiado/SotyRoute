/**
 * SotyRoutePackSelector — interactive Route Pack grid (PR 6).
 *
 * Enhanced version of the PR 4 RoutePackQuickActions grid.
 * Each card now shows the compatible mission count and BOFA mode.
 * Clicking a pack updates local UI state — no system mutations occur.
 */
import { DEFAULT_ROUTE_PACKS } from "../../lib/routePackDefaults";
import { ROUTE_PACK_CONTEXTS } from "../../lib/sotyRoutePackContext";
import { bofaModeToTagClass } from "../../lib/sotyRoutePackPresenter";

interface Props {
  /** Currently selected pack id, or null if nothing is selected. */
  selectedId: string | null;
  /**
   * Called with the pack id on click.
   * The parent is responsible for toggling (deselecting if id matches selectedId).
   */
  onSelect: (id: string) => void;
}

/**
 * 4-column grid of route pack cards.
 * Each card shows name, truncated description, compatible mission count
 * and BOFA integration mode tag. Selecting a card is UI-only in PR 6.
 */
export default function SotyRoutePackSelector({ selectedId, onSelect }: Props) {
  return (
    <div className="pack-grid">
      {DEFAULT_ROUTE_PACKS.map((pack) => {
        const ctx = ROUTE_PACK_CONTEXTS[pack.id];
        const missionCount = ctx?.compatible_missions.length ?? 0;
        const bofaClass = bofaModeToTagClass(pack.bofa_integration_mode);

        return (
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
              {pack.description.length > 62
                ? pack.description.slice(0, 62) + "…"
                : pack.description}
            </div>
            <div className="pack-meta-chips">
              <span className="rc-tag" style={{ fontSize: 11 }}>
                {missionCount} mission{missionCount !== 1 ? "s" : ""}
              </span>
              <span
                className={`rc-tag${bofaClass ? ` ${bofaClass}` : ""}`}
                style={{ fontSize: 11 }}
              >
                BOFA: {pack.bofa_integration_mode}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
