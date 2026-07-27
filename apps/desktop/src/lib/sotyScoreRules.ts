/**
 * Deterministic SOTY scoring rules.
 *
 * Each exported rule function accepts a SotyScoreInput and returns
 * the list of ScoreDeduction objects that apply. Functions are pure
 * (no side-effects, no I/O) and depend only on their argument.
 *
 * applyDeductions() converts a deduction list into a sub-score.
 */
import type {
  ScoreDeduction,
  RecommendedFix,
  ActionType,
  ScoreCategory,
  ScoreSeverity,
} from "../types/sotyScore";
import type { EvidenceLevel } from "../types/risk";

// ─── Input model ────────────────────────────────────────────────────────────

export interface SotyScoreInput {
  route: {
    public_ip_detected: boolean;
    dns_detected: boolean;
    dns_matches_profile: boolean | null;
    tunnel_detected: boolean;
    tunnel_expected: boolean;
    ipv6_leak_risk: boolean;
    proxy_detected: boolean;
    suspicious_proxy: boolean;
    route_table_snapshot_available: boolean;
    kill_switch_available: boolean | null;
    kill_switch_enabled: boolean | null;
  };
  host: {
    os_detected: boolean;
    elevated: boolean | null;
    firewall_enabled: boolean | null;
    defender_enabled: boolean | null;
    suspicious_proxy_settings: boolean;
    suspicious_route_warning: boolean;
    known_tunnel_process_detected: boolean;
    host_guard_available: boolean;
  };
  scope: {
    profile_loaded: boolean;
    profile_valid: boolean;
    target_declared: boolean;
    target_in_allowed_scope: boolean | null;
    blocked_target_match: boolean;
    authorized_use_confirmed: boolean;
  };
  intel: {
    route_pack_selected: boolean;
    osint_categories_selected: boolean;
    high_risk_resource_enabled: boolean;
    blocked_resource_requested: boolean;
    query_logging_disabled: boolean;
  };
  evidence: {
    evidence_enabled: boolean;
    evidence_directory_ready: boolean;
    session_id_available: boolean;
    evidence_level: EvidenceLevel;
    bofa_export_enabled: boolean;
    sotyhub_export_enabled: boolean;
  };
  route_pack: {
    route_pack_id: string | null;
  };
}

// ─── Private helpers ─────────────────────────────────────────────────────────

function mkFix(
  id: string,
  title: string,
  description: string,
  action_type: ActionType,
  safe_to_autorun = false,
  requires_confirmation = false
): RecommendedFix {
  return { id, title, description, action_type, safe_to_autorun, requires_confirmation };
}

function mkDeduction(
  id: string,
  category: ScoreCategory,
  severity: ScoreSeverity,
  points_lost: number,
  reason: string,
  fix: RecommendedFix,
  related_signal: string,
  blocking = false
): ScoreDeduction {
  return {
    id,
    category,
    severity,
    points_lost,
    reason,
    recommended_fix: fix,
    related_signal,
    blocking,
  };
}

// ─── Route rules ─────────────────────────────────────────────────────────────

