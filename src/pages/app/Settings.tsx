import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppPage, PageHeader } from "../../components/app/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Dialog } from "../../components/ui/Dialog";
import { Input } from "../../components/ui/Field";
import { LoadingBlock } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/States";
import { useToast } from "../../components/ui/Toast";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useTheme, type ThemeChoice } from "../../lib/theme";
import { cx } from "../../lib/format";
import { useResource } from "../../lib/useResource";
import { timeAgo } from "../../lib/format";

type SettingsData = { aiEnabled: boolean; readReceipts: boolean; typingIndicators: boolean; emailNotifications: boolean; showDistance: boolean; showZodiacSign: boolean; zodiac: { name: string; symbol: string; element: string } | null; isDiscoverable: boolean; discoveryPaused: boolean };
type SessionRow = { id: string; userAgent: string | null; createdAt: string; lastUsedAt: string; current: boolean };
type BlockRow = { userId: string; displayName: string; blockedAt: string };

function Toggle({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-6 py-4">
      <span>
        <span className="block font-semibold">{label}</span>
        {description && <span className="mt-0.5 block text-sm text-ink-muted">{description}</span>}
      </span>
      <span className="relative mt-1 inline-flex shrink-0">
        <input type="checkbox" role="switch" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-7 w-12 rounded-full bg-line transition peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2" />
        <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-paper shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

/** Only appears for people who have actually given birth details to Mavelle Astro. */
function AstroData() {
  const { data, reload } = useResource<{ hasBirthDetails: boolean; retentionDays: number }>("/astro/me");
  const toast = useToast();
  if (!data?.hasBirthDetails) return null;
  return (
    <Card className="p-6">
      <h2 className="text-xl">Mavelle Astro</h2>
      <p className="mt-2 text-sm text-ink-muted">Your encrypted birth details and chart. They're removed automatically after {data.retentionDays} days without use. Deleting them also removes any joint reports they were used for.</p>
      <Button
        className="mt-4"
        variant="secondary"
        size="sm"
        onClick={async () => {
          if (!window.confirm("Delete your birth details, chart and joint reports? Your matches and chats stay as they are.")) return;
          await api.delete("/astro/me");
          toast("Your astrology data has been deleted.", "info");
          void reload();
        }}
      >
        Delete my astrology data
      </Button>
    </Card>
  );
}

const THEMES: { value: ThemeChoice; label: string }[] = [
  { value: "system", label: "Match my device" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

function Appearance() {
  const { choice, setChoice } = useTheme();
  return (
    <Card className="p-6">
      <h2 className="text-xl">Appearance</h2>
      <div role="radiogroup" aria-label="Theme" className="mt-4 grid gap-2 sm:grid-cols-3">
        {THEMES.map((t) => (
          <button key={t.value} type="button" role="radio" aria-checked={choice === t.value} onClick={() => setChoice(t.value)} className={cx("rounded-2xl border px-4 py-3 text-sm font-semibold transition", choice === t.value ? "border-primary bg-primary-50 text-primary" : "hairline bg-surface/70 text-ink-soft hover:bg-surface")}>
            {t.label}
          </button>
        ))}
      </div>
    </Card>
  );
}

export function Settings() {
  const settings = useResource<SettingsData>("/settings");
  const sessions = useResource<SessionRow[]>("/settings/sessions");
  const blocks = useResource<BlockRow[]>("/safety/blocks");
  const toast = useToast();
  const { refresh, setAccount } = useAuth();
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<"password" | "delete" | null>(null);

  const update = async (patch: Partial<SettingsData>) => {
    const prev = settings.data;
    settings.setData((s) => (s ? { ...s, ...patch } : s));
    try {
      if ("discoveryPaused" in patch || "isDiscoverable" in patch) {
        await api.post("/settings/discovery", { paused: patch.discoveryPaused, isDiscoverable: patch.isDiscoverable });
      } else {
        await api.patch("/settings", patch);
      }
      toast("Saved");
      void refresh();
    } catch (e) {
      settings.setData(prev);
      toast(e instanceof ApiError ? e.message : "Couldn't save.", "error");
    }
  };

  const s = settings.data;
  return (
    <AppPage>
      <PageHeader title="Settings" lede="Privacy, visibility and your account." />
      {settings.loading && !s ? (
        <LoadingBlock />
      ) : settings.error ? (
        <ErrorState message={settings.error.message} onRetry={settings.reload} />
      ) : s ? (
        <div className="space-y-6">
          <Appearance />
          <Card className="px-6 py-2">
            <h2 className="pt-4 text-xl">Visibility</h2>
            <div className="divide-y hairline">
              <Toggle label="Pause Discover" description="Stop appearing to new people. Your matches and chats stay." checked={s.discoveryPaused} onChange={(v) => update({ discoveryPaused: v })} />
              <Toggle label="Show me in Discover" description="Turn off to only be visible to people you like first." checked={s.isDiscoverable} onChange={(v) => update({ isDiscoverable: v })} />
              <Toggle label="Show approximate distance" description="Others see a range like “About 10 km away”, never your location." checked={s.showDistance} onChange={(v) => update({ showDistance: v })} />
              {s.zodiac && <Toggle label={`Show my zodiac sign (${s.zodiac.symbol} ${s.zodiac.name})`} description="Just for fun: others see your sign and its type on your profile, including in Discover. It's worked out from your birth date, which stays private, and it never affects who you see or match with. Turn this off to hide it." checked={s.showZodiacSign} onChange={(v) => update({ showZodiacSign: v })} />}
            </div>
          </Card>
          <Card className="px-6 py-2">
            <h2 className="pt-4 text-xl">Messaging</h2>
            <div className="divide-y hairline">
              <Toggle label="Read receipts" description="Let matches see when you've read their messages." checked={s.readReceipts} onChange={(v) => update({ readReceipts: v })} />
              <Toggle label="Typing indicators" checked={s.typingIndicators} onChange={(v) => update({ typingIndicators: v })} />
              <Toggle label="Email notifications" checked={s.emailNotifications} onChange={(v) => update({ emailNotifications: v })} />
            </div>
          </Card>
          <Card className="px-6 py-2">
            <h2 className="pt-4 text-xl">Mavelle AI</h2>
            <div className="divide-y hairline">
              <Toggle label="Use Mavelle AI suggestions" description="When off, you'll only see hand-written suggestions from our team. AI never reads your chats either way." checked={s.aiEnabled} onChange={(v) => update({ aiEnabled: v })} />
            </div>
          </Card>
          <AstroData />
          <Card className="p-6">
            <h2 className="text-xl">Blocked people</h2>
            {!blocks.data?.length ? (
              <p className="mt-2 text-sm text-ink-muted">You haven't blocked anyone.</p>
            ) : (
              <ul className="mt-3 divide-y hairline">
                {blocks.data.map((b) => (
                  <li key={b.userId} className="flex items-center justify-between py-3">
                    <span>
                      {b.displayName} <span className="text-xs text-ink-muted">· {timeAgo(b.blockedAt)}</span>
                    </span>
                    <Button
                      variant="quiet"
                      size="sm"
                      onClick={async () => {
                        await api.delete(`/safety/blocks/${b.userId}`);
                        blocks.reload();
                      }}
                    >
                      Unblock
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card className="p-6">
            <h2 className="text-xl">Signed-in devices</h2>
            <ul className="mt-3 divide-y hairline">
              {sessions.data?.map((x) => (
                <li key={x.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate">{x.userAgent ?? "Unknown device"}</span>
                    <span className="text-xs text-ink-muted">Last active {timeAgo(x.lastUsedAt)}</span>
                  </span>
                  {x.current ? (
                    <span className="text-xs font-semibold text-success">This device</span>
                  ) : (
                    <Button
                      variant="quiet"
                      size="sm"
                      onClick={async () => {
                        await api.delete(`/settings/sessions/${x.id}`);
                        sessions.reload();
                      }}
                    >
                      Sign out
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="space-y-3 p-6">
            <h2 className="text-xl">Account</h2>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => setDialog("password")}>
                Change password
              </Button>
              <a href="/api/settings/export" className="inline-flex h-9 items-center rounded-full border border-primary/25 bg-surface/70 px-4 text-sm font-semibold text-primary hover:border-primary/50" download="knot-data.json">
                Download my data
              </a>
              <Button variant="quiet" size="sm" className="text-accent" onClick={() => setDialog("delete")}>
                Delete account
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
      <PasswordDialog open={dialog === "password"} onClose={() => setDialog(null)} />
      <DeleteDialog
        open={dialog === "delete"}
        onClose={() => setDialog(null)}
        onDeleted={() => {
          setAccount(null);
          navigate("/", { replace: true });
        }}
      />
    </AppPage>
  );
}

function PasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  return (
    <Dialog open={open} onClose={onClose} title="Change password" description="Other devices will be signed out.">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            await api.post("/auth/change-password", { currentPassword: current, newPassword: next });
            toast("Password changed");
            onClose();
          } catch (err) {
            setError(err instanceof ApiError ? (err.details?.newPassword?.[0] ?? err.message) : "Couldn't change password.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <Input label="Current password" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        <Input label="New password" type="password" autoComplete="new-password" hint="At least 10 characters, with a letter and a number." value={next} onChange={(e) => setNext(e.target.value)} />
        {error && (
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" loading={busy}>
          Update password
        </Button>
      </form>
    </Dialog>
  );
}

function DeleteDialog({ open, onClose, onDeleted }: { open: boolean; onClose: () => void; onDeleted: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onClose={onClose} title="Delete your account?" description="Your profile disappears immediately and your matches end. Everything is permanently erased after 30 days.">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            await api.post("/settings/delete-account", { password });
            onDeleted();
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "Couldn't delete your account.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <Input label="Confirm with your password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && (
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="quiet" onClick={onClose}>
            Keep my account
          </Button>
          <Button type="submit" variant="danger" loading={busy} disabled={!password}>
            Delete account
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
