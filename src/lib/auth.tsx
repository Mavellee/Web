import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, ApiError, renewSession } from "./api";
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

  // Keep the 15-minute access cookie fresh while someone is here, so photos and videos (which load without our
  // fetch wrapper) never meet an expired token. Renewal also runs when a hidden tab comes back.
  const signedIn = !!account;
  useEffect(() => {
    if (!signedIn) return;
    let last = Date.now();
    const renew = () => {
      last = Date.now();
      renewSession()
        .then((ok) => {
          if (!ok) void refresh();
        })
        .catch(() => {});
    };
    const timer = setInterval(() => document.visibilityState === "visible" && renew(), 10 * 60 * 1000);
    const onVisible = () => document.visibilityState === "visible" && Date.now() - last > 5 * 60 * 1000 && renew();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [signedIn, refresh]);

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
