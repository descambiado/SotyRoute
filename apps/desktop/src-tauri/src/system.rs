use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkInterface {
    pub name: String,
    pub description: String,
    pub addresses: Vec<String>,
    pub is_up: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DoctorReport {
    pub os_name: String,
    pub os_version: String,
    pub hostname: String,
    pub user: String,
    pub admin: bool,
    pub interfaces: Vec<NetworkInterface>,
    pub dns_servers: Vec<String>,
    pub tor_installed: bool,
    pub tor_hint: String,
    pub wireguard_installed: bool,
    pub wireguard_hint: String,
    /// Present only when `public_ip_check_enabled` is true in settings.
    /// Contains the operator's public egress IP as seen by an external probe,
    /// or an error string prefixed with "error:" if the request failed.
    pub public_ip: Option<String>,
    pub generated_at: String,
}

/// Collect a full doctor report. Pass `enable_public_ip = true` (from
/// `AppSettings::public_ip_check_enabled`) to include the egress IP check.
/// The flag is threaded in from `commands.rs` to avoid a circular module
/// dependency between `system` and `evidence`.
pub fn collect_doctor(enable_public_ip: bool) -> DoctorReport {
    let (os_name, os_version) = os_info();
    let interfaces = list_interfaces();
    let dns_servers = list_dns_servers();
    let (tor_installed, tor_hint) = detect_tor();
    let (wireguard_installed, wireguard_hint) = detect_wireguard();
    let public_ip = if enable_public_ip {
        Some(fetch_public_ip())
    } else {
        None
    };

    DoctorReport {
        os_name,
        os_version,
        hostname: whoami::fallible::hostname().unwrap_or_else(|_| "unknown".into()),
        user: whoami::username(),
        admin: is_elevated::is_elevated(),
        interfaces,
        dns_servers,
        tor_installed,
        tor_hint,
        wireguard_installed,
        wireguard_hint,
        public_ip,
        generated_at: Utc::now().to_rfc3339(),
    }
}

/// Fetch the operator's public egress IP using a platform-native HTTP call.
/// Returns the IP string on success, or "error: <reason>" on failure.
/// Uses no extra crate dependencies — delegates to PowerShell on Windows,
/// curl on Linux/macOS.
fn fetch_public_ip() -> String {
    #[cfg(windows)]
    {
        let cmd = "(Invoke-WebRequest -Uri 'https://api.ipify.org' \
                   -UseBasicParsing -TimeoutSec 5).Content.Trim()";
        powershell(cmd)
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .unwrap_or_else(|| "error: PowerShell request failed".into())
    }
    #[cfg(not(windows))]
    {
        let out = Command::new("curl")
            .args(["-s", "--connect-timeout", "5", "https://api.ipify.org"])
            .output();
        match out {
            Ok(o) if o.status.success() => String::from_utf8_lossy(&o.stdout).trim().to_string(),
            Ok(_) => "error: curl returned non-zero exit".into(),
            Err(e) => format!("error: {}", e),
        }
    }
}

fn os_info() -> (String, String) {
    #[cfg(windows)]
    {
        let caption = powershell("(Get-CimInstance Win32_OperatingSystem).Caption")
            .unwrap_or_else(|| "Windows".into());
        let version = powershell("(Get-CimInstance Win32_OperatingSystem).Version")
            .unwrap_or_else(|| "unknown".into());
        (caption.trim().to_string(), version.trim().to_string())
    }
    #[cfg(not(windows))]
    {
        (format!("{:?}", whoami::platform()), whoami::distro())
    }
}

fn list_interfaces() -> Vec<NetworkInterface> {
    let mut out: Vec<NetworkInterface> = Vec::new();
    if let Ok(list) = if_addrs::get_if_addrs() {
        // Group by interface name; if_addrs returns one entry per address.
        use std::collections::BTreeMap;
        let mut by_name: BTreeMap<String, NetworkInterface> = BTreeMap::new();
        for entry in list {
            let name = entry.name.clone();
            let addr = entry.addr.ip().to_string();
            let is_loopback = entry.is_loopback();
            by_name
                .entry(name.clone())
                .and_modify(|nif| {
                    if !nif.addresses.contains(&addr) {
                        nif.addresses.push(addr.clone());
                    }
                })
                .or_insert_with(|| NetworkInterface {
                    name: name.clone(),
                    description: if is_loopback {
                        "Loopback".into()
                    } else {
                        String::new()
                    },
                    addresses: vec![addr],
                    // if_addrs only reports interfaces that have an address, so they are "up".
                    is_up: true,
                });
        }
        out = by_name.into_values().collect();
    }
    out
}

fn list_dns_servers() -> Vec<String> {
    #[cfg(windows)]
    {
        let cmd = "Get-DnsClientServerAddress -AddressFamily IPv4 \
                   | Where-Object { $_.ServerAddresses.Count -gt 0 } \
                   | ForEach-Object { $_.ServerAddresses } \
                   | Sort-Object -Unique";
        if let Some(out) = powershell(cmd) {
            return out
                .lines()
                .map(|l| l.trim().to_string())
                .filter(|l| !l.is_empty())
                .collect();
        }
    }
    Vec::new()
}

fn detect_tor() -> (bool, String) {
    let candidates = tor_paths();
    if let Some(p) = candidates.iter().find(|p| p.exists()) {
        return (true, format!("Detected at {}", p.display()));
    }
    if where_exists("tor.exe") {
        return (true, "Detected via PATH (tor.exe).".into());
    }
    (
        false,
        "Not detected. Install Tor Browser or the Tor Expert Bundle if you want Tor readiness checks.".into(),
    )
}

fn tor_paths() -> Vec<PathBuf> {
    let mut v = Vec::new();
    if let Some(profile) = dirs::home_dir() {
        v.push(
            profile
                .join("Desktop")
                .join("Tor Browser")
                .join("Browser")
                .join("TorBrowser")
                .join("Tor")
                .join("tor.exe"),
        );
        v.push(
            profile
                .join("Tor Browser")
                .join("Browser")
                .join("TorBrowser")
                .join("Tor")
                .join("tor.exe"),
        );
    }
    if let Ok(pf) = std::env::var("ProgramFiles") {
        v.push(
            PathBuf::from(&pf)
                .join("Tor Browser")
                .join("Browser")
                .join("TorBrowser")
                .join("Tor")
                .join("tor.exe"),
        );
    }
    if let Ok(pf86) = std::env::var("ProgramFiles(x86)") {
        v.push(
            PathBuf::from(&pf86)
                .join("Tor Browser")
                .join("Browser")
                .join("TorBrowser")
                .join("Tor")
                .join("tor.exe"),
        );
    }
    v.push(PathBuf::from(r"C:\Tor\tor.exe"));
    v
}

fn detect_wireguard() -> (bool, String) {
    let candidates = wg_paths();
    if let Some(p) = candidates.iter().find(|p| p.exists()) {
        return (true, format!("Detected at {}", p.display()));
    }
    if where_exists("wireguard.exe") || where_exists("wg.exe") {
        return (true, "Detected via PATH.".into());
    }
    (
        false,
        "Not detected. Install WireGuard for Windows from wireguard.com if you need WireGuard mode.".into(),
    )
}

fn wg_paths() -> Vec<PathBuf> {
    let mut v = Vec::new();
    if let Ok(pf) = std::env::var("ProgramFiles") {
        v.push(PathBuf::from(&pf).join("WireGuard").join("wireguard.exe"));
    }
    if let Ok(pf86) = std::env::var("ProgramFiles(x86)") {
        v.push(PathBuf::from(&pf86).join("WireGuard").join("wireguard.exe"));
    }
    v
}

#[cfg(windows)]
pub(crate) fn powershell(cmd: &str) -> Option<String> {
    let output = Command::new("powershell")
        .args([
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            cmd,
        ])
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    Some(String::from_utf8_lossy(&output.stdout).to_string())
}

#[cfg(not(windows))]
pub(crate) fn powershell(_cmd: &str) -> Option<String> {
    None
}

fn where_exists(bin: &str) -> bool {
    #[cfg(windows)]
    {
        Command::new("where")
            .arg(bin)
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false)
    }
    #[cfg(not(windows))]
    {
        Command::new("which")
            .arg(bin)
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false)
    }
}
