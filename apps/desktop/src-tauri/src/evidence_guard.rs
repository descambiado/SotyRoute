use crate::evidence;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::path::Path;

/// Real, read-only evidence-readiness signals. Reuses `evidence::load_settings()`
/// and `evidence::list_sessions()` — the same state already powering the
/// Settings and Evidence pages — rather than duplicating that logic.
///
/// No signal here mutates system state: the directory-readiness check never
/// creates the directory or writes a probe file, it only inspects what is
/// already there, so a fresh install with no evidence directory yet is
/// reported honestly as "not ready" rather than silently created.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvidenceGuardSignals {
    pub evidence_dir: String,
    pub evidence_dir_ready: bool,
    pub session_count: usize,
    pub bofa_export_enabled: bool,
    pub sotyhub_export_enabled: bool,
    pub generated_at: String,
}

pub fn collect_evidence_guard_signals() -> EvidenceGuardSignals {
    let settings = evidence::load_settings();
    let sessions = evidence::list_sessions();
    let evidence_dir_ready = check_dir_ready(&settings.evidence_dir);
    EvidenceGuardSignals {
        evidence_dir_ready,
        evidence_dir: settings.evidence_dir,
        session_count: sessions.len(),
        bofa_export_enabled: settings.export_bofa_default,
        sotyhub_export_enabled: settings.export_sotyhub_default,
        generated_at: Utc::now().to_rfc3339(),
    }
}

/// `true` only if the configured evidence directory already exists, is a
/// directory, and is not marked read-only. Does not create the directory or
/// write anything — a best-effort, read-only proxy for "writable" (it does
/// not account for ACL-level permission denials, only the Windows read-only
/// attribute), consistent with never fabricating a check we cannot actually
/// perform without a mutation.
fn check_dir_ready(dir: &str) -> bool {
    let path = Path::new(dir);
    if !path.is_dir() {
        return false;
    }
    match std::fs::metadata(path) {
        Ok(meta) => !meta.permissions().readonly(),
        Err(_) => false,
    }
}
