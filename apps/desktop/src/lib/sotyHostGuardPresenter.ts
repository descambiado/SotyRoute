import type { HostGuardStatus } from "../types/hostGuard";
import { HOST_GUARD_LIMITATION_COPY } from "./sotyHostGuardEngine";

export type StatusVariant = "ok" | "warn" | "danger" | "info";

export function statusToVariant(status: HostGuardStatus): StatusVariant {
  switch (status) {
    case "pass": return "ok";
    case "warn": return "warn";
    case "fail": return "danger";
    case "skip": return "info";
  }
}

export function statusToLabel(status: HostGuardStatus): string {
  switch (status) {
    case "pass": return "Pass";
    case "warn": return "Warning";
    case "fail": return "Fail";
    case "skip": return "Skipped";
  }
}

export function overallCopy(status: HostGuardStatus): string {
  switch (status) {
    case "pass":
      return "Host posture looks good. Proceed with authorized operations.";
    case "warn":
      return "Host posture has warnings. Review flagged checks before operating.";
    case "fail":
      return "Host posture has critical issues. Address all failures before operating.";
    case "skip":
      return "Host Guard checks were skipped.";
  }
}

export { HOST_GUARD_LIMITATION_COPY };
