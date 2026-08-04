import { describe, it, expect } from "vitest";
import {
  mapEvidenceSignalsToScoreInput,
  type EvidenceGuardSignals,
} from "../lib/sotyEvidenceGuardReal";
import type { SotyScoreInput } from "../lib/sotyScoreRules";

const DEMO_EVIDENCE: SotyScoreInput["evidence"] = {
  evidence_enabled: true,
  evidence_directory_ready: true,
  session_id_available: true,
  evidence_level: "full",
  bofa_export_enabled: true,
  sotyhub_export_enabled: true,
};

const SIGNALS: EvidenceGuardSignals = {
  evidence_dir: "C:\\Users\\test\\.sotyroute",
  evidence_dir_ready: true,
  session_count: 3,
  bofa_export_enabled: true,
  sotyhub_export_enabled: true,
  generated_at: "2026-01-01T00:00:00.000Z",
};

describe("mapEvidenceSignalsToScoreInput", () => {
  it("evidence_directory_ready reflects the real directory check directly", () => {
    expect(mapEvidenceSignalsToScoreInput(SIGNALS, DEMO_EVIDENCE).evidence_directory_ready).toBe(
      true
    );
    expect(
      mapEvidenceSignalsToScoreInput(
        { ...SIGNALS, evidence_dir_ready: false },
        DEMO_EVIDENCE
      ).evidence_directory_ready
    ).toBe(false);
  });

  it("evidence_directory_ready is real false even when the demo default is true", () => {
    expect(
      mapEvidenceSignalsToScoreInput(
        { ...SIGNALS, evidence_dir_ready: false },
        { ...DEMO_EVIDENCE, evidence_directory_ready: true }
      ).evidence_directory_ready
    ).toBe(false);
  });

  it("session_id_available is true only when at least one session has been recorded", () => {
    expect(mapEvidenceSignalsToScoreInput(SIGNALS, DEMO_EVIDENCE).session_id_available).toBe(true);
    expect(
      mapEvidenceSignalsToScoreInput(
        { ...SIGNALS, session_count: 0 },
        DEMO_EVIDENCE
      ).session_id_available
    ).toBe(false);
  });

  it("bofa_export_enabled and sotyhub_export_enabled reflect the real Settings values", () => {
    const result = mapEvidenceSignalsToScoreInput(SIGNALS, DEMO_EVIDENCE);
    expect(result.bofa_export_enabled).toBe(true);
    expect(result.sotyhub_export_enabled).toBe(true);

    const disabled = mapEvidenceSignalsToScoreInput(
      { ...SIGNALS, bofa_export_enabled: false, sotyhub_export_enabled: false },
      DEMO_EVIDENCE
    );
    expect(disabled.bofa_export_enabled).toBe(false);
    expect(disabled.sotyhub_export_enabled).toBe(false);
  });

  it("evidence_enabled always passes through the demo value — no real signal exists", () => {
    expect(mapEvidenceSignalsToScoreInput(SIGNALS, DEMO_EVIDENCE).evidence_enabled).toBe(true);
    expect(
      mapEvidenceSignalsToScoreInput(SIGNALS, { ...DEMO_EVIDENCE, evidence_enabled: false })
        .evidence_enabled
    ).toBe(false);
  });

  it("evidence_level always passes through the demo value — no real signal exists", () => {
    expect(mapEvidenceSignalsToScoreInput(SIGNALS, DEMO_EVIDENCE).evidence_level).toBe("full");
    expect(
      mapEvidenceSignalsToScoreInput(SIGNALS, { ...DEMO_EVIDENCE, evidence_level: "minimal" })
        .evidence_level
    ).toBe("minimal");
  });
});
