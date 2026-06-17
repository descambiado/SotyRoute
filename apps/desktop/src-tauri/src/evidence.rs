use crate::planner::{Plan, PlanStep, Warning};
use crate::profiles::{Mode, Profile};
use crate::system::DoctorReport;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub evidence_dir: String,
    pub default_mode: String,
    pub telemetry_enabled: bool,
    pub public_ip_check_enabled: bool,
    pub theme: String,
    pub export_bofa_default: bool,
    pub export_sotyhub_default: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            evidence_dir: default_evidence_root().to_string_lossy().into_owned(),
            default_mode: "observe".into(),
            telemetry_enabled: false,
            public_ip_check_enabled: false,
            theme: "dark".into(),
            export_bofa_default: true,
            export_sotyhub_default: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionSummary {
    pub session_id: String,
    pub mode: String,
    pub profile_name: String,
    pub started_at: String,
    pub ended_at: String,
    pub dry_run: bool,
    pub admin: bool,
    pub status: String,
    pub warnings_count: usize,
    pub evidence_dir: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionDetail {
    #[serde(flatten)]
    pub summary: SessionSummary,
    pub warnings: Vec<Warning>,
    pub checks: DoctorReport,
    pub plan: Vec<PlanStep>,
    pub evidence_md: String,
    pub bofa_export_path: Option<String>,
    pub sotyhub_export_path: Option<String>,
}

#[derive(Serialize)]
struct SessionFile<'a> {
    tool: &'static str,
    version: &'static str,
    session_id: &'a str,
    mode: &'a str,
    started_at: &'a str,
    ended_at: &'a str,
    dry_run: bool,
    admin: bool,
    profile: &'a str,
    status: &'a str,
    warnings_count: usize,
}

pub fn evidence_root() -> PathBuf {
    let settings = load_settings();
    PathBuf::from(settings.evidence_dir).join("runs")
}

pub fn settings_path() -> PathBuf {
    default_evidence_root().join("settings.json")
}

fn default_evidence_root() -> PathBuf {
    let home = dirs::home_dir().unwrap_or_else(|| PathBuf::from("."));
    home.join(".sotyroute")
}

pub fn load_settings() -> AppSettings {
    let p = settings_path();
    if let Ok(text) = std::fs::read_to_string(&p) {
        if let Ok(s) = serde_json::from_str::<AppSettings>(&text) {
            return s;
        }
    }
    AppSettings::default()
}

pub fn save_settings(s: &AppSettings) -> anyhow::Result<()> {
    validate_evidence_dir(&s.evidence_dir)?;
    let p = settings_path();
    if let Some(parent) = p.parent() {
        std::fs::create_dir_all(parent)?;
    }
    std::fs::write(&p, serde_json::to_string_pretty(s)?)?;
    Ok(())
}

fn validate_evidence_dir(dir: &str) -> anyhow::Result<()> {
    let p = PathBuf::from(dir);
    for component in p.components() {
        if component == std::path::Component::ParentDir {
            anyhow::bail!("evidence_dir must not contain parent directory (..) components");
        }
    }
    let lower = dir.to_lowercase().replace('\\', "/");
    // Reject well-known system roots that should never receive evidence writes.
    let blocked = [
        "c:/windows",
        "c:/program files",
        "c:/program files (x86)",
        "c:/programdata",
        "/etc",
        "/sys",
        "/proc",
        "/dev",
        "/boot",
    ];
    for prefix in &blocked {
        if lower.starts_with(prefix) {
            anyhow::bail!(
                "evidence_dir '{}' points to a restricted system directory",
                dir
            );
        }
    }
    Ok(())
}

fn assert_within_evidence_root(path: &Path) -> anyhow::Result<()> {
    // Defense-in-depth: confirm the resolved write target stays inside the evidence root.
    // We cannot canonicalize non-existent paths, so we normalize separators and check
    // for parent-dir components + prefix match.
    for component in path.components() {
        if component == std::path::Component::ParentDir {
            anyhow::bail!(
                "path traversal rejected: parent directory component in {}",
                path.display()
            );
        }
    }
    let root = evidence_root();
    let root_norm = root
        .to_string_lossy()
        .to_lowercase()
        .replace('\\', "/")
        .trim_end_matches('/')
        .to_string();
    let path_norm = path.to_string_lossy().to_lowercase().replace('\\', "/");
    if !path_norm.starts_with(&root_norm) {
        anyhow::bail!(
            "path escape rejected: {} is outside evidence root {}",
            path.display(),
            root.display()
        );
    }
    Ok(())
}