export function routeRules(input: SotyScoreInput): ScoreDeduction[] {
  const d: ScoreDeduction[] = [];

  if (!input.route.public_ip_detected) {
    d.push(
      mkDeduction(
        "ROUTE_NO_PUBLIC_IP",
        "route",
        "medium",
        15,
        "Public IP could not be detected. Cannot confirm what address external services see.",
        mkFix(
          "FIX_ROUTE_NO_PUBLIC_IP",
          "Enable public IP check",
          "Enable the public IP check in Settings so SotyRoute can confirm your external address before you operate.",
          "enable_setting"
        ),
        "public_ip"
      )
    );
  }

  if (!input.route.dns_detected) {
    d.push(
      mkDeduction(
        "ROUTE_NO_DNS",
        "route",
        "medium",
        20,
        "DNS servers could not be detected. Cannot confirm your DNS posture.",
        mkFix(
          "FIX_ROUTE_NO_DNS",
          "Re-run Doctor check",
          "Run the Doctor check to refresh DNS server detection.",
          "run_check"
        ),
        "dns_servers"
      )
    );
  }

  if (input.route.dns_matches_profile === false) {
    d.push(
      mkDeduction(
        "ROUTE_DNS_MISMATCH",
        "route",
        "high",
        20,
        "Detected DNS servers do not match the servers declared in your profile.",
        mkFix(
          "FIX_ROUTE_DNS_MISMATCH",
          "Update profile DNS settings",
          "Update your profile to reflect the correct expected DNS servers, or switch to a network that matches your profile.",
          "configure_profile"
        ),
        "dns_servers"
      )
    );
  }

  if (input.route.tunnel_expected && !input.route.tunnel_detected) {
    d.push(
      mkDeduction(
        "ROUTE_TUNNEL_MISSING",
        "route",
        "high",
        30,
        "A tunnel is required by your profile or mode but no active tunnel was detected.",
        mkFix(
          "FIX_ROUTE_TUNNEL_MISSING",
          "Start your authorized tunnel",
          "Start your WireGuard, Tor or SOCKS5 tunnel (a configuration you own or are authorized to use), then re-run the Route check.",
          "manual"
        ),
        "tunnel_detection"
      )
    );
  }

  if (input.route.ipv6_leak_risk) {
    d.push(
      mkDeduction(
        "ROUTE_IPV6_LEAK",
        "route",
        "high",
        20,
        "IPv6 traffic may bypass your tunnel or proxy, leaking your real address.",
        mkFix(
          "FIX_ROUTE_IPV6_LEAK",
          "Disable IPv6 or configure tunnel to cover it",
          "Disable IPv6 on the relevant interface or ensure your tunnel configuration routes IPv6 traffic to prevent a bypass.",
          "enable_setting"
        ),
        "ipv6_leak_warning"
      )
    );
  }

  if (input.route.suspicious_proxy) {
    d.push(
      mkDeduction(
        "ROUTE_SUSPICIOUS_PROXY",
        "route",
        "high",
        25,
        "A suspicious or unexpected proxy is present in your routing path.",
        mkFix(
          "FIX_ROUTE_SUSPICIOUS_PROXY",
          "Review and remove suspicious proxy",
          "Review active proxy settings and remove any proxy you did not intentionally configure.",
          "review_warning"
        ),
        "proxy_settings"
      )
    );
  }

  if (!input.route.route_table_snapshot_available) {
    d.push(
      mkDeduction(
        "ROUTE_NO_ROUTE_TABLE",
        "route",
        "low",
        10,
        "A route table snapshot is not available. Evidence will not capture routing state for this session.",
        mkFix(
          "FIX_ROUTE_NO_ROUTE_TABLE",
          "Re-run Doctor check",
          "Re-run the Doctor check to attempt a route table snapshot.",
          "run_check"
        ),
        "route_table"
      )
    );
  }

  // Kill-switch: deduct for unavailable OR (available but disabled). Not both.
  if (input.route.kill_switch_available === false) {
    d.push(
      mkDeduction(
        "ROUTE_KILL_SWITCH_UNAVAILABLE",
        "route",
        "low",
        10,
        "No kill-switch is available on this host. Traffic may continue if the tunnel drops.",
        mkFix(
          "FIX_ROUTE_KILL_SWITCH_UNAVAILABLE",
          "Review kill-switch options",
          "Review whether your VPN client or OS firewall supports a kill-switch for this session.",
          "review_warning"
        ),
        "kill_switch_available"
      )
    );
  } else if (input.route.kill_switch_enabled === false) {
    d.push(
      mkDeduction(
        "ROUTE_KILL_SWITCH_DISABLED",
        "route",
        "medium",
        10,
        "A kill-switch is available but currently disabled. Traffic may continue if the tunnel drops.",
        mkFix(
          "FIX_ROUTE_KILL_SWITCH_DISABLED",
          "Enable the kill-switch",
          "Enable the kill-switch in your VPN client or OS firewall settings before operating.",
          "enable_setting",
          false,
          true
        ),
        "kill_switch_enabled"
      )
    );
  }

  return d;
}

// ─── Host rules ───────────────────────────────────────────────────────────────

