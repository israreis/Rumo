import { createContext, useContext, type ReactNode } from "react";

export type TripRole = "owner" | "editor" | "viewer";

const TripAccess = createContext<TripRole>("owner");

/** Provides the signed-in user's role on the open trip to every tab and dialog. */
export function TripAccessProvider({ role, children }: { role: TripRole; children: ReactNode }) {
  return <TripAccess.Provider value={role}>{children}</TripAccess.Provider>;
}

export function useTripRole(): TripRole {
  return useContext(TripAccess);
}

export function useCanEdit(): boolean {
  return useTripRole() !== "viewer";
}
