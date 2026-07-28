use crate::host_guard;
use crate::system::{self, powershell};
use chrono::Utc;
use serde::{Deserialize, Serialize};

/// Real, read-only route posture signals. Reuses `system::collect_doctor()`
/// for DNS/public-IP/tunnel-installed detection (the same code already
/// powering the Doctor page) and `host_guard`'s proxy/tunnel-process checks,
/// rather than duplicating PowerShell calls.
///
/// Every optional field is `None` when the underlying check could not be
/// performed — surfaced by the frontend as an honest "could not be
/// determined" state, never a fabricated pass or fail.
///
/// No signal here mutates system state. No signal is transmitted anywhere;
/// this struct is returned to the local UI process only. The public-IP
/// lookup is only performed when `enable_public_ip` is true, mirroring the
/// existing opt-in `AppSettings::public_ip_check_enabled` behaviour already
/// used by the Doctor page — this module does not add a new external call,
/// it only reads the result of that same existing, user-controlled setting.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RouteGuardSignals {
    pub dns_servers: Vec<String>,
    pub public_ip: Option<String>,
    pub tunnel_installed: bool,
    pub tunnel_process_running: Option<bool>,
    pub proxy_configured: Option<bool>,
    pub route_table_available: bool,
    pub generated_at: String,
}

pub fn collect_route_guard_signals(enable_public_ip: bool) -> RouteGuardSignals {
    let doctor = system::collect_doctor(enable_public_ip);
    RouteGuardSignals {
        dns_servers: doctor.dns_servers,
        public_ip: doctor.public_ip,
        tunnel_installed: doctor.tor_installed || doctor.wireguard_installed,
        tunnel_process_running: host_guard::check_known_tunnel_process(),
        proxy_configured: host_guard::check_proxy_configured(),
        route_table_available: check_route_table_available(),
        generated_at: Utc::now().to_rfc3339(),
    }
}

/// `true` if the OS route table can be read at all. Used only to confirm a
/// route-table snapshot could be captured for evidence — this reads routing
/// state, it does not modify it.
#[cfg(windows)]
fn check_route_table_available() -> bool {
    powershell("(Get-NetRoute -ErrorAction SilentlyContinue | Measure-Object).Count")
        .and_then(|out| out.trim().parse::<i32>().ok())
        .is_some_and(|count| count > 0)
}
#[cfg(not(windows))]
fn check_route_table_available() -> bool {
    false
}
