/**
 * SotyDashboard — SOTY Score dashboard (PR 4 + PR 5 + PR 6 + PR 7).
 *
 * PR 4: Deterministic SOTY Score with demo presets, deduction list,
 *       recommended fixes, and route pack previews.
 * PR 5: Mission-to-Route Builder — local deterministic Soty Agent.
 * PR 6: Route Packs as interactive workflow presets.
 *       Selecting a pack updates the demo score context, shows compatible
 *       missions, score focus bars, and what the pack does/doesn't do.
 *       Clicking a mission chip builds a Route Card immediately.
 * PR 7: Host Guard posture checks — "Run Host Guard" CTA enabled.
 *       Runs a deterministic read-only engine against demo signals matching
 *       the active preset. No real system checks; no mutations.
 * PR 8: Ethical OSINT Navigator — "Open OSINT Navigator" CTA enabled.
 *       Local catalog of authorized defensive resources with category/risk
 *       filters, confirmation gates, and blocked-by-policy cards.
 *       No external API calls; no WebView embedding; no system mutations.
 * PR 9: Evidence snapshot — "Generate Evidence" CTA enabled.
 *       Assembles a local SotyEvidenceSnapshot from current dashboard state.
 *       Copy JSON / Copy Markdown preview. No filesystem writes; no external calls.
 * PR 11: BOFA Gate + SotyHUB Export — "Open BOFA Gate" CTA enabled.
 *        Deterministic gate decision from current score + route pack.
 *        Prepare BOFA and SotyHUB export payloads locally.
 *        "Save exports locally" writes bofa_export.json + sotyhub_export.json
 *        to ~/.sotyroute/runs/<timestamp>_soty/ via Tauri. No BOFA launch.
 *        No SotyHUB upload. No external calls.
 *
 * Safety: UI only. No external API calls. No AI inference. No system mutations.
 *         Pack selection, Host Guard, OSINT Navigator, Evidence, and BOFA Gate
 *         all run local UI state. "Make me SOTY-ready" remains disabled.
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

import { runHostGuard, DEMO_HOST_GUARD_INPUTS } from "../lib/sotyHostGuardEngine";
import type { HostGuardSummary } from "../types/hostGuard";
import SotyOsintNavigator from "../components/soty/SotyOsintNavigator";
import { buildEvidenceSnapshot } from "../lib/sotyEvidenceBuilder";
import type { SotyEvidenceSnapshot } from "../types/sotyEvidence";
import SotyEvidencePanel from "../components/soty/SotyEvidencePanel";
import SotyBofaGatePanel from "../components/soty/SotyBofaGatePanel";
import SotyExportPanel from "../components/soty/SotyExportPanel";
import { buildBofaGateDecision } from "../lib/sotyBofaGate";
import type { BofaGateDecision } from "../types/bofaGate";

import SotyScoreHero from "../components/soty/SotyScoreHero";
import SotySubscoreGrid from "../components/soty/SotySubscoreGrid";
import SotyDeductionList from "../components/soty/SotyDeductionList";
import RecommendedFixList from "../components/soty/RecommendedFixList";
import SotyRoutePackSelector from "../components/soty/SotyRoutePackSelector";
import SotyRoutePackDetail from "../components/soty/SotyRoutePackDetail";
import SotyMissionBuilder from "../components/soty/SotyMissionBuilder";
import SotyRouteCardPanel from "../components/soty/SotyRouteCardPanel";
import SotyHostGuardPanel from "../components/soty/SotyHostGuardPanel";

export default function SotyDashboard() {
  // ── Demo preset (score context) ─────────────────────────────────────────
  const [preset, setPreset] = useState<DemoPresetKey>("ready");
  /** Set when a pack auto-updates the context, cleared on manual preset change. */
  const [contextNote, setContextNote] = useState<string | null>(null);

  // ── Route pack selection ─────────────────────────────────────────────────
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);

  // ── Host Guard state ─────────────────────────────────────────────────────
  const [hostGuardSummary, setHostGuardSummary] = useState<HostGuardSummary | null>(null);
  const hostGuardRef = useRef<HTMLDivElement>(null);

  // ── OSINT Navigator state ─────────────────────────────────────────────────
  const [osintOpen, setOsintOpen] = useState(false);
  const osintRef = useRef<HTMLDivElement>(null);

  // ── Evidence snapshot state (PR 9) ──────────────────────────────────────
  const [evidenceSnapshot, setEvidenceSnapshot] = useState<SotyEvidenceSnapshot | null>(null);
  const evidenceRef = useRef<HTMLDivElement>(null);

  // ── BOFA Gate state (PR 11) ──────────────────────────────────────────────
  const [bofaGate, setBofaGate] = useState<BofaGateDecision | null>(null);
  const [bofaGateOpen, setBofaGateOpen] = useState(false);
  const bofaGateRef = useRef<HTMLDivElement>(null);

  // ── Mission builder state ────────────────────────────────────────────────
  const [selectedMission, setSelectedMission] = useState<MissionType | null>(null);
  const [builtCard, setBuiltCard] = useState<RouteCard | null>(null);
  const missionBuilderRef = useRef<HTMLDivElement>(null);

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handlePresetChange(key: DemoPresetKey) {
    setPreset(key);
    setContextNote(null);
    setHostGuardSummary(null);
    setEvidenceSnapshot(null);
    setBofaGate(null);
    setBofaGateOpen(false);
  }

  function handleRunHostGuard() {
    const summary = runHostGuard(DEMO_HOST_GUARD_INPUTS[preset]);
    setHostGuardSummary(summary);
    setTimeout(() => {
      hostGuardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function handleOpenOsintNavigator() {
    setOsintOpen(true);
    setTimeout(() => {
      osintRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function handleGenerateEvidence() {
    const snapshot = buildEvidenceSnapshot(score, selectedPack, builtCard, hostGuardSummary, {
      demoPreset: preset,
    });
    setEvidenceSnapshot(snapshot);
    setTimeout(() => {
      evidenceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function handleOpenBofaGate() {
    const gate = buildBofaGateDecision(score, selectedPack, evidenceSnapshot?.id ?? null);
    setBofaGate(gate);
    setBofaGateOpen(true);
    setTimeout(() => {
      bofaGateRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function handlePackSelect(packId: string) {
    // Toggle off if re-clicking the same pack
    if (packId === selectedPackId) {
      setSelectedPackId(null);
      setContextNote(null);
      setBofaGate(null);
      setBofaGateOpen(false);
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
        as workflow presets (PR&nbsp;6) · Mission-to-Route Builder (PR&nbsp;5) · Host Guard
        posture checks (PR&nbsp;7, demo mode) · Ethical OSINT Navigator (PR&nbsp;8, local catalog).
        Selecting a Route Pack updates the score context and suggests compatible missions.{" "}
        <strong>No real system checks run and no settings are changed here.</strong>
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
          "Build Mission Route" scrolls to the Mission Builder above.
          "Open BOFA Gate" runs the local gate engine against the current score and pack.
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
            onClick={handleRunHostGuard}
            title="Run Host Guard demo posture check against the active preset signals. No real system checks performed."
          >
            Run Host Guard
          </button>
          <button
            className="btn"
            onClick={handleOpenOsintNavigator}
            title="Open the Ethical OSINT Navigator — local resource catalog with category/risk filters and confirmation gates. No external API calls."
          >
            Open OSINT Navigator
          </button>
          <button
            className="btn"
            onClick={handleGenerateEvidence}
            title="Generate a local evidence snapshot from current dashboard state. No data sent externally."
          >
            Generate Evidence
          </button>
          <button
            className="btn"
            onClick={handleOpenBofaGate}
            title="Compute the local BOFA Gate decision for the current score and route pack. Does not launch BOFA. No external calls."
          >
            Open BOFA Gate
          </button>
        </div>
        <p className="muted" style={{ marginTop: 8 }}>
          SotyRoute does not automate changes without explicit confirmation. It is not a VPN,
          not Tor, not an antivirus, and does not guarantee anonymity. For authorized labs,
          owned assets, and written-scope engagements only.
        </p>
      </div>

      {/* ── Host Guard panel (PR 7) ── */}
      {hostGuardSummary && (
        <div ref={hostGuardRef} style={{ marginTop: 24 }}>
          <hr className="section-divider" />
          <h2 style={{ margin: "0 0 12px", fontSize: 16 }}>Host Guard</h2>
          <SotyHostGuardPanel summary={hostGuardSummary} />
        </div>
      )}

      {/* ── Evidence panel (PR 9) ── */}
      {evidenceSnapshot && (
        <div ref={evidenceRef} style={{ marginTop: 24 }}>
          <hr className="section-divider" />
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 16 }}>Evidence Snapshot</h2>
            <button
              className="btn"
              style={{ fontSize: 11.5, padding: "4px 10px" }}
              onClick={() => setEvidenceSnapshot(null)}
            >
              Clear
            </button>
          </div>
          <SotyEvidencePanel snapshot={evidenceSnapshot} />
        </div>
      )}

      {/* ── BOFA Gate + Export panel (PR 11) ── */}
      {bofaGateOpen && bofaGate && (
        <div ref={bofaGateRef} style={{ marginTop: 24 }}>
          <hr className="section-divider" />
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 16 }}>BOFA Gate</h2>
            <button
              className="btn"
              style={{ fontSize: 11.5, padding: "4px 10px" }}
              onClick={() => setBofaGateOpen(false)}
            >
              Close
            </button>
          </div>
          <SotyBofaGatePanel gate={bofaGate} />
          <div style={{ marginTop: 16 }}>
            <SotyExportPanel gate={bofaGate} snapshot={evidenceSnapshot} />
          </div>
        </div>
      )}

      {/* ── OSINT Navigator panel (PR 8) ── */}
      {osintOpen && (
        <div ref={osintRef} style={{ marginTop: 24 }}>
          <hr className="section-divider" />
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 16 }}>Ethical OSINT Navigator</h2>
            <button
              className="btn"
              style={{ fontSize: 11.5, padding: "4px 10px" }}
              onClick={() => setOsintOpen(false)}
            >
              Close
            </button>
          </div>
          <SotyOsintNavigator selectedPackId={selectedPackId} />
        </div>
      )}
    </div>
  );
}
