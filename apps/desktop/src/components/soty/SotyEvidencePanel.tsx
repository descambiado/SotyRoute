/**
 * SotyEvidencePanel — PR 9.
 *
 * Displays a local evidence snapshot generated from the current SOTY Dashboard
 * state. Provides copy-to-clipboard actions for JSON and Markdown previews.
 * Filesystem persistence is planned for a later PR.
 *
 * Safety: no external API calls, no system mutations, no filesystem writes.
 * Clipboard write is the only side-effect; it does not send data anywhere.
 */
import { useState } from "react";
import type { SotyEvidenceSnapshot } from "../../types/sotyEvidence";
import { renderEvidenceJson } from "../../lib/sotyEvidenceJson";
import { renderEvidenceMarkdown } from "../../lib/sotyEvidenceMarkdown";

type CopyTarget = "json" | "md";
type CopyState = { target: CopyTarget; status: "copied" } | null;

interface Props {
  snapshot: SotyEvidenceSnapshot;
}

export default function SotyEvidencePanel({ snapshot }: Props) {
  const [copyState, setCopyState] = useState<CopyState>(null);

  async function handleCopy(target: CopyTarget) {
    const text = target === "json"
      ? renderEvidenceJson(snapshot)
      : renderEvidenceMarkdown(snapshot);
    await navigator.clipboard.writeText(text);
    setCopyState({ target, status: "copied" });
    setTimeout(() => setCopyState(null), 2000);
  }

  const s = snapshot.soty_score;

  return (
    <div className="evidence-panel">
      {/* Header */}
      <div className="evidence-panel-header">
        <div>
          <span className="evidence-panel-title">SOTY Evidence Snapshot</span>
          <span className="evidence-panel-meta">
            {snapshot.generated_at} · schema v{snapshot.schema_version}
          </span>
        </div>
        <span className="evidence-panel-demo-badge">demo mode</span>
      </div>

      <div className="evidence-limitation-banner">
        This is a local SOTY evidence preview. No data has been sent externally.
        Filesystem persistence is planned for a later PR.
      </div>

      {/* Score summary */}
      <div className="evidence-section">
        <div className="evidence-section-title">SOTY Score</div>
        <div className="evidence-score-row">
          <span className="evidence-score-overall">{s.overall_score}/100</span>
          <span className={`evidence-state-badge evidence-state-${s.state.toLowerCase()}`}>
            {s.state}
          </span>
          <span className="evidence-score-breakdown muted">
            Route {s.route_score} · Host {s.host_score} · Scope {s.scope_score} ·
            Intel {s.intel_score} · Evidence {s.evidence_score}
          </span>
        </div>
        <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
          {s.deductions_count} deductions ({s.blocking_deductions_count} blocking)
        </div>
      </div>

      {/* Route Pack */}
      <div className="evidence-section">
        <div className="evidence-section-title">Route Pack</div>
        {snapshot.route_pack ? (
          <div className="evidence-kv">
            <span className="evidence-k">Pack</span>
            <span className="evidence-v">{snapshot.route_pack.name}</span>
            <span className="evidence-k">Evidence level</span>
            <span className="evidence-v">{snapshot.route_pack.evidence_level}</span>
            <span className="evidence-k">BOFA integration</span>
            <span className="evidence-v">{snapshot.route_pack.bofa_integration_mode}</span>
          </div>
        ) : (
          <span className="muted">No route pack selected.</span>
        )}
      </div>

      {/* Route Card */}
      <div className="evidence-section">
        <div className="evidence-section-title">Route Card</div>
        {snapshot.route_card ? (
          <div className="evidence-kv">
            <span className="evidence-k">Mission</span>
            <span className="evidence-v">{snapshot.route_card.mission_type}</span>
            <span className="evidence-k">Mode</span>
            <span className="evidence-v">{snapshot.route_card.recommended_mode}</span>
            <span className="evidence-k">Risk warnings</span>
            <span className="evidence-v">{snapshot.route_card.risk_warnings_count}</span>
          </div>
        ) : (
          <span className="muted">No route card generated.</span>
        )}
      </div>

      {/* Host Guard */}
      <div className="evidence-section">
        <div className="evidence-section-title">Host Guard</div>
        {snapshot.host_guard ? (
          <div className="evidence-kv">
            <span className="evidence-k">Status</span>
            <span className="evidence-v">{snapshot.host_guard.status}</span>
            <span className="evidence-k">Checks</span>
            <span className="evidence-v">
              {snapshot.host_guard.checks_count} run ·{" "}
              {snapshot.host_guard.warning_count} warn ·{" "}
              {snapshot.host_guard.fail_count} fail
            </span>
            <span className="evidence-k">Source</span>
            <span className="evidence-v">
              {snapshot.host_guard.source} — no real system checks performed
            </span>
          </div>
        ) : (
          <span className="muted">Host Guard not run.</span>
        )}
      </div>

      {/* OSINT summary */}
      <div className="evidence-section">
        <div className="evidence-section-title">OSINT Navigator</div>
        <div className="evidence-kv">
          <span className="evidence-k">Catalog</span>
          <span className="evidence-v">{snapshot.osint.resources_total} resources</span>
          <span className="evidence-k">By risk</span>
          <span className="evidence-v">
            {snapshot.osint.low_risk_count} low · {snapshot.osint.medium_risk_count} medium ·{" "}
            {snapshot.osint.high_risk_count} high · {snapshot.osint.blocked_count} blocked
          </span>
        </div>
        <div className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>
          Query content is not logged. External page contents are not logged.
        </div>
      </div>

      {/* Warnings */}
      {snapshot.warnings.length > 0 && (
        <div className="evidence-section">
          <div className="evidence-section-title">Warnings</div>
          <ul className="evidence-warning-list">
            {snapshot.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Redaction guarantees */}
      <div className="evidence-section evidence-redaction-section">
        <div className="evidence-section-title">Redaction Guarantees</div>
        <div className="evidence-redaction-grid">
          <span>Query content logged</span>
          <span className="evidence-redaction-false">{String(snapshot.redaction.query_content_logged)}</span>
          <span>External page content logged</span>
          <span className="evidence-redaction-false">{String(snapshot.redaction.external_page_content_logged)}</span>
          <span>Credentials logged</span>
          <span className="evidence-redaction-false">{String(snapshot.redaction.credentials_logged)}</span>
          <span>Tokens logged</span>
          <span className="evidence-redaction-false">{String(snapshot.redaction.tokens_logged)}</span>
          <span>Cookies logged</span>
          <span className="evidence-redaction-false">{String(snapshot.redaction.cookies_logged)}</span>
        </div>
      </div>

      {/* Copy / export actions */}
      <div className="evidence-action-bar">
        <button
          className="btn"
          onClick={() => handleCopy("json")}
        >
          {copyState?.target === "json" && copyState.status === "copied"
            ? "Copied JSON"
            : "Copy JSON preview"}
        </button>
        <button
          className="btn"
          onClick={() => handleCopy("md")}
        >
          {copyState?.target === "md" && copyState.status === "copied"
            ? "Copied Markdown"
            : "Copy Markdown preview"}
        </button>
        <button
          className="btn"
          disabled
          title="Save to local evidence directory — planned for a later PR. No filesystem writes in PR 9."
        >
          Save to evidence directory
        </button>
      </div>

      <div className="muted" style={{ fontSize: 11, marginTop: 8 }}>
        Copy actions write to your local clipboard only — no data is sent externally.
        "Save to evidence directory" will write{" "}
        <span className="mono">soty_evidence.json</span> and{" "}
        <span className="mono">soty_evidence.md</span> locally when enabled.
      </div>
    </div>
  );
}
