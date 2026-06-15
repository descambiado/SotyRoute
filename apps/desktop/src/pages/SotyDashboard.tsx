/**
 * SotyDashboard — SOTY Score dashboard (PR 4 + PR 5 + PR 6).
 *
 * PR 4: Deterministic SOTY Score with demo presets, deduction list,
 *       recommended fixes, and route pack previews.
 * PR 5: Mission-to-Route Builder — local deterministic Soty Agent.
 * PR 6: Route Packs as interactive workflow presets.
 *       Selecting a pack updates the demo score context, shows compatible
 *       missions, score focus bars, and what the pack does/doesn't do.
 *       Clicking a mission chip builds a Route Card immediately.
 *
 * Safety: UI only. No external API calls. No AI inference. No system mutations.
 *         Pack selection updates local UI state only — no posture changes occur.
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
import { getPackDemoPreset } from "../lib/sotyRoutePackScoring";
import { ROUTE_PACK_CONTEXTS } from "../lib/sotyRoutePackContext";
import { DEFAULT_ROUTE_PACKS } from "../lib/routePackDefaults";
import type { MissionType, RouteCard } from "../types/routeCard";

import SotyScoreHero from "../components/soty/SotyScoreHero";
import SotySubscoreGrid from "../components/soty/SotySubscoreGrid";
import SotyDeductionList from "../components/soty/SotyDeductionList";
import RecommendedFixList from "../components/soty/RecommendedFixList";
import SotyRoutePackSelector from "../components/soty/SotyRoutePackSelector";
import SotyRoutePackDetail from "../components/soty/SotyRoutePackDetail";
import SotyMissionBuilder from "../components/soty/SotyMissionBuilder";
import SotyRouteCardPanel from "../components/soty/SotyRouteCardPanel";

export default function SotyDashboard() {
  // ── Demo preset (score context) ─────────────────────────────────────────
  const [preset, setPreset] = useState<DemoPresetKey>("ready");
  /** Set when a pack auto-updates the context, cleared on manual preset change. */
  const [contextNote, setContextNote] = useState<string | null>(null);

  // ── Route pack selection ─────────────────────────────────────────────────
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);

  // ── Mission builder state ────────────────────────────────────────────────
  const [selectedMission, setSelectedMission] = useState<MissionType | null>(null);
  const [builtCard, setBuiltCard] = useState<RouteCard | null>(null);
  const missionBuilderRef = useRef<HTMLDivElement>(null);

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handlePresetChange(key: DemoPresetKey) {
    setPreset(key);
    setContextNote(null); // user overrode the auto-context note
  }

  function handlePackSelect(packId: string) {
    // Toggle off if re-clicking the same pack
    if (packId === selectedPackId) {
      setSelectedPackId(null);
      setContextNote(null);
      return;
    }

    setSelectedPackId(packId);

    // Auto-update the demo score context to match the selected pack
    const suggestedPreset = getPackDemoPreset(packId);
    setPreset(suggestedPreset);

    const pack = DEFAULT_ROUTE_PACKS.find((p) => p.id === packId);
    if (pack) {
      setContextNote(
        `Score context updated to match "${pack.name}" — change the preset above to override.`
      );
    }
  }

  /** Called from the pack detail mission chip — selects + builds immediately. */
  function handlePackMissionSelect(mt: MissionType) {
    setSelectedMission(mt);
    setBuiltCard(buildRouteCard(mt));
    // Smooth-scroll to the Mission Builder section
    setTimeout(() => {
      missionBuilderRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  function handleBuildRoute() {
    if (!selectedMission) return;
    setBuiltCard(buildRouteCard(selectedMission));
  }

  function handleScrollToBuilder(defaultMission?: MissionType) {
    if (defaultMission && !selectedMission) {
      setSelectedMission(defaultMission);
    }
    missionBuilderRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ── Derived state ─────────────────────────────────────────────────────────

  const score = DEMO_PRESETS[preset];
  const selectedPack = selectedPackId
    ? (DEFAULT_ROUTE_PACKS.find((p) => p.id === selectedPackId) ?? null)
    : null;
  const selectedPackContext = selectedPackId
    ? (ROUTE_PACK_CONTEXTS[selectedPackId] ?? null)
    : null;

  return (
    <div>
      {/* ── Page header ── */}
      <div className="page-header" style={{ marginBottom: 4 }}>
        <h1 style={{ margin: 0 }}>SOTY Score</h1>
      </div>
      <div className="page-sub" style={{ marginBottom: 18 }}>
        Before you operate, become SOTY-ready.
      </div>

      {/* ── Information banner ── */}
      <div className="banner">
        <strong>What's here:</strong> SOTY Score (PR&nbsp;3 engine, demo presets) · Route Packs
        as workflow presets (PR&nbsp;6) · Mission-to-Route Builder (PR&nbsp;5). Selecting a Route
        Pack updates the score context and suggests compatible missions.{" "}
        <strong>No system checks run and no settings are changed here.</strong>
      </div>

      {/* ── Demo preset selector ── */}
      <div className="demo-selector">
        <span className="demo-selector-label">Demo preset:</span>
        {DEMO_PRESET_KEYS.map((key) => (
          <button
            key={key}
            className={`btn${preset === key ? " primary" : ""}`}
            onClick={() => handlePresetChange(key)}
          >
            {DEMO_PRESET_LABELS[key]}
          </button>
        ))}
        <span className="muted" style={{ marginLeft: "auto", fontSize: 11.5 }}>
          Overall score: {score.overall_score}/100 · profile:{" "}
          {score.profile_name ?? "—"}
        </span>
      </div>

      {/* Pack-driven context note */}
      {contextNote && (
        <div style={{ marginBottom: 14 }}>
          <span className="pack-context-note">{contextNote}</span>
        </div>
      )}

      {/* ── Big SOTY Score hero ── */}
      <SotyScoreHero score={score} />

      {/* ── Sub-score grid ── */}
      <SotySubscoreGrid score={score} />

      {/* ── Deductions + recommended fixes (2-col) ── */}
      <div className="soty-analysis-grid">
        <SotyDeductionList deductions={score.deductions} />
        <RecommendedFixList deductions={score.deductions} />
      </div>

      {/* ── Route Packs section (PR 6) ── */}
      <section style={{ marginTop: 32 }}>
        <div className="pack-section-header">
          <h2 className="pack-section-title">Route Packs</h2>
          <span className="pack-section-sub">
            Select a pack to see compatible missions, score focus and context.
            Pack selection updates local UI only — no system changes occur.
          </span>
        </div>

        <SotyRoutePackSelector
          selectedId={selectedPackId}
          onSelect={handlePackSelect}
        />

        {selectedPack && selectedPackContext && (
          <SotyRoutePackDetail
            pack={selectedPack}
            context={selectedPackContext}
            builtCard={builtCard}
            selectedMission={selectedMission}
            onMissionSelect={handlePackMissionSelect}
          />
        )}
      </section>

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
          "Build Mission Route" scrolls to the Mission Builder above. Remaining actions are
          planned features, disabled until their respective PRs ship. No system modifications
          are made without explicit confirmation.
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
