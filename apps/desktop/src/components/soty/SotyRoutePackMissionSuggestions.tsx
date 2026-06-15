/**
 * SotyRoutePackMissionSuggestions — PR 6.
 *
 * Renders compatible missions for a selected Route Pack as clickable
 * chips. Clicking a chip calls onSelect to pre-fill the Mission Builder
 * and build a Route Card immediately.
 *
 * Safety: UI only. No system calls, no mutations.
 */
import { missionTypeToLabel } from "../../lib/sotyRouteCardPresenter";
import type { MissionType } from "../../types/routeCard";

interface Props {
  /** Missions compatible with the active route pack. */
  missions: readonly MissionType[];
  /** Currently selected mission in the dashboard (may be from a different source). */
  selectedMission: MissionType | null;
  /** Called when the operator clicks a mission chip. */
  onSelect: (mt: MissionType) => void;
}

/**
 * Chip list of compatible missions for a route pack.
 * Each chip shows the mission label and highlights the currently selected one.
 * Clicking a chip selects the mission and triggers an immediate Route Card build
 * via the parent's onSelect handler.
 */
export default function SotyRoutePackMissionSuggestions({
  missions,
  selectedMission,
  onSelect,
}: Props) {
  if (missions.length === 0) return null;

  return (
    <div className="pack-mission-suggestions">
      <div className="rc-section-title">Compatible missions</div>
      <div className="mission-chip-list">
        {missions.map((mt) => (
          <button
            key={mt}
            className={`mission-chip${selectedMission === mt ? " selected" : ""}`}
            onClick={() => onSelect(mt)}
            title={`Build a Route Card for: ${missionTypeToLabel(mt)}`}
          >
            {missionTypeToLabel(mt)}
          </button>
        ))}
      </div>
      <p className="muted" style={{ marginTop: 8, marginBottom: 0, fontSize: 12 }}>
        Selecting a mission builds a Route Card using the local deterministic
        planner. No external calls are made.
      </p>
    </div>
  );
}
