use crate::evidence::{
    self, AppSettings, SessionDetail, SessionSummary,
};
use crate::planner::{self, Plan};
use crate::profiles::{self, Mode, Profile, ValidationResult};
use crate::system::{self, DoctorReport};
use serde::Serialize;
use std::path::{Path, PathBuf};

type CmdResult<T> = Result<T, String>;

fn err<E: ToString>(e: E) -> String {
    e.to_string()
}

#[tauri::command]
pub fn run_doctor() -> CmdResult<DoctorReport> {
    let settings = evidence::load_settings();
    Ok(system::collect_doctor(settings.public_ip_check_enabled))
}

#[tauri::command]
pub fn load_profile(path: String) -> CmdResult<Profile> {
    validate_profile_path(Path::new(&path))?;
    profiles::load_from_path(Path::new(&path)).map_err(err)
}

fn validate_profile_path(p: &Path) -> CmdResult<()> {
    for component in p.components() {
        if component == std::path::Component::ParentDir {
            return Err("profile path must not contain parent directory (..) components".into());
        }
    }
    let ext = p
        .extension()
        .and_then(|s| s.to_str())
        .unwrap_or("")
        .to_lowercase();
    if !matches!(ext.as_str(), "yaml" | "yml" | "json") {
        return Err(format!(
            "profile path must have .yaml, .yml, or .json extension (got .{})",
            ext
        ));
    }
    if p.exists() && !p.is_file() {
        return Err("profile path must be a regular file, not a directory".into());
    }
    Ok(())
}

#[tauri::command]
pub fn validate_profile(profile: Profile) -> CmdResult<ValidationResult> {
    Ok(profiles::validate(&profile))
}

#[derive(Serialize)]
pub struct ExampleProfileEntry {
    pub name: String,
    pub path: String,
}

#[tauri::command]
pub fn list_example_profiles() -> CmdResult<Vec<ExampleProfileEntry>> {
    let dir = locate_examples_dir().ok_or_else(|| "examples/profiles directory not found".to_string())?;
    let read = std::fs::read_dir(&dir).map_err(err)?;
    let mut out = Vec::new();
    for entry in read.flatten() {
        let p = entry.path();
        let ext = p.extension().and_then(|s| s.to_str()).unwrap_or("").to_lowercase();
        if !matches!(ext.as_str(), "yaml" | "yml" | "json") {
            continue;
        }
        let name = p
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("")
            .to_string();
        out.push(ExampleProfileEntry {
            name,
            path: p.to_string_lossy().into_owned(),
        });
    }
    out.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(out)
}

fn locate_examples_dir() -> Option<PathBuf> {
    // 1. explicit env override
    if let Ok(p) = std::env::var("SOTYROUTE_EXAMPLES_DIR") {
        let pb = PathBuf::from(p);
        if pb.is_dir() {
            return Some(pb);
        }
    }
    // 2. workspace-relative (works during `tauri dev` from source checkout)
    let manifest = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let candidate = manifest
        .join("..")
        .join("..")
        .join("..")
        .join("examples")
        .join("profiles");
    if candidate.is_dir() {
        return Some(candidate);
    }
    // 3. next to the executable (release bundle convention)
    if let Ok(exe) = std::env::current_exe() {
        if let Some(parent) = exe.parent() {
            let c = parent.join("examples").join("profiles");
            if c.is_dir() {
                return Some(c);
            }
        }
    }
    None
}

#[tauri::command]
pub fn start_observe(profile: Profile) -> CmdResult<SessionSummary> {
    let mode = Mode::Observe;
    let settings = evidence::load_settings();
    let checks = system::collect_doctor(settings.public_ip_check_enabled);
    let plan: Plan = planner::plan(&mode, &profile);
    let res = evidence::write_session(&mode, &profile, &checks, &plan, false).map_err(err)?;
    Ok(res.summary)
}

#[tauri::command]
pub fn dry_run(mode: Mode, profile: Profile) -> CmdResult<SessionSummary> {
    let settings = evidence::load_settings();
    let checks = system::collect_doctor(settings.public_ip_check_enabled);
    let plan: Plan = planner::plan(&mode, &profile);
    // Lab mode in v0.1.0 is non-destructive (evidence only); we keep dry_run=true
    // for tor/wireguard/socks5 to make intent explicit.
    let dry_run_flag = !matches!(mode, Mode::Lab);
    let res = evidence::write_session(&mode, &profile, &checks, &plan, dry_run_flag).map_err(err)?;
    Ok(res.summary)
}

#[tauri::command]
pub fn list_sessions() -> CmdResult<Vec<SessionSummary>> {
    Ok(evidence::list_sessions())
}

#[tauri::command]
pub fn read_session(session_id: String) -> CmdResult<SessionDetail> {
    evidence::read_session(&session_id).map_err(err)
}

