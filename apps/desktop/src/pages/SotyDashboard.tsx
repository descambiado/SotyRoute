/**
 * SotyDashboard — PR 4 SOTY Score dashboard page.
 *
 * Shows the deterministic SOTY Score from the PR 3 scoring engine using
 * four demo presets (ready / warn / exposed / blocked). All CTA buttons
 * are disabled placeholders — no system mutations occur in PR 4.
 *
 * Safety: UI only. No external API calls. No system modifications.
 *         All "Make me SOTY-ready / Run Host Guard / Launch BOFA" actions
 *         are explicitly disabled pending their respective PRs (5, 7, 10).
 */
import { useState } from "react";
import {
  DEMO_PRESETS,
  DEMO_PRESET_KEYS,
  DEMO_PRESET_LABELS,
  type DemoPresetKey,
} from "../lib/sotyDemoInput";
import SotyScoreHero from "../components/soty/SotyScoreHero";
import SotySubscoreGrid from "../components/soty/SotySubscoreGrid";
import SotyDeductionList from "../components/soty/SotyDeductionList";
import RecommendedFixList from "../components/soty/RecommendedFixList";
import RoutePackQuickActions from "../components/soty/RoutePackQuickActions";

export default function SotyDashboard() {
  const [preset, setPreset] = useState<DemoPresetKey>("ready");
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);

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
        This dashboard surfaces the deterministic SOTY Score from the PR&nbsp;3 scoring engine.
        Use the demo presets below to see how each posture state looks. Real system checks —
        which require user-initiated runs — arrive in PR&nbsp;7 (Host Guard) and PR&nbsp;5
        (Mission Route). <strong>No system checks are run and no settings are changed here.</strong>
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

      {/* ── Action CTAs — all disabled in PR 4 ── */}
      <div style={{ marginTop: 32 }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 16 }}>Actions</h2>
        <p className="muted" style={{ marginBottom: 14 }}>
          All action buttons are planned features. They are disabled in PR&nbsp;4.
          No system modifications are made — mutations require explicit confirmation
          and land in their respective PRs.
        </p>
        <div className="soty-cta-row">
          <button
            className="btn primary"
            disabled
            title="Automatic remediation — planned for a future PR. No changes made now."
          >
            Make me SOTY-ready
          </button>
          <button
            className="btn"
            disabled
            title="Mission route builder — planned for PR 5."
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
