import type { OsintResource } from "../../types/osintNavigator";
import {
  riskToVariant,
  OSINT_RISK_LABELS,
  OSINT_CATEGORY_LABELS,
} from "../../lib/osintNavigatorPresenter";

interface Props {
  resource: OsintResource;
  relevantToSelectedPack: boolean;
  onOpen: (resource: OsintResource) => void;
}

export default function OsintResourceCard({ resource, relevantToSelectedPack, onOpen }: Props) {
  const variant = riskToVariant(resource.risk);
  const isBlocked = resource.risk === "blocked";

  return (
    <div className={`osint-resource-card ${variant}${isBlocked ? " blocked" : ""}`}>
      {/* Header */}
      <div className="osint-card-header">
        <div className="osint-card-name">{resource.name}</div>
        <div className="osint-card-badges">
          <span className={`status-badge ${variant}`} style={{ fontSize: 11 }}>
            <span className="dot" />
            {OSINT_RISK_LABELS[resource.risk]}
          </span>
          {relevantToSelectedPack && !isBlocked && (
            <span className="status-badge info" style={{ fontSize: 11 }}>
              <span className="dot" />
              Pack match
            </span>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="osint-card-categories">
        {resource.categories.map(cat => (
          <span key={cat} className="osint-category-tag">
            {OSINT_CATEGORY_LABELS[cat]}
          </span>
        ))}
      </div>

      {/* Description */}
      <div className="osint-card-desc">{resource.description}</div>

      {/* Allowed-use copy */}
      <div className="osint-card-allowed">
        <span className="osint-card-allowed-label">Authorized use: </span>
        {resource.allowed_use}
      </div>

      {/* Footer: missions + action */}
      <div className="osint-card-footer">
        {resource.relevant_missions.length > 0 && (
          <div className="osint-card-missions">
            {resource.relevant_missions.slice(0, 3).map(m => (
              <span key={m} className="osint-mission-tag">{m.replace(/_/g, " ")}</span>
            ))}
            {resource.relevant_missions.length > 3 && (
              <span className="osint-mission-tag muted">+{resource.relevant_missions.length - 3}</span>
            )}
          </div>
        )}

        {isBlocked ? (
          <span className="osint-blocked-badge">
            Blocked by policy
          </span>
        ) : (
          <button
            className="btn osint-open-btn"
            onClick={() => onOpen(resource)}
            title={`Open ${resource.name} — ${OSINT_RISK_LABELS[resource.risk]} risk. Opens in your external browser.`}
          >
            Open →
          </button>
        )}
      </div>
    </div>
  );
}
