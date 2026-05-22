import { invoke } from "@tauri-apps/api/tauri";
import type {
  AppSettings,
  DoctorReport,
  Mode,
  Profile,
  SessionDetail,
  SessionSummary,
  ValidationResult,
} from "./types";

// All calls are thin wrappers over Tauri commands. Failures bubble up as JS errors.

export const api = {
  // System / doctor
  runDoctor: () => invoke<DoctorReport>("run_doctor"),

  // Profiles
  loadProfile: (path: string) => invoke<Profile>("load_profile", { path }),
  validateProfile: (profile: Profile) =>
    invoke<ValidationResult>("validate_profile", { profile }),
  listExampleProfiles: () =>
    invoke<{ name: string; path: string }[]>("list_example_profiles"),

  // Sessions / runs
  startObserve: (profile: Profile) =>
    invoke<SessionSummary>("start_observe", { profile }),
  dryRun: (mode: Mode, profile: Profile) =>
    invoke<SessionSummary>("dry_run", { mode, profile }),
  listSessions: () => invoke<SessionSummary[]>("list_sessions"),
  readSession: (sessionId: string) =>
    invoke<SessionDetail>("read_session", { sessionId }),
  openEvidenceDir: (sessionId?: string) =>
    invoke<void>("open_evidence_dir", { sessionId: sessionId ?? null }),
  exportBofa: (sessionId: string) =>
    invoke<string>("export_bofa", { sessionId }),
  exportSotyhub: (sessionId: string) =>
    invoke<string>("export_sotyhub", { sessionId }),

  // Settings
  getSettings: () => invoke<AppSettings>("get_settings"),
  setSettings: (settings: AppSettings) =>
    invoke<AppSettings>("set_settings", { settings }),
};
