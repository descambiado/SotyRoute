import type { RouteCard } from "../../types/routeCard";
import {
  modeToLabel,
  evidenceLevelToHint,
  routeCardBofaSummary,
  routeCardBofaIsBlocked,
  recommendedRoutePackId,
} from "../../lib/sotyRouteCardPresenter";
import { DEFAULT_ROUTE_PACKS } from "../../lib/routePackDefaults";

interface Props {
  card: RouteCard;
}

/**
 * Displays a generated Route Card in full detail.
 *
 * Read-only — this is a recommendation panel, not an action panel.
 * All items shown here are informational. No system changes occur.
 */
export default function SotyRouteCardPanel({ card }: Props) {
  const packId = recommendedRoutePackId(card.mission_type);
  const pack = DEFAULT_ROUTE_PACKS.find((p) => p.id === packId);
  const bofaBlocked = routeCardBofaIsBlocked(card);

  return (
    <div className="route-card-panel">
      {/* Header */}
      <div className="rc-panel-header">
        <h3>{card.title}</h3>
        <span className="status-badge idle">
          <span className="dot" />
          <span className="mono" style={{ fontSize: 11 }}>{card.id}</span>
        </span>
      </div>
      <p className="rc-summary">{card.summary}</p>

      {/* Metadata row: mode, evidence, route pack, created_at */}
      <div className="rc-meta-row">
        <div className="rc-meta-item">
          <span className="rc-meta-label">Mode</span>
          <span className="rc-meta-value">{modeToLabel(card.recommended_mode)}</span>
        </div>
        <div className="rc-meta-item">
          <span className="rc-meta-label">Evidence</span>
          <span className="rc-meta-value">{card.evidence_settings}</span>
        </div>
        {pack && (
          <div className="rc-meta-item">
            <span className="rc-meta-label">Route Pack</span>
            <span className="rc-meta-value">{pack.name}</span>
          </div>
        )}
        <div className="rc-meta-item">
          <span className="rc-meta-label">BOFA</span>
          <span className="rc-meta-value">
            {bofaBlocked ? "blocked" : `${card.bofa_allowed_modules.length} allowed`}
          </span>
        </div>
        <div className="rc-meta-item" style={{ marginLeft: "auto" }}>
          <span className="rc-meta-label">Generated</span>
          <span className="rc-meta-value">{new Date(card.created_at).toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Two-column body */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Left column */}
        <div>
          {/* Required checks */}
          <div className="rc-section">
            <div className="rc-section-title">Required checks</div>
            <div className="rc-tag-list">
              {card.required_checks.map((c) => (
                <span key={c} className="rc-tag">{c}</span>
              ))}
            </div>
          </div>

          {/* Risk warnings */}
          <div className="rc-section">
            <div className="rc-section-title">Risk warnings</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {card.risk_warnings.map((w, i) => (
                <div key={i} className="warning warn">
                  <div className="code">warn</div>
                  <div className="msg">{w}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Scope requirements */}
          <div className="rc-section">
            <div className="rc-section-title">Scope requirements</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {card.scope_requirements.map((s, i) => (
                <div key={i} className="warning info">
                  <div className="code">scope</div>
                  <div className="msg">{s}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div>
          {/* OSINT / resource categories */}
          {card.recommended_resources.length > 0 && (
            <div className="rc-section">
              <div className="rc-section-title">Recommended resource categories</div>
              <div className="rc-tag-list">
                {card.recommended_resources.map((r) => (
                  <span key={r} className="rc-tag resource">{r}</span>
                ))}
              </div>
            </div>
          )}

          {/* Evidence hint */}
          <div className="rc-section">
            <div className="rc-section-title">Evidence settings</div>
            <div style={{ fontSize: 13, color: "var(--text-1)" }}>
              {evidenceLevelToHint(card.evidence_settings)}
            </div>
          </div>

          {/* BOFA modules */}
          <div className="rc-section">
            <div className="rc-section-title">BOFA status</div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
              {routeCardBofaSummary(card)}
            </div>
            {card.bofa_allowed_modules.length > 0 && (
              <div style={{ marginBottom: 6 }}>
                <div className="rc-section-title" style={{ marginBottom: 4 }}>Allowed</div>
                <div className="rc-tag-list">
                  {card.bofa_allowed_modules.map((m) => (
                    <span key={m} className="rc-tag allowed">{m}</span>
                  ))}
                </div>
              </div>
            )}
            {card.bofa_disallowed_modules.length > 0 && (
              <div>
                <div className="rc-section-title" style={{ marginBottom: 4 }}>Blocked</div>
                <div className="rc-tag-list">
                  {card.bofa_disallowed_modules.map((m) => (
                    <span key={m} className="rc-tag blocked">{m}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Route pack detail */}
          {pack && (
            <div className="rc-section">
              <div className="rc-section-title">Recommended route pack</div>
              <div className="kv">
                <div className="k">pack</div>
                <div className="v">{pack.name}</div>
                <div className="k">target user</div>
                <div className="v">{pack.target_user}</div>
                <div className="k">BOFA mode</div>
                <div className="v mono">{pack.bofa_integration_mode}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Next safe actions — full width */}
      <div className="rc-section" style={{ borderTop: "1px solid var(--border)", paddingTop: 18, marginTop: 4 }}>
        <div className="rc-section-title">Next safe actions</div>
        <ol className="rc-action-list">
          {card.next_safe_actions.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ol>
      </div>

      {/* Footer disclaimer */}
      <div className="muted" style={{ marginTop: 16, fontSize: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
        Route Card is a recommendation only. No system action has been taken.
        All suggested actions require explicit operator confirmation.
        SotyRoute does not guarantee anonymity. For authorized labs, owned assets and
        written-scope engagements only.
      </div>
    </div>
  );
}
