import type { SotyScore } from "../../types/sotyScore";
import { scoreToVariant, subscoreHint } from "../../lib/sotyPresenter";

interface Props {
  score: SotyScore;
}

type SubScoreKey =
  | "route_score"
  | "host_score"
  | "scope_score"
  | "intel_score"
  | "evidence_score";

const SUBSCORES: ReadonlyArray<{ key: SubScoreKey; label: string; weight: string }> = [
  { key: "route_score",    label: "Route",    weight: "30%" },
  { key: "host_score",     label: "Host",     weight: "20%" },
  { key: "scope_score",    label: "Scope",    weight: "25%" },
  { key: "intel_score",    label: "Intel",    weight: "10%" },
  { key: "evidence_score", label: "Evidence", weight: "15%" },
];

/**
 * Five sub-score cards in a responsive row.
 * Each card shows the score, a variant-coloured number, and a hint line.
 * Read-only — no mutations.
 */
export default function SotySubscoreGrid({ score }: Props) {
  return (
    <div className="subscore-grid">
      {SUBSCORES.map(({ key, label, weight }) => {
        const value = score[key] as number;
        const variant = scoreToVariant(value);
        return (
          <div key={key} className={`subscore-card ${variant}`}>
            <div className="subscore-label">
              {label}
              <span className="muted" style={{ marginLeft: 5 }}>{weight}</span>
            </div>
            <div className={`subscore-value ${variant}`}>{value}</div>
            <div className="subscore-hint">{subscoreHint(value)}</div>
          </div>
        );
      })}
    </div>
  );
}
