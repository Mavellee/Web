import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, ApiError } from "./api";
import type { Account } from "./types";

interface AuthState {
  account: Account | null;
  loading: boolean;
  refresh: () => Promise<Account | null>;
  setAccount: (a: Account | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const a = await api.get<Account>("/auth/me");
      setAccount(a);
      return a;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setAccount(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await api.post("/auth/logout").catch(() => {});
    setAccount(null);
  }, []);

  const value = useMemo(() => ({ account, loading, refresh, setAccount, logout }), [account, loading, refresh, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
