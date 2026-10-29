import { useState } from "react";
import { AppPage, PageHeader } from "../../components/app/PageHeader";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Dialog";
import { Select, Textarea } from "../../components/ui/Field";
import { LoadingBlock } from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/Toast";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useResource } from "../../lib/useResource";
import { cx, timeAgo } from "../../lib/format";

type MatchLite = { id: string; profile: { displayName: string } };

type Expert = { userId: string; displayName: string; headline: string; bio: string; experienceYears: number; specialties: string[]; credentials: string | null; credentialsVerified: boolean };
type ReviewEvent = { id: string; action: string; message: string | null; createdAt: string; authorId: string | null };
type MyRequest = { id: string; topic: string; question: string; status: string; sharedFields: string[]; createdAt: string; expertName: string | null; reviews: ReviewEvent[] };

const REQUEST_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Waiting for an expert", cls: "bg-gold-soft text-gold-ink" },
  IN_REVIEW: { label: "In review", cls: "bg-lavender-soft text-plum-700" },
  INFO_REQUESTED: { label: "Expert has a question", cls: "bg-rose-soft text-rose-ink" },
  COMPLETED: { label: "Review ready", cls: "bg-sage text-sage-ink" },
  DECLINED: { label: "Declined", cls: "bg-ink/5 text-ink-soft" },
  CANCELLED: { label: "Cancelled", cls: "bg-ink/5 text-ink-soft" },
};
const ACTION_LABEL: Record<string, string> = { CLAIMED: "An expert picked this up", INFO_REQUESTED: "Expert asked", INFO_PROVIDED: "You replied", COMPLETED: "Expert's reflections", DECLINED: "Expert declined", CANCELLED: "You cancelled" };

export function Experts() {
  const { account } = useAuth();
  const experts = useResource<Expert[]>("/experts");
  const requests = useResource<MyRequest[]>("/experts/requests");
  const matches = useResource<MatchLite[]>("/matches");
  const [open, setOpen] = useState<"request" | "apply" | null>(null);

  return (
    <AppPage wide>
      <PageHeader
        title="Compatibility Experts"
        lede="Optional reflections from vetted relationship coaches, based only on what you choose to share. Experts never see your chats, and a review never decides who you match with."
        actions={<Button onClick={() => setOpen("request")}>Request a review</Button>}
      />
      <div className="grid gap-10 grid-cols-1 lg:grid-cols-[1.2fr_1fr] [&>*]:min-w-0">
        <section aria-labelledby="my-requests">
          <h2 id="my-requests" className="text-2xl">
            Your requests
          </h2>
          {requests.loading ? (
            <LoadingBlock />
          ) : !requests.data?.length ? (
            <p className="mt-4 rounded-3xl bg-white/60 p-6 text-ink-soft">You haven't asked for a review yet. It's completely optional.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {requests.data.map((r) => (
                <RequestItem key={r.id} r={r} onChange={requests.reload} />
              ))}
            </ul>
          )}
        </section>
        <section aria-labelledby="experts-list">
          <h2 id="experts-list" className="text-2xl">
            Our experts
          </h2>
          <ul className="mt-4 space-y-4">
            {experts.data?.map((e) => (
              <li key={e.userId} className="rounded-3xl border hairline bg-white/75 p-5 shadow-soft">
                <p className="font-serif text-xl">{e.displayName}</p>
                <p className="text-sm text-ink-soft">{e.headline}</p>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{e.bio}</p>
                <p className="mt-3 text-xs text-ink-muted">
                  {e.experienceYears} years' experience · {e.specialties.join(", ")}
                </p>
                <p className="mt-2 text-xs text-ink-muted">{e.credentialsVerified ? "✓ Credentials verified by Knot" : "Credentials are self-declared and not independently verified."}</p>
              </li>
            ))}
            {experts.data?.length === 0 && <p className="text-ink-soft">No experts are available right now.</p>}
          </ul>
          {account?.role === "USER" && (
            <div className="mt-6 rounded-3xl bg-lavender-soft/70 p-5">
              <p className="font-semibold">Are you a relationship professional?</p>
              {account.expertStatus === "PENDING" ? (
                <p className="mt-1 text-sm text-ink-soft">Your application is with our team.</p>
              ) : (
                <>
                  <p className="mt-1 text-sm text-ink-soft">Apply to become a Compatibility Expert. Every application is reviewed by our team.</p>
                  <Button variant="secondary" size="sm" className="mt-3" onClick={() => setOpen("apply")}>
                    Apply
                  </Button>
                </>
              )}
            </div>
          )}
        </section>
      </div>
      <RequestDialog open={open === "request"} onClose={() => setOpen(null)} matches={matches.data ?? []} onCreated={requests.reload} />
      <ApplyDialog open={open === "apply"} onClose={() => setOpen(null)} />
    </AppPage>
  );
}

