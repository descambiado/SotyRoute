/**
 * ActiveProfileContext — shared, in-memory, session-only active-profile state (PR 59).
 *
 * Infrastructure only. Nothing here feeds the SOTY Score yet — see
 * docs/soty-scope-architecture.md for the full design and the follow-up PR
 * that will actually wire this into Scope.
 *
 * No persistence: state lives only for the running session, exactly like
 * every other piece of dashboard state in this app. No I/O, no Tauri calls.
 */
import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import type { Profile } from "../lib/types";
import {
  activeProfileReducer,
  INITIAL_ACTIVE_PROFILE_STATE,
} from "../lib/activeProfileState";

interface ActiveProfileContextValue {
  activeProfile: Profile | null;
  setActiveProfile: (profile: Profile) => void;
  clearActiveProfile: () => void;
}

const ActiveProfileContext = createContext<ActiveProfileContextValue | null>(null);

export function ActiveProfileProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(activeProfileReducer, INITIAL_ACTIVE_PROFILE_STATE);

  const value = useMemo<ActiveProfileContextValue>(
    () => ({
      activeProfile: state.activeProfile,
      setActiveProfile: (profile: Profile) => dispatch({ type: "SET", profile }),
      clearActiveProfile: () => dispatch({ type: "CLEAR" }),
    }),
    [state.activeProfile]
  );

  return (
    <ActiveProfileContext.Provider value={value}>{children}</ActiveProfileContext.Provider>
  );
}

export function useActiveProfile(): ActiveProfileContextValue {
  const ctx = useContext(ActiveProfileContext);
  if (!ctx) {
    throw new Error("useActiveProfile must be used within an ActiveProfileProvider");
  }
  return ctx;
}
