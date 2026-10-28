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
    { to: "/app/matches", label: "Matches", icon: "matches" },
    { to: "/app/messages", label: "Messages", icon: "chat", badge: unreadChats, mobile: true },
    { to: "/app/compatibility", label: "Compatibility", icon: "spark" },
    { to: "/app/games", label: "Games", icon: "games", mobile: true },
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
      <a href="#app-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-plum focus:px-4 focus:py-2 focus:text-ivory">
        Skip to content
      </a>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r hairline bg-ivory-deep/50 px-4 py-6 md:flex">
        <div className="px-3">
          <Logo to="/app/discover" />
        </div>
        <nav aria-label="App" className="mt-8 flex-1 space-y-0.5 overflow-y-auto">
          {items.map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              className={({ isActive }) =>
                cx("group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[0.95rem] font-medium transition", isActive ? "bg-white text-plum shadow-soft" : "text-ink-soft hover:bg-white/60 hover:text-ink")
              }
            >
              <Icon name={i.icon} className="h-5 w-5" />
              <span className="flex-1">{i.label}</span>
              {!!i.badge && (
                <span className="rounded-full bg-plum px-2 py-0.5 text-xs font-bold text-ivory" aria-label={`${i.badge} unread`}>
                  {i.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="mt-4 space-y-2 border-t hairline pt-4">
          <Link to="/app/notifications" className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-white/60 hover:text-ink">
            <Icon name="bell" />
            <span className="flex-1">Notifications</span>
            {!!unreadNotes && <span className="h-2 w-2 rounded-full bg-gold" aria-label={`${unreadNotes} unread`} />}
          </Link>
          <div className="flex items-center gap-3 rounded-2xl px-3 py-2">
            <Avatar id={account?.avatarPhotoId} name={account?.displayName ?? "You"} size="h-9 w-9" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{account?.displayName ?? "You"}</p>
              <ConnectionDot status={status} />
            </div>
            <button type="button" onClick={onLogout} className="rounded-full p-2 text-ink-muted hover:bg-ink/5 hover:text-ink" aria-label="Log out">
              <Icon name="logout" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b hairline bg-ivory/90 px-4 py-3 backdrop-blur md:hidden">
        <Logo to="/app/discover" />
        <div className="flex items-center gap-1">
          <Link to="/app/matches" className="rounded-full p-2.5 text-ink-soft" aria-label="Matches">
            <Icon name="matches" />
          </Link>
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
      <nav aria-label="App" className="fixed inset-x-0 bottom-0 z-30 border-t hairline bg-ivory/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul className="mx-auto grid max-w-md grid-cols-5">
          {items
            .filter((i) => i.mobile)
            .map((i) => (
              <li key={i.to}>
                <NavLink to={i.to} className={({ isActive }) => cx("relative flex flex-col items-center gap-1 py-2.5 text-[0.7rem] font-semibold", isActive ? "text-plum" : "text-ink-muted")}>
                  {({ isActive }) => (
                    <>
                      <Icon name={i.icon} className="h-6 w-6" filled={isActive && i.icon === "heart"} />
                      {i.label}
                      {!!i.badge && <span className="absolute right-[30%] top-1.5 h-2 w-2 rounded-full bg-plum" aria-label={`${i.badge} unread`} />}
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

function ConnectionDot({ status }: { status: string }) {
  const label = status === "connected" ? "Live" : status === "offline" ? "Offline" : "Connecting";
  return (
    <p className="flex items-center gap-1.5 text-xs text-ink-muted">
      <span className={cx("h-1.5 w-1.5 rounded-full", status === "connected" ? "bg-sage-ink" : "bg-gold")} aria-hidden="true" />
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
      <div className="flex min-h-dvh items-center justify-center text-plum">
        <Spinner label="Loading your account" className="h-8 w-8" />
      </div>
    );
  if (!account) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!allowUnverified && account.status === "PENDING_VERIFICATION") return <Navigate to="/verify-email" replace />;
  const staff = account.role === "ADMIN" || account.role === "MODERATOR";
  if (!allowNotOnboarded && !account.onboarded && !staff) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}
