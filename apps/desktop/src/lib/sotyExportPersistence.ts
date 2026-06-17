/**
 * Export persistence wrapper — PR 11.
 *
 * Serializes prepared BOFA and SotyHUB export payloads and writes them to the
 * local evidence directory via the Tauri save_soty_exports command.
 *
 * Safety: no external calls; no SotyHUB upload; no network.
 * Filesystem writes go only to ~/.sotyroute/runs/<timestamp>_soty/ via Tauri.
 * No user-controlled path or filename is accepted by the backend command.
 */
import { invoke } from "@tauri-apps/api/tauri";
import type { SotyBofaExportPayload } from "../types/sotyBofaExport";
import type { SotyHubExportPayload } from "../types/sotyHubExport";
import { renderBofaExportJson } from "./sotyBofaExport";
import { renderSotyhubExportJson } from "./sotyHubExport";

export interface SotyExportSaveResult {
  directory: string;
  bofa_filename: string;
  sotyhub_filename: string;
  generated_at: string;
}

export interface SaveExportsOutcome {
  status: "saved" | "error";
  result: SotyExportSaveResult | null;
  error: string | null;
}

export async function saveExports(
  bofaPayload: SotyBofaExportPayload,
  sotyhubPayload: SotyHubExportPayload,
): Promise<SaveExportsOutcome> {
  const bofaJson = renderBofaExportJson(bofaPayload);
  const sotyhubJson = renderSotyhubExportJson(sotyhubPayload);
  try {
    const result = await invoke<SotyExportSaveResult>("save_soty_exports", {
      bofaJson,
      sotyhubJson,
    });
    return { status: "saved", result, error: null };
  } catch (e) {
    return { status: "error", result: null, error: String(e) };
  }
}
