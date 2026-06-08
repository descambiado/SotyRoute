/**
 * SotyDashboard — SOTY Score dashboard (PR 4 + PR 5).
 *
 * PR 4: Deterministic SOTY Score with four demo presets, deduction list,
 *       recommended fixes, and route pack previews.
 * PR 5: Mission-to-Route Builder — local deterministic Soty Agent.
 *       "Build Mission Route" CTA now scrolls to and activates the builder.
 *
 * Safety: UI only. No external API calls. No AI inference. No system mutations.
 *         "Make me SOTY-ready", "Run Host Guard", "Launch BOFA Route" and
 *         "Open OSINT Navigator" remain disabled pending their respective PRs.
 */
import { useState, useRef } from "react";
import {
  DEMO_PRESETS,
  DEMO_PRESET_KEYS,
  DEMO_PRESET_LABELS,
  type DemoPresetKey,
} from "../lib/sotyDemoInput";
import { buildRouteCard } from "../lib/sotyRouteBuilder";
import type { MissionType, RouteCard } from "../types/routeCard";
import SotyScoreHero from "../components/soty/SotyScoreHero";
import SotySubscoreGrid from "../components/soty/SotySubscoreGrid";
import SotyDeductionList from "../components/soty/SotyDeductionList";
import RecommendedFixList from "../components/soty/RecommendedFixList";
import RoutePackQuickActions from "../components/soty/RoutePackQuickActions";
import SotyMissionBuilder from "../components/soty/SotyMissionBuilder";
import SotyRouteCardPanel from "../components/soty/SotyRouteCardPanel";

export default function SotyDashboard() {
  const [preset, setPreset] = useState<DemoPresetKey>("ready");
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);

  // ── Mission builder state (PR 5) ─────────────────────────────────────────
  const [selectedMission, setSelectedMission] = useState<MissionType | null>(null);
  const [builtCard, setBuiltCard] = useState<RouteCard | null>(null);
  const missionBuilderRef = useRef<HTMLDivElement>(null);

  function handleBuildRoute() {
    if (!selectedMission) return;
    // Pure deterministic call — no I/O, no mutations.
    setBuiltCard(buildRouteCard(selectedMission));
  }

  /** Scrolls to the mission builder and optionally pre-selects a mission. */
  function handleScrollToBuilder(defaultMission?: MissionType) {
    if (defaultMission && !selectedMission) {
      setSelectedMission(defaultMission);
    }
    missionBuilderRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const score = DEMO_PRESETS[preset];

  return (
    <div>
      {/* Page header */}
      <div className="page-header" style={{ marginBottom: 4 }}>
        <h1 style={{ margin: 0 }}>SOTY Score</h1>
      </div>
      <div className="page-sub" style={{ marginBottom: 18 }}>
        Before you operate, become SOTY-ready.
      </div>

      {/* Information banner */}
      <div className="banner">
        <strong>What's here:</strong> SOTY Score from the PR&nbsp;3 deterministic engine (demo
        presets) · Mission-to-Route Builder (PR&nbsp;5) — local deterministic planner, no
        external AI call. Real system checks (Host Guard, PR&nbsp;7) and settings changes require
        separate user initiation. <strong>No system checks run and no settings are changed here.</strong>
      </div>

      {/* Demo preset selector */}
      <div className="demo-selector">
        <span className="demo-selector-label">Demo preset:</span>
        {DEMO_PRESET_KEYS.map((key) => (
          <button
            key={key}
            className={`btn${preset === key ? " primary" : ""}`}
            onClick={() => setPreset(key)}
          >
            {DEMO_PRESET_LABELS[key]}
          </button>
        ))}
        <span className="muted" style={{ marginLeft: "auto", fontSize: 11.5 }}>
          Overall score: {score.overall_score}/100 · profile:{" "}
          {score.profile_name ?? "—"}
        </span>
      </div>

      {/* ── Big SOTY Score hero ── */}
      <SotyScoreHero score={score} />

      {/* ── Sub-score grid (5 sub-scores) ── */}
      <SotySubscoreGrid score={score} />

      {/* ── Deductions + recommended fixes (2-col) ── */}
      <div className="soty-analysis-grid">
        <SotyDeductionList deductions={score.deductions} />
        <RecommendedFixList deductions={score.deductions} />
      </div>

      {/* ── Route pack quick actions ── */}
      <RoutePackQuickActions
        selectedId={selectedPackId}
        onSelect={setSelectedPackId}
      />

      {/* ── Mission-to-Route Builder (PR 5) ── */}
      <hr className="section-divider" />
      <div ref={missionBuilderRef}>
        <SotyMissionBuilder
          selectedMission={selectedMission}
          onMissionChange={setSelectedMission}
          onBuild={handleBuildRoute}
        />

        {builtCard && (
          <div style={{ marginTop: 16 }}>
            <SotyRouteCardPanel card={builtCard} />
          </div>
        )}
      </div>

      {/* ── Action CTAs ── */}
      <hr className="section-divider" />
      <div>
        <h2 style={{ margin: "0 0 8px", fontSize: 16 }}>Actions</h2>
        <p className="muted" style={{ marginBottom: 14 }}>
          "Build Mission Route" scrolls to the Mission Builder above.
          Remaining actions are planned features, disabled until their respective PRs ship.
          No system modifications are made without explicit confirmation.
        </p>
        <div className="soty-cta-row">
          <button
            className="btn primary"
            disabled
            title="Automatic remediation — planned for a future PR. No system changes made now."
          >
            Make me SOTY-ready
          </button>
          <button
            className="btn"
            onClick={() => handleScrollToBuilder("investigate_domain")}
            title="Scroll to the Mission-to-Route Builder section."
          >
            Build Mission Route
          </button>
          <button
            className="btn"
            disabled
            title="Host Guard posture scan — planned for PR 7. Requires explicit user initiation."
          >
            Run Host Guard
          </button>
          <button
            className="btn"
            disabled
            title="Ethical OSINT Navigator — planned for PR 8."
          >
            Open OSINT Navigator
          </button>
          <button
            className="btn"
            disabled
            title="BOFA Route export — planned for PR 10. Requires BOFA Gate pre-flight."
          >
            Launch BOFA Route
          </button>
        </div>
        <p className="muted" style={{ marginTop: 8 }}>
          SotyRoute does not automate changes without explicit confirmation. It is not a VPN,
          not Tor, not an antivirus, and does not guarantee anonymity. For authorized labs,
          owned assets, and written-scope engagements only.
        </p>
      </div>
    </div>
  );
}
