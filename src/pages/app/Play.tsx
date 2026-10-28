import { useCallback, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppPage, PageHeader } from "../../components/app/PageHeader";
import { AiPanel } from "../../components/app/AiPanel";
import { QuestionCard, type Question } from "../../components/compat/QuestionCard";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Dialog";
import { Select, Textarea } from "../../components/ui/Field";
import { Icon } from "../../components/ui/Icon";
import { LoadingBlock, Skeleton } from "../../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../../components/ui/States";
import { Chip } from "../../components/ui/Chip";
import { useToast } from "../../components/ui/Toast";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useSocketEvent } from "../../lib/socket";
import { useResource } from "../../lib/useResource";
import { cx, timeAgo } from "../../lib/format";
import { DIMENSION_LABEL } from "../../lib/labels";

// ---------------- Games ----------------

type Game = { slug: string; name: string; description: string; category: string; questionCount: number };
type ActiveSession = { id: string; game: { name: string }; progress: { current: number; total: number }; withName: string | null; isShared: boolean };
type MatchLite = { id: string; profile: { displayName: string } };

const GAME_TONE: Record<string, string> = {
  RED_FLAG_GREEN_FLAG: "from-rose to-rose-soft",
  KNOW_EACH_OTHER: "from-lavender to-lavender-soft",
  DEEP_QUESTIONS: "from-plum-200 to-plum-50",
  WOULD_YOU_RATHER: "from-sage-deep to-sage",
  LOYALTY_BOUNDARIES: "from-gold-soft to-ivory-deep",
  LOVE_LANGUAGES: "from-rose-soft to-lavender-soft",
  FUN_CHALLENGES: "from-sage to-gold-soft",
};

