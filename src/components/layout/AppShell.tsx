import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { api } from "../../lib/api";
import { useSocket, useSocketEvent } from "../../lib/socket";
import { cx } from "../../lib/format";
import type { ConversationSummary } from "../../lib/types";
import { Logo } from "../ui/Logo";
import { Icon, type IconName } from "../ui/Icon";
import { Avatar } from "../ui/Photo";
import { Spinner } from "../ui/Spinner";
import { useToast } from "../ui/Toast";

type Item = { to: string; label: string; icon: IconName; badge?: number; mobile?: boolean };

export function AppShell() {
  const { account, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { status } = useSocket();
  const { pathname } = useLocation();
  const [unreadChats, setUnreadChats] = useState(0);
  const [unreadNotes, setUnreadNotes] = useState(0);

  const refreshCounts = useCallback(async () => {
    try {
      const [convos, notes] = await Promise.all([
        api.get<ConversationSummary[]>("/conversations"),
        api.get<{ unread: number }>("/notifications"),
      ]);
      setUnreadChats(convos.filter((c) => c.unread > 0).length);
      setUnreadNotes(notes.unread);
    } catch {
      /* counts are best-effort */
    }
  }, []);

  useEffect(() => {
    void refreshCounts();
  }, [refreshCounts, pathname]);

  // Pages announce reads/changes so the badges stay in sync without polling.
  useEffect(() => {
    const onRefresh = () => void refreshCounts();
    window.addEventListener("knot:counts", onRefresh);
    return () => window.removeEventListener("knot:counts", onRefresh);
  }, [refreshCounts]);

  // The couple space appears in the navigation only while it is open.
  const [together, setTogether] = useState(false);
  const refreshCouple = useCallback(async () => {
    try {
      setTogether(!!(await api.get<unknown>("/couple/me")));
    } catch {
      /* best-effort, like the counts */
    }
  }, []);
  useEffect(() => {
    void refreshCouple();
    window.addEventListener("knot:couple", refreshCouple);
    return () => window.removeEventListener("knot:couple", refreshCouple);
  }, [refreshCouple]);
  useSocketEvent("couple:update", refreshCouple);
  useSocketEvent("match:ended", refreshCouple);

  useSocketEvent("conversation:updated", refreshCounts);
  useSocketEvent<{ title: string; type: string }>(
    "notification",
    useCallback(
      (n) => {
        setUnreadNotes((x) => x + 1);
        if (n.type === "MATCH") toast(n.title);
      },
      [toast],
    ),
  );

  const items: Item[] = [
    { to: "/app/discover", label: "Discover", icon: "discover", mobile: true },
    { to: "/app/likes", label: "Likes", icon: "heart", mobile: true },
    { to: "/app/matches", label: "Matches", icon: "matches", mobile: true },
    { to: "/app/messages", label: "Chat", icon: "chat", badge: unreadChats, mobile: true },
    ...(together ? [{ to: "/app/us", label: "Us", icon: "heart" as const }] : []),
    { to: "/app/compatibility", label: "Compatibility", icon: "spark" },
    { to: "/app/games", label: "Games", icon: "games" },
    { to: "/app/experts", label: "Experts", icon: "expert" },
    { to: "/app/profile", label: "Profile", icon: "user", mobile: true },
    { to: "/app/settings", label: "Settings", icon: "settings" },
  ];
  if (account?.role === "EXPERT") items.push({ to: "/app/expert-workspace", label: "Expert workspace", icon: "shield" });
  if (account?.role === "ADMIN" || account?.role === "MODERATOR") items.push({ to: "/app/admin", label: "Moderation", icon: "admin" });

  const onLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[17rem_1fr]">
      <a href="#app-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-surface">
        Skip to content
      </a>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col bg-primary px-4 py-6 text-surface md:flex">
        <div className="px-3">
          <Logo to="/app/discover" tone="light" />
        </div>
        <nav aria-label="App" className="mt-8 flex-1 space-y-0.5 overflow-y-auto">
          {items.map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              className={({ isActive }) =>
                cx("group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[0.95rem] font-medium transition", isActive ? "bg-surface text-primary shadow-soft" : "text-surface/80 hover:bg-surface/10 hover:text-surface", ONDARK)
              }
            >
              <Icon name={i.icon} className="h-5 w-5" />
              <span className="flex-1">{i.label}</span>
              {!!i.badge && (
                <span className="rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-primary-800" aria-label={`${i.badge} unread`}>
                  {i.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="mt-4 space-y-2 border-t border-surface/15 pt-4">
          <Link to="/app/notifications" className={cx("flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-surface/80 hover:bg-surface/10 hover:text-surface", ONDARK)}>
            <Icon name="bell" />
            <span className="flex-1">Notifications</span>
            {!!unreadNotes && <span className="h-2 w-2 rounded-full bg-gold" aria-label={`${unreadNotes} unread`} />}
          </Link>
          <div className="flex items-center gap-3 rounded-2xl px-3 py-2">
            <Avatar id={account?.avatarPhotoId} name={account?.displayName ?? "You"} size="h-9 w-9" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{account?.displayName ?? "You"}</p>
              <ConnectionDot status={status} onDark />
            </div>
            <button type="button" onClick={onLogout} className={cx("rounded-full p-2 text-surface/75 hover:bg-surface/10 hover:text-surface", ONDARK)} aria-label="Log out">
              <Icon name="logout" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 grid grid-cols-[1fr_auto_1fr] items-center border-b hairline bg-parchment/90 px-3 py-2.5 backdrop-blur md:hidden">
        <div className="flex items-center">
          <Link to="/app/games" className="rounded-full p-2.5 text-ink-soft" aria-label="Games">
            <Icon name="games" />
          </Link>
        </div>
        <Logo to="/app/discover" size="sm" />
        <div className="flex items-center justify-end">
          <Link to="/app/notifications" className="relative rounded-full p-2.5 text-ink-soft" aria-label={`Notifications${unreadNotes ? `, ${unreadNotes} unread` : ""}`}>
            <Icon name="bell" />
            {!!unreadNotes && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gold" />}
          </Link>
          <Link to="/app/settings" className="rounded-full p-2.5 text-ink-soft" aria-label="Settings">
            <Icon name="settings" />
          </Link>
        </div>
      </header>

      <main id="app-main" className="min-w-0 pb-28 md:pb-10">
        {status === "reconnecting" && (
          <div role="status" className="flex items-center justify-center gap-2 bg-gold-soft px-4 py-2 text-sm text-gold-ink">
            <Spinner className="h-3.5 w-3.5" /> Reconnecting to live updates…
          </div>
        )}
        <Outlet />
      </main>

      {/* Mobile bottom navigation */}
      <nav aria-label="App" className="fixed inset-x-0 bottom-0 z-30 border-t hairline bg-parchment/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul className="mx-auto grid max-w-md grid-cols-5">
          {items
            .filter((i) => i.mobile)
            .map((i) => (
              <li key={i.to}>
                <NavLink to={i.to} className={({ isActive }) => cx("relative flex flex-col items-center gap-1 py-2.5 text-[0.7rem] font-semibold transition-colors", isActive ? "text-primary" : "text-ink-muted")}>
                  {({ isActive }) => (
                    <>
                      <Icon name={i.icon} className="h-6 w-6" filled={isActive && i.icon !== "discover"} />
                      {i.label}
                      {!!i.badge && <span className="absolute right-[30%] top-1.5 h-2 w-2 rounded-full bg-primary" aria-label={`${i.badge} unread`} />}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
        </ul>
      </nav>
    </div>
  );
}

// Focus rings that stay visible on the burgundy sidebar.
const ONDARK = "focus-visible:ring-gold focus-visible:ring-offset-primary";

function ConnectionDot({ status, onDark }: { status: string; onDark?: boolean }) {
  const label = status === "connected" ? "Live" : status === "offline" ? "Offline" : "Connecting";
  return (
    <p className={cx("flex items-center gap-1.5 text-xs", onDark ? "text-surface/75" : "text-ink-muted")}>
      <span className={cx("h-1.5 w-1.5 rounded-full", status === "connected" ? (onDark ? "bg-rose" : "bg-success") : "bg-gold")} aria-hidden="true" />
      {label}
    </p>
  );
}

/** Route guards. */
export function RequireAuth({ children, allowUnverified, allowNotOnboarded }: { children: React.ReactNode; allowUnverified?: boolean; allowNotOnboarded?: boolean }) {
  const { account, loading } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <div className="flex min-h-dvh items-center justify-center text-primary">
        <Spinner label="Loading your account" className="h-8 w-8" />
      </div>
    );
  if (!account) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!allowUnverified && account.status === "PENDING_VERIFICATION") return <Navigate to="/verify-email" replace />;
  const staff = account.role === "ADMIN" || account.role === "MODERATOR";
  if (!allowNotOnboarded && !account.onboarded && !staff) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}
