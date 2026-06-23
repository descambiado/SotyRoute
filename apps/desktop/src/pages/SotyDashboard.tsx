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
        <span className="status-badge idle" style={{ fontSize: 11, padding: "2px 8px" }}>
          <span className="dot" />
          Demo mode
        </span>
      </div>
      <div className="page-sub" style={{ marginBottom: 14 }}>
        SOTY-ready route, OPSEC and evidence control plane. Before you operate, become SOTY-ready.
      </div>

      {/* ── Safe-mode notice ── */}
      <div className="safe-mode-notice">
        <strong>Local only.</strong>
        All scoring, routing, posture checks and exports run locally.
        No real system calls. No external APIs. No network traffic.
        No BOFA launch. No SotyHUB upload.
        Evidence and export files are written to{" "}
        <span className="mono">~/.sotyroute/runs/</span> only.
        For authorized security work only.
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

      {/* ── SOTY Workflow strip ── */}
      {(() => {
        const steps: Array<{ label: string; done: boolean }> = [
          { label: "Score",            done: true },
          { label: "Route Packs",      done: selectedPackId !== null },
          { label: "Mission Route",    done: builtCard !== null },
          { label: "Host Guard",       done: hostGuardSummary !== null },
          { label: "OSINT Navigator",  done: osintOpen },
          { label: "Evidence",         done: evidenceSnapshot !== null },
          { label: "Local Exports",    done: bofaGate !== null },
          { label: "BOFA Gate",        done: bofaGate !== null },
        ];
        return (
          <div className="soty-workflow-strip">
            <span className="workflow-strip-label">Workflow</span>
            {steps.map((step, i) => (
              <span key={step.label}>
                {i > 0 && <span className="workflow-arrow"> → </span>}
                <span className={`workflow-step${step.done ? " done" : step.label === "Score" ? " active" : ""}`}>
                  {step.label}
                </span>
              </span>
            ))}
          </div>
        );
      })()}

      {/* ── Big SOTY Score hero ── */}
      <SotyScoreHero score={score} />

      {/* ── Sub-score grid ── */}
      <SotySubscoreGrid score={score} />

      {/* ── Deductions + recommended fixes (2-col) ── */}
      <div className="soty-analysis-grid">
        <SotyDeductionList deductions={score.deductions} />
        <RecommendedFixList deductions={score.deductions} />
      </div>

      {/* ── Route Packs section ── */}
      <section style={{ marginTop: 32 }}>
        <div className="soty-section-header">
          <span className="soty-section-step">2</span>
          <h2 className="soty-section-title">Route Packs</h2>
          <span className="soty-section-sub">
            Select a workflow preset — updates score context and suggests compatible missions.
            Local UI only; no system changes.
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

      {/* ── Mission-to-Route Builder ── */}
      <hr className="section-divider" />
      <div ref={missionBuilderRef}>
        <div className="soty-section-header" style={{ marginBottom: 16 }}>
          <span className="soty-section-step">3</span>
          <h2 className="soty-section-title">Mission Route</h2>
          <span className="soty-section-sub">
            Pick a mission — the local Soty Agent builds a Route Card with recommended mode,
            required checks, allowed/disallowed modules and next safe actions.
          </span>
        </div>
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

      {/* ── SOTY Workflow actions ── */}
      <hr className="section-divider" />
      <div>
        <div className="soty-section-header" style={{ marginBottom: 10 }}>
          <h2 className="soty-section-title" style={{ fontSize: 16 }}>SOTY Workflow</h2>
        </div>
        <p className="muted" style={{ marginBottom: 14 }}>
          Run each step in sequence to build a complete SOTY-ready posture.
          All steps run locally — no system modifications, no external calls, no network traffic.
          <span style={{ color: "var(--text-2)", fontStyle: "italic" }}>
            {" "}Make me SOTY-ready (auto-remediation) is planned for a future release.
          </span>
        </p>
        <div className="soty-cta-row">
          <button
            className="btn primary"
            disabled
            title="Automatic remediation — planned for a future release. No system changes are made now."
          >
            Make me SOTY-ready
          </button>
          <button
            className="btn"
            onClick={() => handleScrollToBuilder("investigate_domain")}
            title="Scroll to the Mission Route builder."
          >
            Build Mission Route
          </button>
          <button
            className="btn"
            onClick={handleRunHostGuard}
            title="Run the Host Guard demo posture check. Reads demo signals only — no real system calls."
          >
            {hostGuardSummary ? "Re-run Host Guard" : "Run Host Guard"}
          </button>
          <button
            className="btn"
            onClick={handleOpenOsintNavigator}
            title="Open the Ethical OSINT Navigator — local authorized resource catalog. No external API calls."
          >
            {osintOpen ? "OSINT Navigator open ↓" : "Open OSINT Navigator"}
          </button>
          <button
            className="btn"
            onClick={handleGenerateEvidence}
            title="Generate a local evidence snapshot from current dashboard state. No data sent externally."
          >
            {evidenceSnapshot ? "Re-generate Evidence" : "Generate Evidence"}
          </button>
          <button
            className="btn"
            onClick={handleOpenBofaGate}
            title="Compute the local BOFA Gate decision. Does not launch BOFA. No external calls."
          >
            {bofaGate ? "Re-open BOFA Gate" : "Open BOFA Gate"}
          </button>
        </div>
        <p className="muted" style={{ marginTop: 8, fontSize: 11.5 }}>
          Not a VPN · not Tor · not an antivirus · no anonymity guarantee · no offensive execution ·
          no system mutations without explicit confirmation.
          For authorized labs, owned assets and written-scope engagements only.
        </p>
      </div>

      {/* ── Host Guard panel ── */}
      {hostGuardSummary && (
        <div ref={hostGuardRef} style={{ marginTop: 24 }}>
          <hr className="section-divider" />
          <div className="soty-section-header" style={{ marginBottom: 12 }}>
            <span className="soty-section-step">4</span>
            <h2 className="soty-section-title">Host Guard</h2>
            <span className="soty-section-sub" style={{ fontStyle: "italic" }}>
              Demo mode — read-only signals, no real system calls
            </span>
          </div>
          <SotyHostGuardPanel summary={hostGuardSummary} />
        </div>
      )}

      {/* ── Evidence panel ── */}
      {evidenceSnapshot && (
        <div ref={evidenceRef} style={{ marginTop: 24 }}>
          <hr className="section-divider" />
          <div className="soty-section-header" style={{ marginBottom: 12 }}>
            <span className="soty-section-step">6</span>
            <h2 className="soty-section-title">Evidence Snapshot</h2>
            <span className="soty-section-sub">
              Local snapshot — no data sent externally
            </span>
            <button
              className="btn"
              style={{ fontSize: 11.5, padding: "4px 10px", marginLeft: 8 }}
              onClick={() => setEvidenceSnapshot(null)}
            >
              Clear
            </button>
          </div>
          <SotyEvidencePanel snapshot={evidenceSnapshot} />
        </div>
      )}

      {/* ── BOFA Gate + Local Exports panel ── */}
      {bofaGateOpen && bofaGate && (
        <div ref={bofaGateRef} style={{ marginTop: 24 }}>
          <hr className="section-divider" />
          <div className="soty-section-header" style={{ marginBottom: 12 }}>
            <span className="soty-section-step">7</span>
            <h2 className="soty-section-title">BOFA Gate + Local Exports</h2>
            <span className="soty-section-sub">
              Local gate decision only — no BOFA launch, no SotyHUB upload
            </span>
            <button
              className="btn"
              style={{ fontSize: 11.5, padding: "4px 10px", marginLeft: 8 }}
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

      {/* ── OSINT Navigator panel ── */}
      {osintOpen && (
        <div ref={osintRef} style={{ marginTop: 24 }}>
          <hr className="section-divider" />
          <div className="soty-section-header" style={{ marginBottom: 12 }}>
            <span className="soty-section-step">5</span>
            <h2 className="soty-section-title">Ethical OSINT Navigator</h2>
            <span className="soty-section-sub">
              Local authorized resource catalog — no external API calls, no WebView
            </span>
            <button
              className="btn"
              style={{ fontSize: 11.5, padding: "4px 10px", marginLeft: 8 }}
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
