/**
 * SotyBofaGatePanel — PR 11.
 *
 * Displays the local BOFA Gate decision: verdict, allowed/disallowed module
 * lists, blocking/warning reasons, and required preflight checks.
 *
 * Safety: display only. No external calls. BOFA is never launched from here.
 * No offensive modules are enabled. No system mutations.
 */
import type { BofaGateDecision } from "../../types/bofaGate";

interface Props {
  gate: BofaGateDecision;
}

export default function SotyBofaGatePanel({ gate }: Props) {
  return (
    <div className="evidence-panel">
      <div className="evidence-panel-header">
        <div>
          <span className="evidence-panel-title">BOFA Gate Decision</span>
          <span className="evidence-panel-meta">
            {gate.generated_at}
          </span>
        </div>
        <span
          className={`evidence-state-badge evidence-state-${gate.verdict === "allowed" ? "soty_ready" : gate.verdict === "warning" ? "soty_warn" : "soty_blocked"}`}
        >
          {gate.verdict.toUpperCase()}
        </span>
      </div>

      <div className="evidence-limitation-banner">
        Local gate decision only — BOFA is not launched from this panel.
        No external services are contacted. No offensive modules are run.
      </div>

      <div className="evidence-section">
        <div className="evidence-section-title">Gate Inputs</div>
        <div className="evidence-kv">
          <span className="evidence-k">SOTY State</span>
          <span className="evidence-v">{gate.soty_state}</span>
          <span className="evidence-k">Route Pack</span>
          <span className="evidence-v">{gate.route_pack_id ?? "none selected"}</span>
          <span className="evidence-k">Required Evidence Level</span>
          <span className="evidence-v">{gate.required_evidence_level}</span>
          <span className="evidence-k">Current Evidence Level</span>
          <span className="evidence-v">{gate.current_evidence_level}</span>
          <span className="evidence-k">Preflight Passed</span>
          <span className="evidence-v">{String(gate.preflight_passed)}</span>
          <span className="evidence-k">Snapshot ID</span>
          <span className="evidence-v">{gate.evidence_snapshot_id ?? "none"}</span>
        </div>
      </div>

      {gate.blocking_reasons.length > 0 && (
        <div className="evidence-section">
          <div className="evidence-section-title">Blocking Reasons</div>
          <ul className="evidence-warning-list">
            {gate.blocking_reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {gate.warning_reasons.length > 0 && (
        <div className="evidence-section">
          <div className="evidence-section-title">Warning Reasons</div>
          <ul className="evidence-warning-list">
            {gate.warning_reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="evidence-section">
        <div className="evidence-section-title">
          Allowed Modules ({gate.allowed_modules.length})
        </div>
        {gate.allowed_modules.length > 0 ? (
          <ul className="evidence-warning-list">
            {gate.allowed_modules.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        ) : (
          <span className="muted">
            No modules permitted under current gate decision.
          </span>
        )}
      </div>

      <div className="evidence-section">
        <div className="evidence-section-title">
          Always Disallowed ({gate.disallowed_modules.length})
        </div>
        <ul className="evidence-warning-list">
          {gate.disallowed_modules.map((m) => (
            <li key={m} className="muted">{m}</li>
          ))}
        </ul>
      </div>

      <div className="evidence-section">
        <div className="evidence-section-title">Required Preflight Checks</div>
        <ul className="evidence-warning-list">
          {gate.required_preflight_checks.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
