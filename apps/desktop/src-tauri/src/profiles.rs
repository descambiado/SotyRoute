use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Mode {
    Observe,
    Tor,
    Wireguard,
    Socks5,
    Lab,
}

impl Mode {
    pub fn as_str(&self) -> &'static str {
        match self {
            Mode::Observe => "observe",
            Mode::Tor => "tor",
            Mode::Wireguard => "wireguard",
            Mode::Socks5 => "socks5",
            Mode::Lab => "lab",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Socks5Config {
    pub host: String,
    pub port: u16,
    #[serde(default)]
    pub auth: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WireguardConfig {
    #[serde(default)]
    pub tunnel_name: Option<String>,
    #[serde(default)]
    pub expected_endpoint: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Profile {
    pub name: String,
    pub mode: Mode,
    #[serde(default)]
    pub owner: Option<String>,
    #[serde(default)]
    pub purpose: Option<String>,
    pub transport: Mode,
    #[serde(default)]
    pub allowed_targets: Vec<String>,
    #[serde(default)]
    pub blocked_targets: Vec<String>,
    #[serde(default)]
    pub kill_switch: Option<bool>,
    #[serde(default)]
    pub dns_check: Option<bool>,
    #[serde(default)]
    pub evidence: Option<bool>,
    #[serde(default)]
    pub notes: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub socks5: Option<Socks5Config>,
    #[serde(default)]
    pub wireguard: Option<WireguardConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationResult {
    pub valid: bool,
    pub errors: Vec<String>,
    pub normalized: Option<Profile>,
}

pub fn load_from_path(path: &Path) -> anyhow::Result<Profile> {
    let raw = std::fs::read_to_string(path)?;
    let ext = path
        .extension()
        .and_then(|s| s.to_str())
        .unwrap_or("")
        .to_lowercase();
    let profile: Profile = match ext.as_str() {
        "json" => serde_json::from_str(&raw)?,
        "yaml" | "yml" | _ => serde_yaml::from_str(&raw)?,
    };
    Ok(profile)
}

pub fn validate(profile: &Profile) -> ValidationResult {
    let mut errors = Vec::new();

    if profile.name.trim().is_empty() {
        errors.push("name must not be empty".into());
    }
    if profile.name.contains(|c: char| c.is_control()) {
        errors.push("name contains control characters".into());
    }

    if let Some(socks) = &profile.socks5 {
        if socks.host.trim().is_empty() {
            errors.push("socks5.host must not be empty".into());
        }
        if socks.port == 0 {
            errors.push("socks5.port must be > 0".into());
        }
    }

    if matches!(profile.mode, Mode::Socks5) && profile.socks5.is_none() {
        errors.push("mode=socks5 requires a socks5 block".into());
    }

    if matches!(profile.mode, Mode::Wireguard) && profile.wireguard.is_none() {
        errors.push("mode=wireguard requires a wireguard block".into());
    }

    if matches!(profile.mode, Mode::Lab) {
        if profile.owner.is_none() {
            errors.push("mode=lab requires an owner".into());
        }
        if profile.purpose.is_none() {
            errors.push("mode=lab requires a purpose".into());
        }
        if profile.allowed_targets.is_empty() {
            errors.push(
                "mode=lab requires at least one allowed_target (scope must be declared)".into(),
            );
        }
    }

    ValidationResult {
        valid: errors.is_empty(),
        errors,
        normalized: Some(profile.clone()),
    }
}
