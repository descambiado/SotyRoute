/**
 * Host Guard engine — deterministic, read-only posture checks.
 *
 * Safety: pure function, no I/O, no system mutations, no external calls.
 *         Returns a HostGuardSummary describing the current posture signals.
 *         Does not guarantee the host is free of threats.
 */
import type {
  HostGuardCheck,
  HostGuardCheckId,
  HostGuardInput,
  HostGuardStatus,
  HostGuardSummary,
} from "../types/hostGuard";
import type { DemoPresetKey } from "./sotyDemoInput";

// ─── Limitation copy (required product copy) ──────────────────────────────────

export const HOST_GUARD_LIMITATION_COPY =
  "Host Guard provides defensive posture checks. It cannot guarantee the host is clean.";

// ─── Demo inputs (mirrors sotyDemoInput BASE_HOST + preset overrides) ─────────

export const DEMO_HOST_GUARD_INPUTS: Record<DemoPresetKey, HostGuardInput> = {
  ready: {
    os_detected: true,
    elevated: false,
    firewall_enabled: true,
    defender_enabled: true,
    suspicious_proxy_settings: false,
    suspicious_route_warning: false,
    known_tunnel_process_detected: false,
  },
  warn: {
    os_detected: true,
    elevated: false,
    firewall_enabled: false,
    defender_enabled: true,
    suspicious_proxy_settings: false,
    suspicious_route_warning: false,
    known_tunnel_process_detected: false,
  },
  exposed: {
    os_detected: true,
    elevated: false,
    firewall_enabled: true,
    defender_enabled: true,
    suspicious_proxy_settings: false,
    suspicious_route_warning: false,
    known_tunnel_process_detected: false,
  },
  blocked: {
    os_detected: true,
    elevated: false,
    firewall_enabled: true,
    defender_enabled: true,
    suspicious_proxy_settings: false,
    suspicious_route_warning: false,
    known_tunnel_process_detected: false,
  },
  dirty: {
    os_detected: true,
    elevated: false,
    firewall_enabled: false,
    defender_enabled: false,
    suspicious_proxy_settings: false,
    suspicious_route_warning: false,
    known_tunnel_process_detected: false,
  },
};

// ─── Check builders ───────────────────────────────────────────────────────────

function osCheck(input: HostGuardInput): HostGuardCheck {
  const id: HostGuardCheckId = "HG_OS_DETECTED";
  if (input.os_detected) {
    return { id, phase: "host", label: "OS Detection", status: "pass", detail: "Operating system detected." };
  }
  return { id, phase: "host", label: "OS Detection", status: "fail", detail: "Operating system could not be detected — posture checks are limited." };
}

function elevatedCheck(input: HostGuardInput): HostGuardCheck {
  const id: HostGuardCheckId = "HG_ELEVATED";
  if (input.elevated === false) {
    return { id, phase: "host", label: "Privilege Level", status: "pass", detail: "Not running with elevated privileges." };
  }
  if (input.elevated === null) {
    return { id, phase: "host", label: "Privilege Level", status: "warn", detail: "Privilege level could not be determined." };
  }
  return { id, phase: "host", label: "Privilege Level", status: "fail", detail: "Running with elevated privileges. Reduce to standard user before operating." };
}

function firewallCheck(input: HostGuardInput): HostGuardCheck {
  const id: HostGuardCheckId = "HG_FIREWALL";
  if (input.firewall_enabled === true) {
    return { id, phase: "host", label: "Host Firewall", status: "pass", detail: "Host firewall is enabled." };
  }
  if (input.firewall_enabled === null) {
    return { id, phase: "host", label: "Host Firewall", status: "warn", detail: "Firewall status could not be determined." };
  }
  return { id, phase: "host", label: "Host Firewall", status: "fail", detail: "Host firewall is disabled. Enable it before operating. Host Guard does not modify firewall rules." };
}

function defenderCheck(input: HostGuardInput): HostGuardCheck {
  const id: HostGuardCheckId = "HG_DEFENDER";
  if (input.defender_enabled === true) {
    return { id, phase: "host", label: "AV / EDR", status: "pass", detail: "Windows Defender (or equivalent AV) is enabled." };
  }
  if (input.defender_enabled === null) {
    return { id, phase: "host", label: "AV / EDR", status: "warn", detail: "AV/EDR status could not be determined." };
  }
  return { id, phase: "host", label: "AV / EDR", status: "fail", detail: "Windows Defender is disabled. Enable it or confirm a replacement is active. Host Guard is not an antivirus." };
}

function suspiciousProxyCheck(input: HostGuardInput): HostGuardCheck {
  const id: HostGuardCheckId = "HG_SUSPICIOUS_PROXY";
  if (input.suspicious_proxy_settings === null) {
    return { id, phase: "route", label: "Proxy Settings", status: "skip", detail: "Proxy status could not be determined." };
  }
  if (!input.suspicious_proxy_settings) {
    return { id, phase: "route", label: "Proxy Settings", status: "pass", detail: "No suspicious proxy settings detected." };
  }
  return { id, phase: "route", label: "Proxy Settings", status: "fail", detail: "Suspicious proxy settings detected. Review and remove before operating." };
}

function suspiciousRouteCheck(input: HostGuardInput): HostGuardCheck {
  const id: HostGuardCheckId = "HG_SUSPICIOUS_ROUTE";
  if (input.suspicious_route_warning === null) {
    return { id, phase: "route", label: "Route Table", status: "skip", detail: "Route-table analysis is not yet implemented in real mode." };
  }
  if (!input.suspicious_route_warning) {
    return { id, phase: "route", label: "Route Table", status: "pass", detail: "No suspicious routing entries detected." };
  }
  return { id, phase: "route", label: "Route Table", status: "fail", detail: "Suspicious route table entry detected. Review before connecting to lab infrastructure." };
}

function knownTunnelCheck(input: HostGuardInput): HostGuardCheck {
  const id: HostGuardCheckId = "HG_KNOWN_TUNNEL";
  if (input.known_tunnel_process_detected === null) {
    return { id, phase: "process", label: "Tunnel Process", status: "skip", detail: "Running process list could not be read." };
  }
  if (!input.known_tunnel_process_detected) {
    return { id, phase: "process", label: "Tunnel Process", status: "pass", detail: "No known tunnel process detected outside expected configuration." };
  }
  return { id, phase: "process", label: "Tunnel Process", status: "warn", detail: "A known tunnel process is running. Confirm it is part of your authorized configuration." };
}

// ─── Overall status ───────────────────────────────────────────────────────────

function deriveOverall(checks: HostGuardCheck[]): HostGuardStatus {
  if (checks.some(c => c.status === "fail")) return "fail";
  if (checks.some(c => c.status === "warn")) return "warn";
  if (checks.every(c => c.status === "skip")) return "skip";
  return "pass";
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function runHostGuard(input: HostGuardInput): HostGuardSummary {
  const checks: HostGuardCheck[] = [
    osCheck(input),
    elevatedCheck(input),
    firewallCheck(input),
    defenderCheck(input),
    suspiciousProxyCheck(input),
    suspiciousRouteCheck(input),
    knownTunnelCheck(input),
  ];
  return {
    overall: deriveOverall(checks),
    checks,
    run_at: new Date().toISOString(),
    limitation_copy: HOST_GUARD_LIMITATION_COPY,
  };
}
