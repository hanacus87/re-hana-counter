import { type ReactNode, useCallback, useEffect, useState } from "react";
import { AuthContext, type User } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/me");
      setUser(res.ok ? ((await res.json()) as User) : null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ user, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}
