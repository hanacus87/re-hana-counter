import { createContext, use } from "react";

export type User = {
  userName: string;
};

export type AuthState = {
  status: "loading" | "authenticated" | "unauthenticated";
  user: User | null;
  refresh: () => Promise<void>;
};

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const state = use(AuthContext);
  if (state === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return state;
}
