import type { SotyScore } from "../../types/sotyScore";
import SotyStateBadge from "./SotyStateBadge";
import { sotyStateToVariant, sotyStateToCopy } from "../../lib/sotyPresenter";

interface Props {
  score: SotyScore;
}

/**
 * Big SOTY Score hero — circular score ring, state badge, operator copy,
 * and a deduction summary line. Read-only: no mutations.
 */
export default function SotyScoreHero({ score }: Props) {
  const variant = sotyStateToVariant(score.state);
  const blockingCount = score.deductions.filter((d) => d.blocking).length;

  return (
    <div className="soty-score-hero">
      {/* Circular score ring */}
      <div className={`soty-score-ring ${variant}`} aria-label={`SOTY Score ${score.overall_score} out of 100`}>
        <div className={`soty-score-number ${variant}`}>{score.overall_score}</div>
        <div className="muted" style={{ fontSize: 10, marginTop: 2 }}>/100</div>
      </div>

      {/* Hero body */}
      <div className="soty-hero-body">
        <div className="soty-hero-badges">
          <SotyStateBadge state={score.state} />
          {blockingCount > 0 && (
            <span className="status-badge danger">
              <span className="dot" />
              {blockingCount} blocking
            </span>
          )}
        </div>

        <div className="soty-hero-copy">{sotyStateToCopy(score.state)}</div>

        <div className="soty-hero-meta">
          {score.deductions.length === 0
            ? "No deductions — posture is clean."
            : `${score.deductions.length} deduction${score.deductions.length !== 1 ? "s" : ""} · route ${score.route_score} · host ${score.host_score} · scope ${score.scope_score} · intel ${score.intel_score} · evidence ${score.evidence_score}`}
          {score.profile_name && ` · profile: ${score.profile_name}`}
        </div>
      </div>
    </div>
  );
}
