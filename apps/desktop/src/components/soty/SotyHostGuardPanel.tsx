/**
 * SotyHostGuardPanel — displays the result of a Host Guard posture check run.
 *
 * Read-only display. No system mutations occur here or in the engine it renders.
 */
import type { HostGuardSummary, HostGuardCheckPhase } from "../../types/hostGuard";
import {
  statusToVariant,
  statusToLabel,
  overallCopy,
  HOST_GUARD_LIMITATION_COPY,
} from "../../lib/sotyHostGuardPresenter";

interface Props {
  summary: HostGuardSummary;
}

const PHASE_LABELS: Record<HostGuardCheckPhase, string> = {
  host: "Host",
  route: "Route",
  process: "Process",
};

export default function SotyHostGuardPanel({ summary }: Props) {
  const overallVariant = statusToVariant(summary.overall);

  const byPhase: Record<HostGuardCheckPhase, typeof summary.checks> = {
    host: [],
    route: [],
    process: [],
  };
  for (const check of summary.checks) {
    byPhase[check.phase].push(check);
  }

  return (
    <div className="host-guard-panel">
      {/* Overall status */}
      <div className={`host-guard-overall ${overallVariant}`}>
        <div className="host-guard-overall-top">
          <span className={`status-badge ${overallVariant}`}>
            <span className="dot" />
            {statusToLabel(summary.overall)}
          </span>
          <span className="host-guard-overall-copy">{overallCopy(summary.overall)}</span>
        </div>
        <div className="host-guard-limitation">{HOST_GUARD_LIMITATION_COPY}</div>
      </div>

      {/* Check groups */}
      {(Object.entries(byPhase) as [HostGuardCheckPhase, typeof summary.checks][])
        .filter(([, checks]) => checks.length > 0)
        .map(([phase, checks]) => (
          <div key={phase} className="host-guard-phase-group">
            <div className="host-guard-phase-label">{PHASE_LABELS[phase]} checks</div>
            <div className="host-guard-check-list">
              {checks.map(check => {
                const variant = statusToVariant(check.status);
                return (
                  <div key={check.id} className={`host-guard-check-item ${variant}`}>
                    <div className="host-guard-check-header">
                      <span className={`status-badge ${variant}`} style={{ fontSize: 11 }}>
                        <span className="dot" />
                        {statusToLabel(check.status)}
                      </span>
                      <span className="host-guard-check-label">{check.label}</span>
                      <span className="host-guard-check-id muted mono">{check.id}</span>
                    </div>
                    <div className="host-guard-check-detail">{check.detail}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

      <div className="host-guard-footer muted">
        Run at: <span className="mono">{summary.run_at}</span> · Demo mode — no real system checks performed.
      </div>
    </div>
  );
}