pub fn new_session_id(mode: &Mode) -> String {
    let now = Utc::now();
    format!(
        "sotyroute-{}-{}",
        now.format("%Y%m%d-%H%M%S"),
        mode.as_str()
    )
}

pub struct WriteResult {
    pub summary: SessionSummary,
}

pub fn write_session(
    mode: &Mode,
    profile: &Profile,
    checks: &DoctorReport,
    plan: &Plan,
    dry_run: bool,
) -> anyhow::Result<WriteResult> {
    let session_id = new_session_id(mode);
    let dir = evidence_root().join(folder_name(&session_id, mode));
    assert_within_evidence_root(&dir)?;
    std::fs::create_dir_all(&dir)?;

    let started_at = checks.generated_at.clone();
    let ended_at = Utc::now().to_rfc3339();
    let status = if plan.warnings.iter().any(|w| w.severity == "error") {
        "partial"
    } else {
        "completed"
    };

    let summary = SessionSummary {
        session_id: session_id.clone(),
        mode: mode.as_str().into(),
        profile_name: profile.name.clone(),
        started_at: started_at.clone(),
        ended_at: ended_at.clone(),
        dry_run,
        admin: checks.admin,
        status: status.into(),
        warnings_count: plan.warnings.len(),
        evidence_dir: dir.to_string_lossy().into_owned(),
    };

    // profile.json — the exact profile in effect for this session
    write_json(&dir.join("profile.json"), profile)?;

    // session.json
    let session_file = SessionFile {
        tool: "sotyroute",
        version: env!("CARGO_PKG_VERSION"),
        session_id: &session_id,
        mode: mode.as_str(),
        started_at: &started_at,
        ended_at: &ended_at,
        dry_run,
        admin: checks.admin,
        profile: &profile.name,
        status,
        warnings_count: plan.warnings.len(),
    };
    write_json(&dir.join("session.json"), &session_file)?;

    // checks.json / plan.json / warnings.json
    write_json(&dir.join("checks.json"), &checks)?;
    write_json(&dir.join("plan.json"), &plan.steps)?;
    write_json(&dir.join("warnings.json"), &plan.warnings)?;

    // evidence.md
    let md = render_markdown(&summary, profile, checks, plan);
    std::fs::write(dir.join("evidence.md"), md)?;

    // optional auto-exports
    let s = load_settings();
    if s.export_bofa_default {
        write_bofa(&dir, &summary, &plan.warnings)?;
    }
    if s.export_sotyhub_default {
        write_sotyhub(&dir, &summary, profile)?;
    }

    Ok(WriteResult { summary })
}

fn folder_name(session_id: &str, mode: &Mode) -> String {
    // session_id already contains the mode, but we keep the format
    // <timestamp>_<mode> for human readability inside the runs directory.
    let ts = session_id
        .trim_start_matches("sotyroute-")
        .trim_end_matches(&format!("-{}", mode.as_str()))
        .to_string();
    format!("{}_{}", ts, mode.as_str())
}

fn write_json<T: Serialize>(path: &Path, value: &T) -> anyhow::Result<()> {
    let text = serde_json::to_string_pretty(value)?;
    std::fs::write(path, text)?;
    Ok(())
}

