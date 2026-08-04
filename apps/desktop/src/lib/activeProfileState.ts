/**
 * Pure state logic for the shared active-profile context (PR 59).
 *
 * Kept separate from the React Context itself so the state-transition rules
 * are testable without rendering anything. No I/O, no side-effects.
 */
import type { Profile, ValidationResult } from "./types";

export interface ActiveProfileState {
  activeProfile: Profile | null;
}

export type ActiveProfileAction =
  | { type: "SET"; profile: Profile }
  | { type: "CLEAR" };

export const INITIAL_ACTIVE_PROFILE_STATE: ActiveProfileState = {
  activeProfile: null,
};

export function activeProfileReducer(
  state: ActiveProfileState,
  action: ActiveProfileAction
): ActiveProfileState {
  switch (action.type) {
    case "SET":
      return { activeProfile: action.profile };
    case "CLEAR":
      return { activeProfile: null };
    default:
      return state;
  }
}

/**
 * A profile becomes active only once it has actually passed validation —
 * a loaded-but-unvalidated or loaded-but-invalid profile must never be
 * published as active.
 */
export function shouldPublishActiveProfile(
  validation: ValidationResult | null
): boolean {
  return validation !== null && validation.valid === true;
}
