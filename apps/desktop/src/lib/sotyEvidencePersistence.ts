import { invoke } from "@tauri-apps/api/tauri";
import type { SotyEvidenceSnapshot } from "../types/sotyEvidence";
import { renderEvidenceJson } from "./sotyEvidenceJson";
import { renderEvidenceMarkdown } from "./sotyEvidenceMarkdown";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface SotyEvidenceSaveResult {
  directory: string;
  json_filename: string;
  md_filename: string;
  generated_at: string;
}

export interface SaveEvidenceOutcome {
  status: "saved" | "error";
  result: SotyEvidenceSaveResult | null;
  error: string | null;
}

/**
 * Persist a SOTY evidence snapshot to the local evidence directory.
 *
 * Calls `save_soty_evidence` (Tauri command) with pre-rendered, pre-redacted
 * JSON and Markdown strings. The backend generates the run directory name from
 * the current timestamp — no user-controlled path components are accepted.
 *
 * Safety: no external API calls, no system mutations beyond writing two files
 * under ~/.sotyroute/runs/<timestamp>_soty/.
 */
export async function saveEvidenceSnapshot(
  snapshot: SotyEvidenceSnapshot
): Promise<SaveEvidenceOutcome> {
  const jsonContent = renderEvidenceJson(snapshot);
  const mdContent = renderEvidenceMarkdown(snapshot);
  try {
    const result = await invoke<SotyEvidenceSaveResult>("save_soty_evidence", {
      jsonContent,
      mdContent,
    });
    return { status: "saved", result, error: null };
  } catch (e) {
    return { status: "error", result: null, error: String(e) };
  }
}