fn render_markdown(
    summary: &SessionSummary,
    profile: &Profile,
    checks: &DoctorReport,
    plan: &Plan,
) -> String {
    let mut s = String::new();
    s.push_str(&format!("# SotyRoute session {}\n\n", summary.session_id));
    s.push_str("> Before running tools, know where your traffic goes.\n\n");
    s.push_str("## Summary\n\n");
    s.push_str(&format!("- mode: `{}`\n", summary.mode));
    s.push_str(&format!("- profile: `{}`\n", summary.profile_name));
    s.push_str(&format!("- status: `{}`\n", summary.status));
    s.push_str(&format!("- dry_run: `{}`\n", summary.dry_run));
    s.push_str(&format!("- admin: `{}`\n", summary.admin));
    s.push_str(&format!("- started_at: `{}`\n", summary.started_at));
    s.push_str(&format!("- ended_at: `{}`\n", summary.ended_at));
    s.push_str(&format!("- evidence_dir: `{}`\n\n", summary.evidence_dir));

    s.push_str("## Profile\n\n");
    if let Some(o) = &profile.owner {
        s.push_str(&format!("- owner: `{}`\n", o));
    }
    if let Some(p) = &profile.purpose {
        s.push_str(&format!("- purpose: {}\n", p));
    }
    s.push_str(&format!("- transport: `{}`\n", profile.transport.as_str()));
    s.push_str(&format!(
        "- allowed_targets: {}\n",
        if profile.allowed_targets.is_empty() {
            "—".into()
        } else {
            profile.allowed_targets.join(", ")
        }
    ));
    s.push_str(&format!(
        "- blocked_targets: {}\n",
        if profile.blocked_targets.is_empty() {
            "—".into()
        } else {
            profile.blocked_targets.join(", ")
        }
    ));
    s.push('\n');

    s.push_str("## Host\n\n");
    s.push_str(&format!(
        "- os: `{}` ({})\n",
        checks.os_name, checks.os_version
    ));
    s.push_str(&format!("- hostname: `{}`\n", checks.hostname));
    s.push_str(&format!("- user: `{}`\n", checks.user));
    s.push_str(&format!("- admin: `{}`\n", checks.admin));
    s.push_str(&format!("- interfaces: {}\n", checks.interfaces.len()));
    s.push_str(&format!(
        "- dns_servers: {}\n\n",
        if checks.dns_servers.is_empty() {
            "—".into()
        } else {
            checks.dns_servers.join(", ")
        }
    ));

    s.push_str("## Plan (dry-run; v0.1.0 does not execute network mutations)\n\n");
    for (i, step) in plan.steps.iter().enumerate() {
        s.push_str(&format!(
            "{}. **{}** — {} _(reversible: {}, executes in v0.1.0: {})_\n",
            i + 1,
            step.step,
            step.detail,
            step.reversible,
            step.executes_in_v0_1_0
        ));
    }
    s.push('\n');

    if !plan.warnings.is_empty() {
        s.push_str("## Warnings\n\n");
        for w in &plan.warnings {
            s.push_str(&format!("- `{}` ({}): {}\n", w.code, w.severity, w.message));
        }
        s.push('\n');
    }

    s.push_str("## Notes\n\nThis report is part of the SotyRoute evidence bundle for the authorized lab the operator declared in the profile. SotyRoute does not validate that authorization; the operator carries that responsibility.\n");
    s
}

pub fn list_sessions() -> Vec<SessionSummary> {
    let root = evidence_root();
    let mut out: Vec<SessionSummary> = Vec::new();
    let read = match std::fs::read_dir(&root) {
        Ok(r) => r,
        Err(_) => return out,
    };
    for entry in read.flatten() {
        let p = entry.path();
        let f = p.join("session.json");
        if let Ok(text) = std::fs::read_to_string(&f) {
            if let Ok(v) = serde_json::from_str::<serde_json::Value>(&text) {
                let summary = SessionSummary {
                    session_id: v
                        .get("session_id")
                        .and_then(|x| x.as_str())
                        .unwrap_or("")
                        .to_string(),
                    mode: v
                        .get("mode")
                        .and_then(|x| x.as_str())
                        .unwrap_or("")
                        .to_string(),
                    profile_name: v
                        .get("profile")
                        .and_then(|x| x.as_str())
                        .unwrap_or("")
                        .to_string(),
                    started_at: v
                        .get("started_at")
                        .and_then(|x| x.as_str())
                        .unwrap_or("")
                        .to_string(),
                    ended_at: v
                        .get("ended_at")
                        .and_then(|x| x.as_str())
                        .unwrap_or("")
                        .to_string(),
                    dry_run: v.get("dry_run").and_then(|x| x.as_bool()).unwrap_or(false),
                    admin: v.get("admin").and_then(|x| x.as_bool()).unwrap_or(false),
                    status: v
                        .get("status")
                        .and_then(|x| x.as_str())
                        .unwrap_or("")
                        .to_string(),
                    warnings_count: v
                        .get("warnings_count")
                        .and_then(|x| x.as_u64())
                        .unwrap_or(0) as usize,
                    evidence_dir: p.to_string_lossy().into_owned(),
                };
                out.push(summary);
            }
        }
    }
    out.sort_by(|a, b| b.started_at.cmp(&a.started_at));
    out
}