#[tauri::command]
pub fn open_evidence_dir(session_id: Option<String>) -> CmdResult<()> {
    let path = match session_id {
        Some(id) => evidence::find_session_dir(&id)
            .ok_or_else(|| format!("session not found: {}", id))?,
        None => evidence::evidence_root(),
    };
    std::fs::create_dir_all(&path).map_err(err)?;
    open_in_explorer(&path).map_err(err)
}

#[cfg(windows)]
fn open_in_explorer(path: &Path) -> std::io::Result<()> {
    std::process::Command::new("explorer.exe")
        .arg(path)
        .spawn()
        .map(|_| ())
}

#[cfg(not(windows))]
fn open_in_explorer(path: &Path) -> std::io::Result<()> {
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open").arg(path).spawn()?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open").arg(path).spawn()?;
    }
    Ok(())
}

#[tauri::command]
pub fn export_bofa(session_id: String) -> CmdResult<String> {
    let detail = evidence::read_session(&session_id).map_err(err)?;
    let dir = PathBuf::from(&detail.summary.evidence_dir);
    let p = evidence::write_bofa(&dir, &detail.summary, &detail.warnings).map_err(err)?;
    Ok(p.to_string_lossy().into_owned())
}

#[tauri::command]
pub fn export_sotyhub(session_id: String) -> CmdResult<String> {
    let detail = evidence::read_session(&session_id).map_err(err)?;
    let dir = PathBuf::from(&detail.summary.evidence_dir);
    // Reload the profile that was captured at session-write time.
    let profile_path = dir.join("profile.json");
    let profile: Profile = std::fs::read_to_string(&profile_path)
        .ok()
        .and_then(|text| serde_json::from_str(&text).ok())
        .unwrap_or_else(|| Profile {
            name: detail.summary.profile_name.clone(),
            mode: Mode::Observe,
            owner: None,
            purpose: None,
            transport: Mode::Observe,
            allowed_targets: vec![],
            blocked_targets: vec![],
            kill_switch: None,
            dns_check: None,
            evidence: None,
            notes: None,
            tags: vec![],
            socks5: None,
            wireguard: None,
        });
    let p = evidence::write_sotyhub(&dir, &detail.summary, &profile).map_err(err)?;
    Ok(p.to_string_lossy().into_owned())
}

#[tauri::command]
pub fn get_settings() -> CmdResult<AppSettings> {
    Ok(evidence::load_settings())
}

/// Result of a TCP reachability probe (issue #19).
/// Used to verify that a SOCKS5 proxy host:port is accepting connections
/// before the operator starts a session.
#[derive(Serialize)]
pub struct TcpProbeResult {
    pub host: String,
    pub port: u16,
    pub reachable: bool,
    pub latency_ms: Option<u64>,
    pub error: Option<String>,
}

/// Attempt a TCP connection to `host:port` with a 5-second timeout.
/// Resolves DNS so the host can be a hostname or an IP address.
/// Safe to call at any time; it never transmits application data,
/// only opens and immediately closes the transport connection.
#[tauri::command]
pub fn probe_tcp(host: String, port: u16) -> CmdResult<TcpProbeResult> {
    use std::net::{TcpStream, ToSocketAddrs};
    use std::time::{Duration, Instant};

    // Validate host — reject obviously dangerous values before DNS lookup.
    if host.trim().is_empty() {
        return Err("host must not be empty".into());
    }
    if port == 0 {
        return Err("port must be > 0".into());
    }

    let addr_str = format!("{}:{}", host.trim(), port);
    let timeout = Duration::from_secs(5);

    // Resolve to a socket address (handles both IP literals and hostnames).
    let addr = match addr_str.to_socket_addrs() {
        Ok(mut iter) => match iter.next() {
            Some(a) => a,
            None => {
                return Ok(TcpProbeResult {
                    host,
                    port,
                    reachable: false,
                    latency_ms: None,
                    error: Some("DNS resolution returned no addresses".into()),
                });
            }
        },
        Err(e) => {
            return Ok(TcpProbeResult {
                host,
                port,
                reachable: false,
                latency_ms: None,
                error: Some(format!("DNS resolution failed: {}", e)),
            });
        }
    };

    let start = Instant::now();
    match TcpStream::connect_timeout(&addr, timeout) {
        Ok(_) => Ok(TcpProbeResult {
            host,
            port,
            reachable: true,
            latency_ms: Some(start.elapsed().as_millis() as u64),
            error: None,
        }),
        Err(e) => Ok(TcpProbeResult {
            host,
            port,
            reachable: false,
            latency_ms: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub fn set_settings(settings: AppSettings) -> CmdResult<AppSettings> {
    evidence::save_settings(&settings).map_err(err)?;
    Ok(settings)
}
