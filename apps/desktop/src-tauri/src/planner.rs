use crate::profiles::{Mode, Profile};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlanStep {
    pub step: String,
    pub detail: String,
    pub reversible: bool,
    pub executes_in_v0_1_0: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Warning {
    pub code: String,
    pub severity: String,
    pub message: String,
}

pub struct Plan {
    pub steps: Vec<PlanStep>,
    pub warnings: Vec<Warning>,
}

pub fn plan(mode: &Mode, profile: &Profile) -> Plan {
    match mode {
        Mode::Observe => plan_observe(profile),
        Mode::Tor => plan_tor(profile),
        Mode::Wireguard => plan_wireguard(profile),
        Mode::Socks5 => plan_socks5(profile),
        Mode::Lab => plan_lab(profile),
    }
}

fn plan_observe(_p: &Profile) -> Plan {
    Plan {
        steps: vec![
            PlanStep {
                step: "collect_system_info".into(),
                detail: "Capture OS, hostname, user, admin state, interfaces, DNS, transport availability.".into(),
                reversible: true,
                executes_in_v0_1_0: true,
            },
            PlanStep {
                step: "write_evidence".into(),
                detail: "Write session.json / checks.json / plan.json / warnings.json / evidence.md to the evidence directory.".into(),
                reversible: true,
                executes_in_v0_1_0: true,
            },
        ],
        warnings: vec![Warning {
            code: "observe_only".into(),
            severity: "info".into(),
            message: "Observe mode captures state and does not modify the system.".into(),
        }],
    }
}

fn plan_tor(_p: &Profile) -> Plan {
    Plan {
        steps: vec![
            PlanStep {
                step: "detect_tor".into(),
                detail: "Check for tor.exe in known paths and PATH.".into(),
                reversible: true,
                executes_in_v0_1_0: true,
            },
            PlanStep {
                step: "probe_socks_port".into(),
                detail: "Future: probe local SOCKS port (default 9050 / 9150) for reachability.".into(),
                reversible: true,
                executes_in_v0_1_0: false,
            },
            PlanStep {
                step: "describe_routing_change".into(),
                detail: "Describe (do not apply) the firewall / routing changes a full Tor mode would require.".into(),
                reversible: true,
                executes_in_v0_1_0: false,
            },
        ],
        warnings: vec![
            Warning {
                code: "tor_is_not_a_vpn".into(),
                severity: "warn".into(),
                message: "Tor is not a VPN. SotyRoute does not guarantee anonymity.".into(),
            },
            Warning {
                code: "dry_run_only".into(),
                severity: "info".into(),
                message: "v0.1.0 plans the steps; it does not execute system-level Tor routing.".into(),
            },
        ],
    }
}

fn plan_wireguard(p: &Profile) -> Plan {
    let mut warnings = vec![
        Warning {
            code: "wg_requires_existing_config".into(),
            severity: "warn".into(),
            message: "WireGuard requires an existing server/configuration. SotyRoute is not a VPN provider.".into(),
        },
        Warning {
            code: "dry_run_only".into(),
            severity: "info".into(),
            message: "v0.1.0 detects WireGuard and validates the profile shape only.".into(),
        },
    ];

    if p.wireguard.is_none() {
        warnings.push(Warning {
            code: "wg_profile_missing".into(),
            severity: "error".into(),
            message: "Profile is missing the wireguard block.".into(),
        });
    }

    Plan {
        steps: vec![
            PlanStep {
                step: "detect_wireguard".into(),
                detail: "Check for the WireGuard for Windows installation in Program Files / PATH."
                    .into(),
                reversible: true,
                executes_in_v0_1_0: true,
            },
            PlanStep {
                step: "validate_tunnel_reference".into(),
                detail: "Future: confirm the named tunnel exists as a managed tunnel.".into(),
                reversible: true,
                executes_in_v0_1_0: false,
            },
            PlanStep {
                step: "describe_tunnel_orchestration".into(),
                detail:
                    "Describe up/down sequence including reversible kill-switch firewall rules."
                        .into(),
                reversible: true,
                executes_in_v0_1_0: false,
            },
        ],
        warnings,
    }
}

fn plan_socks5(p: &Profile) -> Plan {
    let mut warnings = vec![
        Warning {
            code: "socks5_per_app".into(),
            severity: "warn".into(),
            message: "Not all applications respect SOCKS5 proxy settings. System-wide enforcement is not in scope for v0.1.0.".into(),
        },
        Warning {
            code: "dry_run_only".into(),
            severity: "info".into(),
            message: "v0.1.0 validates the profile and reports the planned probe; no traffic is intercepted.".into(),
        },
    ];

    if p.socks5.is_none() {
        warnings.push(Warning {
            code: "socks5_profile_missing".into(),
            severity: "error".into(),
            message: "Profile is missing the socks5 block.".into(),
        });
    }

    Plan {
        steps: vec![
            PlanStep {
                step: "validate_host_port".into(),
                detail: "Validate socks5.host / socks5.port fields.".into(),
                reversible: true,
                executes_in_v0_1_0: true,
            },
            PlanStep {
                step: "describe_app_configuration".into(),
                detail:
                    "Document which per-application SOCKS5 settings would need to be configured."
                        .into(),
                reversible: true,
                executes_in_v0_1_0: false,
            },
        ],
        warnings,
    }
}

fn plan_lab(p: &Profile) -> Plan {
    let mut warnings = vec![Warning {
        code: "lab_scope_owner_responsibility".into(),
        severity: "info".into(),
        message: "Lab scope (allowed_targets / blocked_targets) is the operator's declaration; SotyRoute records it but cannot verify authorization.".into(),
    }];

    if p.allowed_targets.is_empty() {
        warnings.push(Warning {
            code: "lab_scope_empty".into(),
            severity: "warn".into(),
            message: "allowed_targets is empty. A lab profile should declare at least one in-scope target.".into(),
        });
    }

    Plan {
        steps: vec![
            PlanStep {
                step: "record_lab_scope".into(),
                detail: format!(
                    "Record {} allowed and {} blocked targets in the evidence bundle.",
                    p.allowed_targets.len(),
                    p.blocked_targets.len()
                ),
                reversible: true,
                executes_in_v0_1_0: true,
            },
            PlanStep {
                step: "produce_evidence_bundle".into(),
                detail: "Write evidence files for downstream BOFA/SotyHUB consumption.".into(),
                reversible: true,
                executes_in_v0_1_0: true,
            },
        ],
        warnings,
    }
}
