import { MISSION_TYPES, type MissionType } from "../../types/routeCard";
import {
  missionTypeToLabel,
  missionTypeToDescription,
} from "../../lib/sotyRouteCardPresenter";

interface Props {
  selectedMission: MissionType | null;
  onMissionChange: (mt: MissionType) => void;
  onBuild: () => void;
}

/**
 * Mission selector and "Build Route Card" trigger.
 *
 * Controlled component — state lives in the parent (SotyDashboard).
 * No system mutations occur here; "Build Route Card" calls buildRouteCard()
 * which is a pure function returning a read-only plan.
 *
 * Safety: UI only. No external API calls. No AI inference.
 *         This is a local deterministic planner.
 */
export default function SotyMissionBuilder({
  selectedMission,
  onMissionChange,
  onBuild,
}: Props) {
  return (
    <div className="mission-builder">
      {/* Header */}
      <div className="mission-builder-header">
        <div>
          <h2 className="mission-builder-title">Mission-to-Route Builder</h2>
          <div className="mission-builder-sub">
            Select a mission type to generate a deterministic Route Card.
          </div>
        </div>
        <span className="planner-badge">
          Local deterministic planner — no external AI call in this version.
        </span>
      </div>

      {/* Mission type grid */}
      <div className="mission-grid">
        {MISSION_TYPES.map((mt) => (
          <button
            key={mt}
            className={`mission-btn${selectedMission === mt ? " selected" : ""}`}
            onClick={() => onMissionChange(mt)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onMissionChange(mt);
              }
            }}
            aria-pressed={selectedMission === mt}
          >
            {missionTypeToLabel(mt)}
          </button>
        ))}
      </div>

      {/* Selected mission description */}
      {selectedMission ? (
        <div className="mission-desc-card">
          {missionTypeToDescription(selectedMission)}
        </div>
      ) : (
        <div className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
          Select a mission above to see its description and recommended posture.
        </div>
      )}

      {/* Build button */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button
          className="btn primary"
          onClick={onBuild}
          disabled={!selectedMission}
          title={
            selectedMission
              ? `Build a Route Card for: ${missionTypeToLabel(selectedMission)}`
              : "Select a mission first"
          }
        >
          Build Route Card
        </button>
        {!selectedMission && (
          <span className="muted" style={{ fontSize: 12 }}>
            ← Select a mission first
          </span>
        )}
        <span className="muted" style={{ fontSize: 11.5, marginLeft: "auto" }}>
          Route Cards are recommendations only. No system changes are made.
        </span>
      </div>
    </div>
  );
}
