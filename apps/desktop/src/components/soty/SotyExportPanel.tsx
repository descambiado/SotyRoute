/**
 * SotyExportPanel — PR 11.
 *
 * Allows the operator to prepare BOFA and SotyHUB export payloads in memory
 * and then save both to the local evidence directory in a single Tauri write.
 *
 * Safety: no external calls; no SotyHUB upload; no network.
 * "Prepare" builds JSON in memory. "Save exports locally" writes to
 * ~/.sotyroute/runs/<timestamp>_soty/ via the Tauri save_soty_exports command.
 * No user-controlled path or filename is accepted.
 */
import { useState } from "react";
import type { BofaGateDecision } from "../../types/bofaGate";
import type { SotyEvidenceSnapshot } from "../../types/sotyEvidence";
import type { SotyBofaExportPayload } from "../../types/sotyBofaExport";
import type { SotyHubExportPayload } from "../../types/sotyHubExport";
import { buildBofaExportPayload } from "../../lib/sotyBofaExport";
import { buildSotyhubExportPayload } from "../../lib/sotyHubExport";
import {
  saveExports,
  type SotyExportSaveResult,
} from "../../lib/sotyExportPersistence";

type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved"; result: SotyExportSaveResult }
  | { status: "error"; error: string };

interface Props {
  gate: BofaGateDecision;
  snapshot: SotyEvidenceSnapshot | null;
}

export default function SotyExportPanel({ gate, snapshot }: Props) {
  const [bofaPayload, setBofaPayload] = useState<SotyBofaExportPayload | null>(null);
  const [sotyhubPayload, setSotyhubPayload] = useState<SotyHubExportPayload | null>(null);
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });

  function handlePrepareBofaExport() {
    if (!snapshot) return;
    setBofaPayload(buildBofaExportPayload(gate, snapshot));
  }

  function handlePrepareSotyhubExport() {
    if (!snapshot) return;
    setSotyhubPayload(buildSotyhubExportPayload(gate, snapshot));
  }

  async function handleSaveExports() {
    if (!bofaPayload || !sotyhubPayload) return;
    setSaveState({ status: "saving" });
    const outcome = await saveExports(bofaPayload, sotyhubPayload);
    if (outcome.status === "saved" && outcome.result) {
      setSaveState({ status: "saved", result: outcome.result });
    } else {
      setSaveState({ status: "error", error: outcome.error ?? "Unknown error" });
    }
  }

  const canPrepare = snapshot !== null;
  const bothPrepared = bofaPayload !== null && sotyhubPayload !== null;
  const isSaving = saveState.status === "saving";

  return (
    <div className="evidence-panel">
      <div className="evidence-panel-header">
        <span className="evidence-panel-title">Local Export Preparation</span>
      </div>

      <div className="evidence-limitation-banner">
        Exports are prepared and saved locally only.
        No data is transmitted externally. No SotyHUB upload is performed.
      </div>

      {!snapshot && (
        <div className="muted" style={{ marginBottom: 8 }}>
          Generate an evidence snapshot first to prepare exports.
        </div>
      )}

      {(bofaPayload || sotyhubPayload) && (
        <div className="evidence-section">
          <div className="evidence-section-title">Prepared Exports</div>
          <div className="evidence-kv">
            <span className="evidence-k">BOFA Export</span>
            <span className="evidence-v">
              {bofaPayload
                ? `bofa_export.json — schema: ${bofaPayload.schema}`
                : "not prepared"}
            </span>
            <span className="evidence-k">SotyHUB Export</span>
            <span className="evidence-v">
              {sotyhubPayload
                ? `sotyhub_export.json — schema: ${sotyhubPayload.export_schema_version}`
                : "not prepared"}
            </span>
            {bofaPayload && (
              <>
                <span className="evidence-k">Gate Decision</span>
                <span className="evidence-v">{bofaPayload.gate_decision}</span>
              </>
            )}
          </div>
        </div>
      )}

      <div className="evidence-action-bar">
        <button
          className="btn"
          disabled={!canPrepare}
          onClick={handlePrepareBofaExport}
        >
          {bofaPayload ? "Re-prepare BOFA export" : "Prepare BOFA export"}
        </button>
        <button
          className="btn"
          disabled={!canPrepare}
          onClick={handlePrepareSotyhubExport}
        >
          {sotyhubPayload ? "Re-prepare SotyHUB export" : "Prepare SotyHUB export"}
        </button>
        <button
          className="btn"
          disabled={!bothPrepared || saveState.status !== "idle"}
          onClick={handleSaveExports}
        >
          {saveState.status === "saving"
            ? "Saving…"
            : saveState.status === "saved"
              ? "Saved"
              : "Save exports locally"}
        </button>
      </div>

      {saveState.status === "saved" && (
        <div className="evidence-save-success">
          Saved to{" "}
          <span className="mono">{saveState.result.directory}</span>
          <span className="muted">
            {" "}({saveState.result.bofa_filename},{" "}
            {saveState.result.sotyhub_filename})
          </span>
        </div>
      )}

      {saveState.status === "error" && (
        <div className="evidence-save-error">
          Save failed: {saveState.error}
        </div>
      )}

      <div className="muted" style={{ fontSize: 11, marginTop: 8 }}>
        "Prepare" builds{" "}
        <span className="mono">bofa_export.json</span> and{" "}
        <span className="mono">sotyhub_export.json</span> in memory.{" "}
        "Save exports locally" writes both to{" "}
        <span className="mono">~/.sotyroute/runs/&lt;timestamp&gt;_soty/</span>.
        No data is sent externally.
      </div>
    </div>
  );
}