export function hostRules(input: SotyScoreInput): ScoreDeduction[] {
  const d: ScoreDeduction[] = [];

  if (!input.host.os_detected) {
    d.push(
      mkDeduction(
        "HOST_OS_UNDETECTED",
        "host",
        "medium",
        20,
        "Operating system information could not be detected.",
        mkFix(
          "FIX_HOST_OS_UNDETECTED",
          "Re-run Doctor check",
          "Re-run the Doctor check. If the problem persists, check that the app has the permissions needed to read system information.",
          "run_check"
        ),
        "os_name"
      )
    );
  }

  // Only deduct for known-disabled (false). Null = unknown; do not penalise.
  if (input.host.firewall_enabled === false) {
    d.push(
      mkDeduction(
        "HOST_FIREWALL_DISABLED",
        "host",
        "high",
        20,
        "The host firewall is known to be disabled. Traffic is not filtered at the OS level.",
        mkFix(
          "FIX_HOST_FIREWALL_DISABLED",
          "Enable the host firewall",
          "Enable the Windows Firewall (or your OS-level firewall) before operating. SotyRoute does not modify firewall rules.",
          "manual"
        ),
        "firewall_status"
      )
    );
  }

  if (input.host.defender_enabled === false) {
    d.push(
      mkDeduction(
        "HOST_DEFENDER_DISABLED",
        "host",
        "medium",
        15,
        "Windows Defender (or its equivalent) is known to be disabled.",
        mkFix(
          "FIX_HOST_DEFENDER_DISABLED",
          "Review antivirus/EDR status",
          "Re-enable Defender or confirm a replacement AV/EDR solution is active. SotyRoute is not an antivirus and cannot replace it.",
          "manual"
        ),
        "defender_status"
      )
    );
  }

  if (input.host.suspicious_proxy_settings) {
    d.push(
      mkDeduction(
        "HOST_SUSPICIOUS_PROXY",
        "host",
        "high",
        20,
        "Suspicious or unexpected proxy settings are present on the host.",
        mkFix(
          "FIX_HOST_SUSPICIOUS_PROXY",
          "Review system proxy settings",
          "Review and remove any proxy settings you did not intentionally configure.",
          "review_warning"
        ),
        "proxy_settings"
      )
    );
  }

  if (input.host.suspicious_route_warning) {
    d.push(
      mkDeduction(
        "HOST_SUSPICIOUS_ROUTE",
        "host",
        "high",
        20,
        "A suspicious routing entry was detected on the host.",
        mkFix(
          "FIX_HOST_SUSPICIOUS_ROUTE",
          "Review route table",
          "Review the route table for unexpected entries and investigate before connecting to lab infrastructure.",
          "review_warning"
        ),
        "route_table"
      )
    );
  }

  if (!input.host.host_guard_available) {
    d.push(
      mkDeduction(
        "HOST_GUARD_UNAVAILABLE",
        "host",
        "info",
        10,
        "Host Guard is not yet available. Defensive posture checks are limited to Doctor-level signals.",
        mkFix(
          "FIX_HOST_GUARD_UNAVAILABLE",
          "Host Guard arrives in PR 7",
          "Full Host Guard posture checks are planned for the v0.3.0 SOTY track. Until then, use the Doctor check for baseline host signals.",
          "open_page"
        ),
        "host_guard_available"
      )
    );
  }

  return d;
}

// ─── Scope rules ─────────────────────────────────────────────────────────────

