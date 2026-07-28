use crate::system::powershell;
use chrono::Utc;
use serde::{Deserialize, Serialize};

/// Real, read-only host posture signals. Every optional field is `None` when
/// the underlying check could not be performed (e.g. the PowerShell cmdlet is
/// unavailable on this SKU, or the process is not running on Windows) — the
/// frontend surfaces that as an honest "could not be determined" state rather
/// than a fabricated pass or fail.
///
/// No signal here mutates system state. No signal is transmitted anywhere;
/// this struct is returned to the local UI process only.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HostGuardSignals {
    pub os_detected: bool,
    pub elevated: bool,
    pub firewall_enabled: Option<bool>,
    pub defender_enabled: Option<bool>,
    pub proxy_configured: Option<bool>,
    pub known_tunnel_process_running: Option<bool>,
    pub generated_at: String,
}

/// Binary names (as reported by `Get-Process`, i.e. without the `.exe`
/// extension) for well-known VPN/Tor/tunnel clients. Matched by exact,
/// case-insensitive equality against the running process list — never a
/// substring match, to avoid false positives against unrelated processes.
const KNOWN_TUNNEL_PROCESS_NAMES: &[&str] = &[
    "tor",
    "wireguard",
    "wg",
    "openvpn",
    "openvpn-gui",
    "nordvpn",
    "expressvpn",
    "protonvpn",
    "protonvpn-service",
    "surfshark",
    "mullvad",
    "mullvad-daemon",
    "windscribe",
    "pia_manager",
    "tunnelbear",
];

pub fn collect_host_guard_signals() -> HostGuardSignals {
    HostGuardSignals {
        os_detected: true,
        elevated: is_elevated::is_elevated(),
        firewall_enabled: check_firewall_enabled(),
        defender_enabled: check_defender_enabled(),
        proxy_configured: check_proxy_configured(),
        known_tunnel_process_running: check_known_tunnel_process(),
        generated_at: Utc::now().to_rfc3339(),
    }
}

/// `true` only if every firewall profile (Domain/Private/Public) is enabled —
/// a Public-profile-disabled host is not considered "firewall enabled" even
/// if Domain/Private are on, since this app's own missions include operating
/// from untrusted public networks.
#[cfg(windows)]
fn check_firewall_enabled() -> Option<bool> {
    let out = powershell("(Get-NetFirewallProfile).Enabled -join ','")?;
    let vals: Vec<String> = out
        .trim()
        .split(',')
        .map(|s| s.trim().to_ascii_lowercase())
        .filter(|s| !s.is_empty())
        .collect();
    if vals.is_empty() {
        return None;
    }
    Some(vals.iter().all(|v| v == "true"))
}
#[cfg(not(windows))]
fn check_firewall_enabled() -> Option<bool> {
    None
}

/// Reflects Windows Defender's own reported state only. A third-party AV
/// replacing Defender may cause Defender to report itself as active or
/// disabled independent of the replacement's real state — this check cannot
/// see other vendors' agents.
#[cfg(windows)]
fn check_defender_enabled() -> Option<bool> {
    let cmd =
        "$s = Get-MpComputerStatus; \"$($s.AntivirusEnabled),$($s.RealTimeProtectionEnabled)\"";
    let out = powershell(cmd)?;
    let parts: Vec<String> = out
        .trim()
        .split(',')
        .map(|s| s.trim().to_ascii_lowercase())
        .collect();
    if parts.len() != 2 {
        return None;
    }
    Some(parts.iter().all(|p| p == "true"))
}
#[cfg(not(windows))]
fn check_defender_enabled() -> Option<bool> {
    None
}

/// Reads the current user's system-level proxy flag from the registry.
/// A configured proxy is not inherently malicious — it is surfaced so the
/// operator can confirm it is expected before starting a session.
#[cfg(windows)]
pub(crate) fn check_proxy_configured() -> Option<bool> {
    let cmd =
        "(Get-ItemProperty 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings' -Name ProxyEnable -ErrorAction Stop).ProxyEnable";
    let out = powershell(cmd)?;
    out.trim().parse::<i32>().ok().map(|v| v != 0)
}
#[cfg(not(windows))]
pub(crate) fn check_proxy_configured() -> Option<bool> {
    None
}

/// Exact (case-insensitive) match against `KNOWN_TUNNEL_PROCESS_NAMES`.
/// Detecting a known tunnel client is a neutral/informational signal, not
/// necessarily a problem — the operator may be intentionally running one.
#[cfg(windows)]
pub(crate) fn check_known_tunnel_process() -> Option<bool> {
    let out = powershell("(Get-Process | Select-Object -ExpandProperty ProcessName) -join ','")?;
    let names: Vec<String> = out
        .trim()
        .split(',')
        .map(|s| s.trim().to_ascii_lowercase())
        .filter(|s| !s.is_empty())
        .collect();
    if names.is_empty() {
        return None;
    }
    Some(
        names
            .iter()
            .any(|n| KNOWN_TUNNEL_PROCESS_NAMES.contains(&n.as_str())),
    )
}
#[cfg(not(windows))]
pub(crate) fn check_known_tunnel_process() -> Option<bool> {
    None
}
