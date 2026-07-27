/**
 * Confirmation gate for opening an OSINT resource.
 *
 * For medium/high-risk resources: shows risk level, allowed-use copy, the URL
 * (for inspection), and a "Copy URL" action so the operator can paste it into
 * their authorized research browser.
 *
 * For low-risk resources: lighter variant of the same modal.
 *
 * Tauri shell::open integration is a placeholder — copy-URL is the safe
 * fallback for PR 8. A future PR will wire shell::open when ready.
 *
 * Safety: no external network calls are made here or in the parent engine.
 */
import type { OsintConfirmationState } from "../../types/osintNavigator";
import {
  riskToVariant,
  OSINT_RISK_LABELS,
  riskToConfirmationWarning,
  OSINT_EXTERNAL_RESOURCE_WARNING,
} from "../../lib/osintNavigatorPresenter";

interface Props {
  state: OsintConfirmationState;
  onCancel: () => void;
  onCopy: () => void;
}

export default function OsintConfirmationModal({ state, onCancel, onCopy }: Props) {
  if (state.status === "idle" || !state.resource) return null;

  const resource = state.resource;
  const variant = riskToVariant(resource.risk);
  const isCopied = state.status === "copied";

  return (
    <div className="osint-modal-overlay" onClick={onCancel}>
      <div className="osint-modal" onClick={e => e.stopPropagation()}>
        <div className="osint-modal-header">
          <div className="osint-modal-title-row">
            <span className="osint-modal-title">{resource.name}</span>
            <span className={`status-badge ${variant}`}>
              <span className="dot" />
              {OSINT_RISK_LABELS[resource.risk]} risk
            </span>
          </div>
          <div className={`osint-modal-warning ${variant}`}>
            {riskToConfirmationWarning(resource.risk)}
          </div>
        </div>

        <div className="osint-modal-body">
          <div className="osint-modal-section-label">Authorized use</div>
          <div className="osint-modal-allowed-use">{resource.allowed_use}</div>

          <div className="osint-modal-section-label" style={{ marginTop: 14 }}>External URL</div>
          <div className="osint-modal-url">
            <span className="mono">{resource.url}</span>
          </div>
          <div className="osint-modal-url-note muted">
            {OSINT_EXTERNAL_RESOURCE_WARNING}
          </div>
        </div>

        <div className="osint-modal-footer">
          {!isCopied ? (
            <>
              <button className="btn" onClick={onCancel}>Cancel</button>
              <button
                className={`btn ${variant === "danger" ? "danger" : variant === "warn" ? "warn" : "primary"}`}
                onClick={onCopy}
              >
                Copy URL to clipboard
              </button>
            </>
          ) : (
            <>
              <div className="osint-modal-copied-msg">
                URL copied — paste into your authorized research browser.
              </div>
              <button className="btn" onClick={onCancel}>Close</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
