import type { ScoreDeduction } from "../../types/sotyScore";
import { dedupFixes } from "../../lib/sotyPresenter";

interface Props {
  deductions: ScoreDeduction[];
}

/**
 * De-duplicated list of recommended fixes derived from deductions.
 * Shows action type, confirmation requirements, and autorun safety.
 *
 * Safety note: all fixes are informational only in PR 4.
 * No fix is executed here. "Make me SOTY-ready" automation arrives in a future PR.
 */
export default function RecommendedFixList({ deductions }: Props) {
  const fixes = dedupFixes(deductions);

  return (
    <div>
      <h3 style={{ margin: "0 0 10px", fontSize: 14 }}>
        Recommended fixes
        {fixes.length > 0 && (
          <span className="muted" style={{ marginLeft: 8, fontWeight: 400 }}>
            ({fixes.length})
          </span>
        )}
      </h3>

      {fixes.length === 0 ? (
        <div className="card" style={{ color: "var(--ok)", fontSize: 13 }}>
          ✓ No fixes needed — score is clean.
        </div>
      ) : (
        <div className="fix-list">
          {fixes.map((fix) => (
            <div key={fix.id} className="fix-row">
              <div className="fix-title">{fix.title}</div>
              <div className="fix-desc">{fix.description}</div>
              <div className="fix-tags">
                <span className="status-badge idle">
                  <span className="dot" />
                  {fix.action_type}
                </span>
                {fix.requires_confirmation && (
                  <span className="status-badge warn">
                    <span className="dot" />
                    requires confirmation
                  </span>
                )}
                {fix.safe_to_autorun ? (
                  <span className="status-badge ok">
                    <span className="dot" />
                    safe to autorun
                  </span>
                ) : (
                  <span className="status-badge idle">
                    <span className="dot" />
                    manual
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