pub fn read_session(session_id: &str) -> anyhow::Result<SessionDetail> {
    let dir = find_session_dir(session_id)
        .ok_or_else(|| anyhow::anyhow!("session not found: {}", session_id))?;
    let summary_v: serde_json::Value =
        serde_json::from_str(&std::fs::read_to_string(dir.join("session.json"))?)?;
    let checks: DoctorReport =
        serde_json::from_str(&std::fs::read_to_string(dir.join("checks.json"))?)?;
    let plan: Vec<PlanStep> =
        serde_json::from_str(&std::fs::read_to_string(dir.join("plan.json"))?)?;
    let warnings: Vec<Warning> =
        serde_json::from_str(&std::fs::read_to_string(dir.join("warnings.json"))?)?;
    let evidence_md = std::fs::read_to_string(dir.join("evidence.md")).unwrap_or_default();
    let bofa = dir.join("bofa_export.json");
    let sotyhub = dir.join("sotyhub_export.json");

    let summary = SessionSummary {
        session_id: summary_v
            .get("session_id")
            .and_then(|x| x.as_str())
            .unwrap_or("")
            .to_string(),
        mode: summary_v
            .get("mode")
            .and_then(|x| x.as_str())
            .unwrap_or("")
            .to_string(),
        profile_name: summary_v
            .get("profile")
            .and_then(|x| x.as_str())
            .unwrap_or("")
            .to_string(),
        started_at: summary_v
            .get("started_at")
            .and_then(|x| x.as_str())
            .unwrap_or("")
            .to_string(),
        ended_at: summary_v
            .get("ended_at")
            .and_then(|x| x.as_str())
            .unwrap_or("")
            .to_string(),
        dry_run: summary_v
            .get("dry_run")
            .and_then(|x| x.as_bool())
            .unwrap_or(false),
        admin: summary_v
            .get("admin")
            .and_then(|x| x.as_bool())
            .unwrap_or(false),
        status: summary_v
            .get("status")
            .and_then(|x| x.as_str())
            .unwrap_or("")
            .to_string(),
        warnings_count: warnings.len(),
        evidence_dir: dir.to_string_lossy().into_owned(),
    };

    Ok(SessionDetail {
        summary,
        warnings,
        checks,
        plan,
        evidence_md,
        bofa_export_path: bofa.exists().then(|| bofa.to_string_lossy().into_owned()),
        sotyhub_export_path: sotyhub
            .exists()
            .then(|| sotyhub.to_string_lossy().into_owned()),
    })
}

pub fn find_session_dir(session_id: &str) -> Option<PathBuf> {
    let root = evidence_root();
    let read = std::fs::read_dir(&root).ok()?;
    for entry in read.flatten() {
        let p = entry.path();
        let f = p.join("session.json");
        if let Ok(text) = std::fs::read_to_string(&f) {
            if let Ok(v) = serde_json::from_str::<serde_json::Value>(&text) {
                if v.get("session_id").and_then(|x| x.as_str()) == Some(session_id) {
                    return Some(p);
                }
            }
        }
    }
    None
}

#[derive(Serialize)]
struct BofaExport<'a> {
    schema: u32,
    producer: &'static str,
    producer_version: &'static str,
    session_id: &'a str,
    mode: &'a str,
    profile_name: &'a str,
    status: &'a str,
    warnings: &'a [Warning],
    evidence_path: &'a str,
    preflight_passed: bool,
    produced_at: String,
}

/// Result returned to the frontend after a SOTY evidence snapshot is persisted.
#[derive(Debug, Clone, Serialize)]
pub struct SotyEvidenceSaveResult {
    pub directory: String,
    pub json_filename: String,
    pub md_filename: String,
    pub generated_at: String,
}

/// Validate that an internally-generated run directory name contains no path
/// separators, parent-dir components, or characters outside [A-Za-z0-9\-_].
fn validate_soty_dir_name(name: &str) -> anyhow::Result<()> {
    if name.is_empty() {
        anyhow::bail!("soty run dir name must not be empty");
    }
    if name.contains('/') || name.contains('\\') {
        anyhow::bail!("soty run dir name must not contain path separators");
    }
    if name.contains("..") {
        anyhow::bail!("soty run dir name must not contain parent-dir components");
    }
    if !name
        .chars()
        .all(|c| c.is_alphanumeric() || c == '-' || c == '_')
    {
        anyhow::bail!(
            "soty run dir name must contain only alphanumeric characters, hyphens, and underscores"
        );
    }
    Ok(())
}