export function scopeRules(input: SotyScoreInput): ScoreDeduction[] {
  const d: ScoreDeduction[] = [];

  if (!input.scope.profile_loaded) {
    d.push(
      mkDeduction(
        "SCOPE_NO_PROFILE",
        "scope",
        "critical",
        40,
        "No profile is loaded. Scope, mode and evidence settings cannot be validated.",
        mkFix(
          "FIX_SCOPE_NO_PROFILE",
          "Load or create a profile",
          "Load an existing YAML/JSON profile or create one for your current task in the Profiles page.",
          "configure_profile"
        ),
        "profile_loaded"
      )
    );
  }

  if (input.scope.profile_loaded && !input.scope.profile_valid) {
    d.push(
      mkDeduction(
        "SCOPE_INVALID_PROFILE",
        "scope",
        "high",
        30,
        "The loaded profile failed validation. Scope, mode or transport settings are inconsistent.",
        mkFix(
          "FIX_SCOPE_INVALID_PROFILE",
          "Fix profile validation errors",
          "Open your profile in the Profiles page and correct the reported validation errors.",
          "configure_profile"
        ),
        "profile_valid"
      )
    );
  }

  if (!input.scope.target_declared) {
    d.push(
      mkDeduction(
        "SCOPE_NO_TARGET",
        "scope",
        "medium",
        20,
        "No targets are declared in the profile. Cannot confirm scope boundaries.",
        mkFix(
          "FIX_SCOPE_NO_TARGET",
          "Declare allowed targets in your profile",
          "Add allowed_targets to your profile YAML so SotyRoute can validate that your actions stay in scope.",
          "configure_profile"
        ),
        "allowed_targets"
      )
    );
  }

  if (input.scope.target_in_allowed_scope === false) {
    d.push(
      mkDeduction(
        "SCOPE_OUT_OF_SCOPE",
        "scope",
        "critical",
        50,
        "The current target is outside the allowed scope declared in your profile.",
        mkFix(
          "FIX_SCOPE_OUT_OF_SCOPE",
          "Obtain written authorization or update scope",
          "Stop. Obtain written authorization for the target, then update allowed_targets in your profile before proceeding.",
          "review_warning",
          false,
          true
        ),
        "target_in_allowed_scope",
        true // blocking
      )
    );
  }

  if (input.scope.blocked_target_match) {
    d.push(
      mkDeduction(
        "SCOPE_BLOCKED_TARGET",
        "scope",
        "critical",
        60,
        "The current target matches a target that is explicitly blocked in your profile.",
        mkFix(
          "FIX_SCOPE_BLOCKED_TARGET",
          "Do not proceed against blocked targets",
          "Stop. This target is explicitly blocked in your profile. Remove it from blocked_targets only if you have obtained written authorization for this specific target.",
          "review_warning",
          false,
          true
        ),
        "blocked_targets",
        true // blocking
      )
    );
  }

  if (!input.scope.authorized_use_confirmed) {
    d.push(
      mkDeduction(
        "SCOPE_NO_AUTHORIZATION",
        "scope",
        "medium",
        20,
        "Authorized use has not been confirmed for this session.",
        mkFix(
          "FIX_SCOPE_NO_AUTHORIZATION",
          "Confirm authorized use",
          "Confirm that you hold written authorization for all targets before operating. SotyRoute does not validate authorization on your behalf.",
          "review_warning",
          false,
          true
        ),
        "authorized_use_confirmed"
      )
    );
  }

  return d;
}

// ─── Intel rules ─────────────────────────────────────────────────────────────

export function intelRules(input: SotyScoreInput): ScoreDeduction[] {
  const d: ScoreDeduction[] = [];

  if (!input.intel.route_pack_selected) {
    d.push(
      mkDeduction(
        "INTEL_NO_ROUTE_PACK",
        "intel",
        "medium",
        20,
        "No Route Pack is selected. Mission context and recommended checks are not defined.",
        mkFix(
          "FIX_INTEL_NO_ROUTE_PACK",
          "Select a Route Pack",
          "Select a Route Pack that matches your mission (Student, OSINT, Lab, BOFA, etc.) to unlock mission-specific guidance.",
          "open_page"
        ),
        "route_pack_selected"
      )
    );
  }

  if (!input.intel.osint_categories_selected) {
    d.push(
      mkDeduction(
        "INTEL_NO_OSINT_CATEGORIES",
        "intel",
        "info",
        10,
        "No OSINT categories are selected. The Ethical OSINT Navigator will not provide resource guidance.",
        mkFix(
          "FIX_INTEL_NO_OSINT_CATEGORIES",
          "Select OSINT categories for your mission",
          "Open the Ethical OSINT Navigator and select the categories appropriate to your mission. High-risk categories remain opt-in.",
          "open_page"
        ),
        "osint_categories_selected"
      )
    );
  }

  if (input.intel.high_risk_resource_enabled) {
    d.push(
      mkDeduction(
        "INTEL_HIGH_RISK_RESOURCE",
        "intel",
        "high",
        30,
        "A high-risk OSINT category is currently enabled. Ensure this is intentional and within scope.",
        mkFix(
          "FIX_INTEL_HIGH_RISK_RESOURCE",
          "Review high-risk category selection",
          "High-risk categories (pastebin search, dark web research, people search, etc.) are opt-in. Confirm you have a specific, authorized need before proceeding.",
          "review_warning",
          false,
          true
        ),
        "high_risk_resource_enabled"
      )
    );
  }

  if (input.intel.blocked_resource_requested) {
    d.push(
      mkDeduction(
        "INTEL_BLOCKED_RESOURCE",
        "intel",
        "critical",
        40,
        "A resource blocked by policy (doxxing, carding, fraud, stolen accounts, etc.) was requested.",
        mkFix(
          "FIX_INTEL_BLOCKED_RESOURCE",
          "Do not use policy-blocked resources",
          "Stop. This resource type is blocked by SotyRoute's OSINT policy. Remove the request and do not proceed with blocked resources.",
          "review_warning",
          false,
          true
        ),
        "blocked_resource_requested",
        true // blocking
      )
    );
  }

  if (!input.intel.query_logging_disabled) {
    d.push(
      mkDeduction(
        "INTEL_QUERY_LOGGING",
        "intel",
        "medium",
        10,
        "Query logging is not confirmed disabled. Ensure your browser and OSINT tools are not logging queries externally.",
        mkFix(
          "FIX_INTEL_QUERY_LOGGING",
          "Confirm query logging is off",
          "Review your browser and OSINT tool settings to ensure queries are not sent to third-party logging services.",
          "review_warning"
        ),
        "query_logging_disabled"
      )
    );
  }

  return d;
}