function RequestItem({ r, onChange }: { r: MyRequest; onChange: () => void }) {
  const [reply, setReply] = useState("");
  const toast = useToast();
  const st = REQUEST_STATUS[r.status];
  return (
    <li className="rounded-3xl border hairline bg-white/75 p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{r.topic}</p>
          <p className="text-xs text-ink-muted">
            Requested {timeAgo(r.createdAt)} · shared: {r.sharedFields.length ? r.sharedFields.join(", ") : "only your question"}
          </p>
        </div>
        <span className={cx("rounded-full px-2.5 py-1 text-xs font-semibold", st.cls)}>{st.label}</span>
      </div>
      <p className="mt-3 text-sm text-ink-soft">“{r.question}”</p>
      {r.reviews.length > 0 && (
        <ol className="mt-4 space-y-2 border-l-2 border-plum-100 pl-4">
          {r.reviews.map((e) => (
            <li key={e.id} className="text-sm">
              <p className="text-xs font-semibold text-ink-muted">
                {ACTION_LABEL[e.action]} · {timeAgo(e.createdAt)}
              </p>
              {e.message && <p className="mt-0.5 whitespace-pre-wrap text-ink">{e.message}</p>}
            </li>
          ))}
        </ol>
      )}
      {r.status === "COMPLETED" && <p className="mt-3 text-xs text-ink-muted">A review is guidance, not a decision. It doesn't change your matches.</p>}
      {r.status === "INFO_REQUESTED" && (
        <div className="mt-4 space-y-2">
          <Textarea label="Your reply" value={reply} onChange={(e) => setReply(e.target.value)} maxLength={1500} />
          <Button
            size="sm"
            disabled={reply.trim().length < 2}
            onClick={async () => {
              await api.post(`/experts/requests/${r.id}/respond`, { message: reply });
              toast("Reply sent");
              onChange();
            }}
          >
            Send reply
          </Button>
        </div>
      )}
      {["PENDING", "IN_REVIEW", "INFO_REQUESTED"].includes(r.status) && (
        <Button
          variant="quiet"
          size="sm"
          className="mt-3"
          onClick={async () => {
            await api.post(`/experts/requests/${r.id}/cancel`);
            onChange();
          }}
        >
          Cancel request
        </Button>
      )}
    </li>
  );
}

function RequestDialog({ open, onClose, matches, onCreated }: { open: boolean; onClose: () => void; matches: MatchLite[]; onCreated: () => void }) {
  const [topic, setTopic] = useState("");
  const [question, setQuestion] = useState("");
  const [share, setShare] = useState({ profile: false, intentions: false, compatibilityAnswers: false });
  const [matchId, setMatchId] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.post("/experts/requests", { topic, question, share: { ...share, matchId: matchId || undefined }, consent });
      toast("Request sent");
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? (e.details ? Object.values(e.details).flat()[0] ?? e.message : e.message) : "Couldn't send request.");
    } finally {
      setBusy(false);
    }
  };
  const items: [keyof typeof share, string][] = [
    ["profile", "My profile summary (name, age, city, bio, interests)"],
    ["intentions", "My relationship intentions"],
    ["compatibilityAnswers", "My compatibility answers"],
  ];
  return (
    <Dialog open={open} onClose={onClose} title="Request an expert review" description="An expert will only see what you tick below, captured right now.">
      <div className="space-y-4">
        <Select label="Topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option value="">Choose…</option>
          {["Understanding what I want", "Communication", "Long-term values", "A specific match", "My profile"].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </Select>
        <Textarea label="What would you like help thinking through?" value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={1500} />
        <fieldset className="space-y-2 rounded-3xl bg-white/60 p-4">
          <legend className="mb-1 text-sm font-semibold">Share with the expert</legend>
          {items.map(([k, label]) => (
            <label key={k} className="flex items-center gap-3 text-sm">
              <input type="checkbox" className="h-5 w-5 accent-plum" checked={share[k]} onChange={(e) => setShare((s) => ({ ...s, [k]: e.target.checked }))} />
              {label}
            </label>
          ))}
          {matches.length > 0 && (
            <Select label="Compatibility summary with a match" optional value={matchId} onChange={(e) => setMatchId(e.target.value)} hint="Only the summary is shared — never their answers or your messages.">
              <option value="">Don't share</option>
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.profile.displayName}
                </option>
              ))}
            </Select>
          )}
          <p className="pt-1 text-xs text-ink-muted">Your private messages are never shared.</p>
        </fieldset>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-0.5 h-5 w-5 accent-plum" checked={consent} onChange={(e) => setConsent(e.target.checked)} />I understand an approved expert will see the information I've selected, and that their review is guidance only.
        </label>
        {error && (
          <p role="alert" className="text-sm text-rose-ink">
            {error}
          </p>
        )}
        <Button className="w-full" onClick={submit} loading={busy} disabled={!topic || question.trim().length < 10 || !consent}>
          Send request
        </Button>
      </div>
    </Dialog>
  );
}

function ApplyDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { refresh } = useAuth();
  const [form, setForm] = useState({ headline: "", bio: "", experienceYears: "", credentials: "", specialties: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.post("/experts/apply", {
        headline: form.headline,
        bio: form.bio,
        experienceYears: Number(form.experienceYears || 0),
        credentials: form.credentials || undefined,
        specialties: form.specialties.split(",").map((s) => s.trim()).filter(Boolean),
      });
      toast("Application submitted");
      await refresh();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? (e.details ? `${Object.keys(e.details)[0]}: ${Object.values(e.details).flat()[0]}` : e.message) : "Couldn't submit.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open={open} onClose={onClose} title="Apply to be an expert" description="We review every application. Credentials are marked as verified only after we check them.">
      <div className="space-y-4">
        <InputLike label="Headline" value={form.headline} onChange={set("headline")} />
        <Textarea label="About your practice" value={form.bio} onChange={set("bio")} hint="At least 40 characters." />
        <InputLike label="Years of experience" value={form.experienceYears} onChange={set("experienceYears")} type="number" />
        <InputLike label="Credentials" value={form.credentials} onChange={set("credentials")} optional />
        <InputLike label="Specialties (comma separated)" value={form.specialties} onChange={set("specialties")} />
        {error && (
          <p role="alert" className="text-sm text-rose-ink">
            {error}
          </p>
        )}
        <Button className="w-full" onClick={submit} loading={busy}>
          Submit application
        </Button>
      </div>
    </Dialog>
  );
}

function InputLike(props: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; optional?: boolean }) {
  return (
    <label className="block space-y-1.5">
      <span className="flex justify-between text-sm font-semibold">
        {props.label}
        {props.optional && <span className="font-normal text-ink-muted">Optional</span>}
      </span>
      <input type={props.type ?? "text"} value={props.value} onChange={props.onChange} className="block w-full rounded-2xl border border-[#E4D8CD] bg-white/80 px-4 py-3 focus:border-plum focus:outline-none focus:ring-4 focus:ring-plum/10" />
    </label>
  );
}