/// Write `soty_evidence.json` and `soty_evidence.md` into a new run directory
/// under the evidence root.  The directory name is generated internally from
/// the current UTC timestamp (`YYYYMMDD-HHMMSS_soty`); no user-controlled
/// path components are accepted.
///
/// The caller is responsible for pre-rendering and pre-redacting both strings.
pub fn write_soty_evidence(
    json_content: &str,
    md_content: &str,
) -> anyhow::Result<SotyEvidenceSaveResult> {
    let now = Utc::now();
    let dir_name = format!("{}_soty", now.format("%Y%m%d-%H%M%S"));

    validate_soty_dir_name(&dir_name)?;

    let dir = evidence_root().join(&dir_name);
    assert_within_evidence_root(&dir)?;
    std::fs::create_dir_all(&dir)?;

    std::fs::write(dir.join("soty_evidence.json"), json_content)?;
    std::fs::write(dir.join("soty_evidence.md"), md_content)?;

    Ok(SotyEvidenceSaveResult {
        directory: dir.to_string_lossy().into_owned(),
        json_filename: "soty_evidence.json".into(),
        md_filename: "soty_evidence.md".into(),
        generated_at: now.to_rfc3339(),
    })
}

pub fn write_bofa(
    dir: &Path,
    summary: &SessionSummary,
    warnings: &[Warning],
) -> anyhow::Result<PathBuf> {
    assert_within_evidence_root(dir)?;
    let path = dir.join("bofa_export.json");
    let preflight_passed =
        summary.status == "completed" && !warnings.iter().any(|w| w.severity == "error");
    let payload = BofaExport {
        schema: 1,
        producer: "sotyroute-desktop",
        producer_version: env!("CARGO_PKG_VERSION"),
        session_id: &summary.session_id,
        mode: &summary.mode,
        profile_name: &summary.profile_name,
        status: &summary.status,
        warnings,
        evidence_path: &summary.evidence_dir,
        preflight_passed,
        produced_at: Utc::now().to_rfc3339(),
    };
    std::fs::write(&path, serde_json::to_string_pretty(&payload)?)?;
    Ok(path)
}

#[derive(Serialize)]
struct SotyhubExport<'a> {
    schema: u32,
    producer: &'static str,
    producer_version: &'static str,
    lab_id: Option<&'a str>,
    execution_id: &'a str,
    operator: &'a str,
    profile_name: &'a str,
    mode: &'a str,
    evidence_bundle: &'a str,
    report: &'static str,
    status: &'a str,
    warnings_count: usize,
    produced_at: String,
}

pub fn write_sotyhub(
    dir: &Path,
    summary: &SessionSummary,
    profile: &Profile,
) -> anyhow::Result<PathBuf> {
    assert_within_evidence_root(dir)?;
    let path = dir.join("sotyhub_export.json");
    let operator = profile.owner.as_deref().unwrap_or("unknown");
    let payload = SotyhubExport {
        schema: 1,
        producer: "sotyroute-desktop",
        producer_version: env!("CARGO_PKG_VERSION"),
        lab_id: None,
        execution_id: &summary.session_id,
        operator,
        profile_name: &summary.profile_name,
        mode: &summary.mode,
        evidence_bundle: &summary.evidence_dir,
        report: "evidence.md",
        status: &summary.status,
        warnings_count: summary.warnings_count,
        produced_at: Utc::now().to_rfc3339(),
    };
    std::fs::write(&path, serde_json::to_string_pretty(&payload)?)?;
    Ok(path)
}

#[cfg(test)]
mod tests {
    use super::*;

    // ── validate_soty_dir_name ─────────────────────────────────────────────────

    #[test]
    fn rejects_empty_name() {
        assert!(validate_soty_dir_name("").is_err());
    }

    #[test]
    fn rejects_forward_slash() {
        assert!(validate_soty_dir_name("foo/bar").is_err());
    }

    #[test]
    fn rejects_backslash() {
        assert!(validate_soty_dir_name("foo\\bar").is_err());
    }

    #[test]
    fn rejects_parent_dir_dotdot() {
        assert!(validate_soty_dir_name("..").is_err());
        assert!(validate_soty_dir_name("foo..bar").is_err());
    }

    #[test]
    fn rejects_space() {
        assert!(validate_soty_dir_name("foo bar").is_err());
    }

    #[test]
    fn rejects_special_chars() {
        assert!(validate_soty_dir_name("foo!bar").is_err());
        assert!(validate_soty_dir_name("foo@bar").is_err());
        assert!(validate_soty_dir_name("foo:bar").is_err());
        assert!(validate_soty_dir_name("foo*bar").is_err());
        assert!(validate_soty_dir_name("foo?bar").is_err());
    }

    #[test]
    fn accepts_valid_soty_dir_name() {
        assert!(validate_soty_dir_name("20260617-120000_soty").is_ok());
        assert!(validate_soty_dir_name("20241215-143021_soty").is_ok());
        assert!(validate_soty_dir_name("19991231-235959_soty").is_ok());
    }
}
