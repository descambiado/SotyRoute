/** Decision record emitted by the BOFA Gate for a given session/score. */
export interface BofaGateDecision {
  allowed: boolean;
  blocked: boolean;
  warn: boolean;
  /** Human-readable reasons for the gate decision. */
  reasons: string[];
  /** Fix IDs that must be resolved before BOFA modules can run. */
  required_fixes: string[];
  /** Mirrors the BOFA export preflight_passed flag. */
  preflight_passed: boolean;
}
