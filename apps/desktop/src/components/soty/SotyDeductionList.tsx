import type { ScoreDeduction } from "../../types/sotyScore";
import { severityToVariant } from "../../lib/sotyPresenter";

interface Props {
  deductions: ScoreDeduction[];
}

/**
 * Renders the list of SOTY Score deductions.
 * Blocking deductions are visually flagged with a red left border.
 * Read-only — no mutations.
 */
export default function SotyDeductionList({ deductions }: Props) {
  return (
    <div>
      <h3 style={{ margin: "0 0 10px", fontSize: 14 }}>
        Deductions
        {deductions.length > 0 && (
          <span className="muted" style={{ marginLeft: 8, fontWeight: 400 }}>
            ({deductions.length})
          </span>
        )}
      </h3>

      {deductions.length === 0 ? (
        <div className="card" style={{ color: "var(--ok)", fontSize: 13 }}>
          ✓ No deductions — posture is clean.
        </div>
      ) : (
        <div className="deduction-list">
          {deductions.map((d) => (
            <div
              key={d.id}
              className={`deduction-row${d.blocking ? " blocking" : ""}`}
            >
              {/* Header row: severity badge + category + blocking flag */}
              <div className="deduction-header">
                <span className={`status-badge ${severityToVariant(d.severity)}`}>
                  <span className="dot" />
                  {d.severity}
                </span>
                <span className="muted mono" style={{ fontSize: 11 }}>
                  {d.category}
                </span>
                {d.blocking && (
                  <span className="status-badge danger">
                    <span className="dot" />
                    BLOCKING
                  </span>
                )}
              </div>

              {/* Deduction reason */}
              <div className="deduction-reason">{d.reason}</div>

              {/* Meta: points + signal + deduction ID */}
              <div className="deduction-meta">
                −{d.points_lost} pts · signal: {d.related_signal} · {d.id}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