// ─── Evidence rules ───────────────────────────────────────────────────────────

export function evidenceRules(input: SotyScoreInput): ScoreDeduction[] {
  const d: ScoreDeduction[] = [];

  if (!input.evidence.evidence_enabled) {
    d.push(
      mkDeduction(
        "EVIDENCE_DISABLED",
        "evidence",
        "critical",
        50,
        "Evidence collection is disabled. This session will not produce an auditable record.",
        mkFix(
          "FIX_EVIDENCE_DISABLED",
          "Enable evidence collection",
          "Enable evidence collection in Settings. Evidence is required for BOFA-gated operations and is strongly recommended for all authorized work.",
          "enable_setting",
          false,
          true
        ),
        "evidence_enabled"
      )
    );
  } else {
    // Evidence is enabled — check the level
    if (input.evidence.evidence_level === "off") {
      d.push(
        mkDeduction(
          "EVIDENCE_LEVEL_OFF",
          "evidence",
          "high",
          30,
          "Evidence is enabled but the evidence level is set to off. No files will be written.",
          mkFix(
            "FIX_EVIDENCE_LEVEL_OFF",
            "Set evidence level to at least standard",
            "Change evidence_level to standard or full in Settings to ensure session files are written.",
            "enable_setting"
          ),
          "evidence_level"
        )
      );
    } else if (input.evidence.evidence_level === "minimal") {
      d.push(
        mkDeduction(
          "EVIDENCE_LEVEL_MINIMAL",
          "evidence",
          "medium",
          15,
          "Evidence level is minimal. Some session details and exports may not be captured.",
          mkFix(
            "FIX_EVIDENCE_LEVEL_MINIMAL",
            "Increase evidence level to standard or full",
            "Change evidence_level to standard or full in Settings for complete session capture and BOFA/SotyHUB export support.",
            "enable_setting"
          ),
          "evidence_level"
        )
      );
    }
  }

  if (!input.evidence.evidence_directory_ready) {
    d.push(
      mkDeduction(
        "EVIDENCE_DIR_NOT_READY",
        "evidence",
        "high",
        30,
        "The evidence directory is not ready or could not be written to.",
        mkFix(
          "FIX_EVIDENCE_DIR_NOT_READY",
          "Check evidence directory in Settings",
          "Open Settings and verify that the evidence directory path is valid and writable.",
          "run_check"
        ),
        "evidence_directory_ready"
      )
    );
  }

  if (!input.evidence.session_id_available) {
    d.push(
      mkDeduction(
        "EVIDENCE_NO_SESSION_ID",
        "evidence",
        "medium",
        20,
        "No session ID is available. Evidence files cannot be uniquely identified for this session.",
        mkFix(
          "FIX_EVIDENCE_NO_SESSION_ID",
          "Start a new session",
          "Start a new session so that a unique session ID can be generated before operating.",
          "run_check"
        ),
        "session_id_available"
      )
    );
  }

  return d;
}

// ─── Scoring utility ─────────────────────────────────────────────────────────

/**
 * Subtract the sum of points_lost from start, clamped to [0, 100].
 */
export function applyDeductions(start: number, deductions: ScoreDeduction[]): number {
  const total = deductions.reduce((acc, d) => acc + d.points_lost, 0);
  return Math.max(0, Math.min(100, start - total));
}