export function Games() {
  const games = useResource<Game[]>("/games");
  const sessions = useResource<ActiveSession[]>("/games/sessions");
  const matches = useResource<MatchLite[]>("/matches");
  const [picked, setPicked] = useState<Game | null>(null);
  const [partner, setPartner] = useState("");
  const [count, setCount] = useState("8");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const start = async () => {
    if (!picked) return;
    setBusy(true);
    setError(null);
    try {
      const s = await api.post<{ id: string }>("/games/sessions", { gameSlug: picked.slug, matchId: partner || undefined, questionCount: Number(count) });
      navigate(`/app/games/${s.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't start the game.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppPage wide>
      <PageHeader title="Games" lede="Curated question cards for real conversations. Play on your own to reflect, or invite a match. Skip anything, any time." />
      {!!sessions.data?.length && (
        <section aria-labelledby="in-progress" className="mb-10">
          <h2 id="in-progress" className="mb-3 font-sans text-sm font-semibold uppercase tracking-wider text-ink-muted">
            In progress
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {sessions.data.map((s) => (
              <li key={s.id}>
                <Link to={`/app/games/${s.id}`} className="flex items-center justify-between rounded-3xl border hairline bg-white/80 p-4 shadow-soft transition hover:shadow-lift">
                  <div>
                    <p className="font-semibold">{s.game.name}</p>
                    <p className="text-sm text-ink-muted">
                      {s.isShared ? `With ${s.withName}` : "Solo"} · card {s.progress.current} of {s.progress.total}
                    </p>
                  </div>
                  <Icon name="arrow" className="h-5 w-5 text-plum" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {games.loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-48 rounded-4xl" />
          ))}
        </div>
      ) : games.error ? (
        <ErrorState message={games.error.message} onRetry={games.reload} />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {games.data?.map((g) => (
            <li key={g.slug}>
              <button type="button" onClick={() => setPicked(g)} className={cx("group flex h-full w-full flex-col rounded-4xl bg-gradient-to-br p-6 text-left shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift", GAME_TONE[g.category])}>
                <span className="text-xs font-semibold uppercase tracking-wider text-ink/60">{g.questionCount} cards</span>
                <span className="mt-6 font-serif text-2xl leading-tight text-ink">{g.name}</span>
                <span className="mt-2 flex-1 text-sm text-ink-soft">{g.description}</span>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-plum">
                  Play <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-10">
        <AiPanel title="Reflection prompts for you" request={{ feature: "reflection" }} />
      </div>
      <Dialog open={!!picked} onClose={() => setPicked(null)} title={picked?.name ?? ""} description={picked?.description}>
        <div className="space-y-4">
          <Select label="Who's playing?" value={partner} onChange={(e) => setPartner(e.target.value)} hint={partner ? "They'll get an invitation. Joining is optional." : "Play solo, or pass the phone to someone you're with."}>
            <option value="">Just me (or together in person)</option>
            {matches.data?.map((m) => (
              <option key={m.id} value={m.id}>
                With {m.profile.displayName}
              </option>
            ))}
          </Select>
          <Select label="Number of cards" value={count} onChange={(e) => setCount(e.target.value)}>
            {["5", "8", "10"].map((n) => (
              <option key={n} value={n}>
                {n} cards
              </option>
            ))}
          </Select>
          {error && (
            <p role="alert" className="text-sm text-rose-ink">
              {error}
            </p>
          )}
          <Button className="w-full" size="lg" onClick={start} loading={busy}>
            Start game
          </Button>
        </div>
      </Dialog>
    </AppPage>
  );
}

type SessionView = {
  id: string;
  status: "ACTIVE" | "COMPLETED" | "ENDED";
  game: { name: string; description: string };
  isShared: boolean;
  players: { userId: string; displayName: string; isYou: boolean }[];
  turnUserId: string | null;
  progress: { index: number; total: number };
  question: { id: string; prompt: string; options: string[] | null } | null;
  myAnswer: { answer: string | null; skipped: boolean } | null;
  partnerAnswered: boolean;
  partnerAnswer: { answer: string | null; skipped: boolean } | null;
  recap?: { prompt: string; answer: string | null; skipped: boolean; isYou: boolean }[];
};

export function GameSession() {
  const { id } = useParams();
  const { account } = useAuth();
  const { data, error, loading, reload, setData } = useResource<SessionView>(`/games/sessions/${id}`);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  useSocketEvent<{ sessionId: string }>(
    "game:update",
    useCallback((e) => e.sessionId === id && reload(), [id, reload]),
  );

  const act = async (path: string, body?: object) => {
    setBusy(true);
    try {
      const next = await api.post<SessionView>(`/games/sessions/${id}/${path}`, body);
      setData(next);
      if (next.question?.id !== data?.question?.id) setAnswer("");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Something went wrong.", "error");
    } finally {
      setBusy(false);
    }
  };

  if (loading && !data) return <AppPage><LoadingBlock label="Loading game" /></AppPage>;
  if (error || !data)
    return (
      <AppPage>
        <EmptyState title="This game isn't available" action={<ButtonLink to="/app/games">Back to games</ButtonLink>}>
          It may have ended, or the match may have closed.
        </EmptyState>
      </AppPage>
    );

  const partner = data.players.find((p) => !p.isYou);
  const pct = Math.round((data.progress.index / data.progress.total) * 100);
  const bothDone = !!data.myAnswer && (!data.isShared || data.partnerAnswered);

  return (
    <AppPage>
      <div className="mb-6 flex items-center justify-between">
        <Link to="/app/games" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
          <Icon name="back" className="h-4 w-4" /> Games
        </Link>
        {data.status === "ACTIVE" && (
          <Button variant="quiet" size="sm" onClick={async () => { await act("end"); navigate("/app/games"); }}>
            End game
          </Button>
        )}
      </div>
      <h1 className="text-4xl">{data.game.name}</h1>
      <p className="mt-1 text-ink-soft">{data.isShared ? `With ${partner?.displayName}` : "Solo · reflect, or play together in person"}</p>
      <div className="mt-6" aria-label={`Card ${Math.min(data.progress.index + 1, data.progress.total)} of ${data.progress.total}`}>
        <div className="flex justify-between text-xs font-semibold text-ink-muted">
          <span>
            Card {Math.min(data.progress.index + 1, data.progress.total)} of {data.progress.total}
          </span>
          {data.isShared && data.status === "ACTIVE" && <span>{data.turnUserId === account?.id ? "Your turn to lead" : `${partner?.displayName} leads this one`}</span>}
        </div>
        <div className="mt-2 h-2 rounded-full bg-ivory-deep" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
          <div className="h-full rounded-full bg-plum transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {data.status !== "ACTIVE" || !data.question ? (
        <section className="mt-10 animate-rise">
          <h2 className="text-3xl">{data.status === "ENDED" ? "Game ended" : "That's the last card"}</h2>
          {data.recap && data.recap.length > 0 && (
            <ul className="mt-6 space-y-3">
              {data.recap
                .filter((r) => r.isYou)
                .map((r, i) => (
                  <li key={i} className="rounded-3xl border hairline bg-white/70 p-5">
                    <p className="font-serif text-lg">{r.prompt}</p>
                    <p className="mt-1 text-sm text-ink-soft">{r.skipped ? "Skipped" : r.answer}</p>
                  </li>
                ))}
            </ul>
          )}
          <ButtonLink to="/app/games" className="mt-8">
            Play another
          </ButtonLink>
        </section>
      ) : (
        <section key={data.question.id} className="mt-8 animate-rise">
          <div className="rounded-[2rem] bg-gradient-to-br from-lavender-soft to-rose-soft p-8 shadow-lift sm:p-12">
            <p className="font-serif text-3xl leading-snug sm:text-4xl">{data.question.prompt}</p>
          </div>
          {!data.myAnswer ? (
            <div className="mt-6 space-y-4">
              {data.question.options ? (
                <div role="radiogroup" aria-label="Your answer" className="flex flex-wrap gap-2">
                  {data.question.options.map((o) => (
                    <Chip key={o} role="radio" selected={answer === o} onToggle={() => setAnswer(o)}>
                      {o}
                    </Chip>
                  ))}
                </div>
              ) : (
                <Textarea label="Your answer" optional={false} value={answer} maxLength={500} onChange={(e) => setAnswer(e.target.value)} hint={data.isShared ? "Hidden until you both answer." : undefined} />
              )}
              <div className="flex gap-2">
                <Button onClick={() => act("answer", { answer })} disabled={!answer.trim()} loading={busy}>
                  {data.isShared ? "Lock in answer" : "Answer & next"}
                </Button>
                <Button variant="quiet" onClick={() => act("skip")} disabled={busy}>
                  Skip
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Reveal label="You" a={data.myAnswer} />
              {data.isShared &&
                (data.partnerAnswer ? <Reveal label={partner?.displayName ?? "Partner"} a={data.partnerAnswer} /> : <div className="rounded-3xl border border-dashed border-plum/30 p-5 text-sm text-ink-muted">Waiting for {partner?.displayName}…</div>)}
              {data.isShared && bothDone && (
                <Button className="sm:col-span-2" onClick={() => act("next")} loading={busy}>
                  Next card
                </Button>
              )}
            </div>
          )}
        </section>
      )}
    </AppPage>
  );
}

function Reveal({ label, a }: { label: string; a: { answer: string | null; skipped: boolean } }) {
  return (
    <div className="animate-rise rounded-3xl bg-white p-5 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{label}</p>
      <p className="mt-1 text-lg">{a.skipped ? <span className="italic text-ink-muted">Skipped</span> : a.answer}</p>
    </div>
  );
}

// ---------------- Compatibility ----------------

export function Compatibility() {
  const questions = useResource<Question[]>("/compatibility/questions");
  const method = useResource<{ version: string; weights: Record<string, number>; notes: string[] }>("/compatibility/method");
  const [filter, setFilter] = useState<string>("ALL");
  const list = questions.data ?? [];
  const answered = list.filter((q) => q.myAnswer).length;
  const dims = [...new Set(list.map((q) => q.dimension))];

  return (
    <AppPage>
      <PageHeader title="Compatibility" lede="Optional questions that help us explain what you and others have in common. Answer the ones that matter to you." />
      {method.data && (
        <details className="mb-8 rounded-3xl bg-lavender-soft/70 p-5">
          <summary className="cursor-pointer font-semibold text-plum">How scores work</summary>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-ink-soft">
            {method.data.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-ink-soft">
            Current weights:{" "}
            {Object.entries(method.data.weights)
              .map(([k, v]) => `${DIMENSION_LABEL[k]} ${v}`)
              .join(" · ")}
            . Engine {method.data.version}.
          </p>
        </details>
      )}
      {questions.loading ? (
        <LoadingBlock label="Loading questions" />
      ) : questions.error ? (
        <ErrorState message={questions.error.message} onRetry={questions.reload} />
      ) : (
        <>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-muted">
              {answered} of {list.length} answered
            </p>
            <div className="flex flex-wrap gap-2">
              {["ALL", ...dims].map((d) => (
                <Chip key={d} role="radio" selected={filter === d} onToggle={() => setFilter(d)}>
                  {d === "ALL" ? "All" : DIMENSION_LABEL[d]}
                </Chip>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            {list
              .filter((q) => filter === "ALL" || q.dimension === filter)
              .map((q) => (
                <QuestionCard key={q.id} q={q} onSaved={(nq) => questions.setData((l) => l!.map((x) => (x.id === nq.id ? nq : x)))} />
              ))}
          </div>
        </>
      )}
    </AppPage>
  );
}

// ---------------- Experts ----------------

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
      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
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
