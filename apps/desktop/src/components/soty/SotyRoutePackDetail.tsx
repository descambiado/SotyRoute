/**
 * SotyRoutePackDetail — rich Route Pack detail panel (PR 6).
 *
 * Displays: pack name/description, BOFA mode and evidence level badges,
 * score focus visualization (5 bars), compatible mission chips, what this
 * route improves, what it does not do, required confirmations, OSINT
 * categories, enabled checks, and safety warnings.
 *
 * When a Route Card is already built and the card's recommended pack differs
 * from the selected pack, a soft mismatch warning is shown.
 *
 * Safety: read-only, no mutations, no external calls.
 */
import type { RoutePack } from "../../types/routePack";
import type { RouteCard, MissionType } from "../../types/routeCard";
import type { RoutePackContext } from "../../lib/sotyRoutePackContext";
import { DEFAULT_ROUTE_PACKS } from "../../lib/routePackDefaults";
import {
  FOCUS_CATEGORIES,
  focusCategoryToLabel,
  focusLevelToLabel,
  focusLevelToPercent,
  bofaModeToLabel,
  bofaModeToTagClass,
  packMismatchWarning,
} from "../../lib/sotyRoutePackPresenter";
import SotyRoutePackMissionSuggestions from "./SotyRoutePackMissionSuggestions";

interface Props {
  pack: RoutePack;
  context: RoutePackContext;
  /** The most recently built Route Card, used for mismatch detection. */
  builtCard: RouteCard | null;
  /** Currently selected mission in the dashboard (for chip highlight). */
  selectedMission: MissionType | null;
  /** Called when the operator clicks a compatible mission chip. */
  onMissionSelect: (mt: MissionType) => void;
}

/**
 * Rich Route Pack detail panel.
 * Shows score focus bars, compatible missions, structured what-improves /
 * what-doesn't sections, metadata KV rows and safety warnings.
 */
export default function SotyRoutePackDetail({
  pack,
  context,
  builtCard,
  selectedMission,
  onMissionSelect,
}: Props) {
  const mismatch = builtCard
    ? packMismatchWarning(builtCard, pack.id, DEFAULT_ROUTE_PACKS)
    : null;

  const bofaClass = bofaModeToTagClass(pack.bofa_integration_mode);

  return (
    <div className="pack-detail">
      {/* ── Header: name, description, badges ── */}
      <div className="pack-detail-header">
        <div>
          <h3 className="pack-detail-title">{pack.name}</h3>
          <p className="pack-detail-desc">{pack.description}</p>
        </div>
        <div className="pack-detail-badges">
          <span className={`rc-tag${bofaClass ? ` ${bofaClass}` : ""}`}>
            {bofaModeToLabel(pack.bofa_integration_mode)}
          </span>
          <span className="rc-tag">
            {pack.evidence_level} evidence
          </span>
        </div>
      </div>

      {/* ── Score focus bars ── */}
      <div className="pack-focus-section">
        <div className="rc-section-title">Score focus for this route</div>
        <div className="focus-grid">
          {FOCUS_CATEGORIES.map((cat) => {
            const level = context.score_focus[cat];
            const pct = focusLevelToPercent(level);
            return (
              <div key={cat} className="focus-row">
                <div className="focus-category">{focusCategoryToLabel(cat)}</div>
                <div className="focus-bar-wrap">
                  <div
                    className={`focus-bar-fill ${level}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className={`focus-level-label ${level}`}>
                  {focusLevelToLabel(level)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Compatible mission chips ── */}
      <SotyRoutePackMissionSuggestions
        missions={context.compatible_missions}
        selectedMission={selectedMission}
        onSelect={onMissionSelect}
      />

      {/* ── Pack mismatch warning ── */}
      {mismatch && (
        <div className="warning warn" style={{ marginBottom: 14 }}>
          <div className="code">route pack</div>
          <div className="msg">{mismatch}</div>
        </div>
      )}

      {/* ── What improves / what doesn't (2-col) ── */}
      <div className="pack-detail-grid">
        <div>
          <div className="rc-section-title">What this route improves</div>
          <ul className="rc-action-list">
            {context.what_this_route_improves.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="rc-section-title">What this route does not do</div>
          <ul className="rc-action-list not-list">
            {context.what_this_route_does_not_do.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Metadata KV rows ── */}
      <div className="kv">
        <div className="k">target user</div>
        <div className="v">{pack.target_user}</div>

        {pack.required_confirmations.length > 0 && (
          <>
            <div className="k">confirmations</div>
            <div className="v">
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {pack.required_confirmations.map((c, i) => (
                  <li
                    key={i}
                    style={{ fontSize: 12.5, color: "var(--text-1)", marginBottom: 3 }}
                  >
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {pack.osint_categories.length > 0 && (
          <>
            <div className="k">OSINT categories</div>
            <div className="v">
              <div className="rc-tag-list">
                {pack.osint_categories.map((cat) => (
                  <span key={cat} className="rc-tag resource">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {pack.enabled_checks.length > 0 && (
          <>
            <div className="k">enabled checks</div>
            <div className="v">
              <div className="rc-tag-list">
                {pack.enabled_checks.map((c) => (
                  <span key={c} className="rc-tag">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Safety warnings ── */}
      {pack.safety_warnings.length > 0 && (
        <div style={{ marginTop: 14 }}>
          {pack.safety_warnings.map((w, i) => (
            <div key={i} className="warning warn" style={{ marginBottom: 6 }}>
              <div className="code">safety</div>
              <div className="msg">{w}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
