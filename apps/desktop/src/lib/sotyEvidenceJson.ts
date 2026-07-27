/**
 * Evidence JSON renderer for SOTY snapshots — PR 9.
 *
 * Returns a stable, deterministic JSON string from a SotyEvidenceSnapshot.
 * Keys are sorted alphabetically so output is consistent across runs
 * regardless of object construction order.
 *
 * Unsafe fields are stripped as a defence-in-depth measure before serialization.
 * Pure function — no I/O, no external calls.
 */
import type { SotyEvidenceSnapshot } from "../types/sotyEvidence";
import { deepStripUnsafeFields } from "./sotyEvidenceRedaction";

function sortedReplacer(_key: string, value: unknown): unknown {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
        a.localeCompare(b)
      )
    );
  }
  return value;
}

/**
 * Serialize a SotyEvidenceSnapshot to a stable, sorted JSON string.
 *
 * Unsafe fields are stripped before serialization.
 * Providing a snapshot built with a fixed timestamp yields fully deterministic output.
 */
export function renderEvidenceJson(snapshot: SotyEvidenceSnapshot): string {
  const safe = deepStripUnsafeFields(snapshot);
  return JSON.stringify(safe, sortedReplacer, 2);
}
