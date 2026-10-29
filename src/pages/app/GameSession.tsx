import { useCallback, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppPage } from "../../components/app/PageHeader";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Chip } from "../../components/ui/Chip";
import { Textarea } from "../../components/ui/Field";
import { Icon } from "../../components/ui/Icon";
import { LoadingBlock } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/States";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useSocketEvent } from "../../lib/socket";
import { useResource } from "../../lib/useResource";
import { cx } from "../../lib/format";
import { deckStyle } from "./games/decks";

type Answer = { answer: string | null; skipped: boolean };
type SessionView = {
  id: string;
  status: "ACTIVE" | "COMPLETED" | "ENDED";
  game: { name: string; description: string; category: string };
  isShared: boolean;
  players: { userId: string; displayName: string; isYou: boolean }[];
  turnUserId: string | null;
  progress: { index: number; total: number };
  question: { id: string; prompt: string; options: string[] | null } | null;
  myAnswer: Answer | null;
  partnerAnswered: boolean;
  partnerAnswer: Answer | null;
  recap?: { prompt: string; answer: string | null; skipped: boolean; isYou: boolean }[];
};

export function GameSession() {
  const { id } = useParams();
  const { account } = useAuth();
  const { data, error, loading, reload, setData } = useResource<SessionView>(`/games/sessions/${id}`);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  // The other player's moves arrive in real time.
  useSocketEvent<{ sessionId: string }>(
    "game:update",
    useCallback((e) => e.sessionId === id && reload(), [id, reload]),
  );

  const act = async (path: string, body?: object) => {
    setBusy(path);
    try {
      const next = await api.post<SessionView>(`/games/sessions/${id}/${path}`, body);
      if (next.question?.id !== data?.question?.id) setAnswer("");
      setData(next);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Something went wrong.", "error");
    } finally {
      setBusy(null);
    }
  };

  if (loading && !data)
    return (
      <AppPage>
        <LoadingBlock label="Loading game" />
      </AppPage>
    );
  if (error || !data)
    return (
      <AppPage>
        <EmptyState title="This game isn't available" action={<ButtonLink to="/app/games">Back to games</ButtonLink>}>
          It may have ended, or the match may have closed.
        </EmptyState>
      </AppPage>
    );

  const st = deckStyle(data.game.category);
  const partner = data.players.find((p) => !p.isYou);
  const finished = data.status !== "ACTIVE" || !data.question;
  const bothDone = !!data.myAnswer && (!data.isShared || data.partnerAnswered);

  return (
    <AppPage>
      <div className="mb-8 flex items-center justify-between">
        <Link to="/app/games" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
          <Icon name="back" className="h-4 w-4" /> All games
        </Link>
        {data.status === "ACTIVE" && (
          <Button variant="quiet" size="sm" onClick={() => setConfirmEnd(true)}>
            End game
          </Button>
        )}
      </div>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{data.isShared ? `With ${partner?.displayName}` : "Solo · reflect, or play together in person"}</p>
          <h1 className="mt-2 text-4xl">{data.game.name}</h1>
        </div>
        {data.isShared && !finished && (
          <p className="rounded-full bg-white px-3 py-1.5 text-sm shadow-soft">{data.turnUserId === account?.id ? "You lead this card" : `${partner?.displayName} leads this card`}</p>
        )}
      </header>

      {/* Segmented progress: one segment per card. */}
      <ol className="mt-6 flex gap-1.5" aria-label={`Card ${Math.min(data.progress.index + 1, data.progress.total)} of ${data.progress.total}`}>
        {Array.from({ length: data.progress.total }, (_, i) => (
          <li key={i} className={cx("h-1.5 flex-1 rounded-full transition-colors duration-500", i < data.progress.index ? "bg-plum" : i === data.progress.index && !finished ? "bg-plum-300" : "bg-ivory-deep")} />
        ))}
      </ol>

      {finished ? (
        <section className="mt-12 animate-rise">
          <h2 className="text-3xl">{data.status === "ENDED" ? "Game ended" : "That's the whole deck"}</h2>
          <p className="mt-2 text-ink-soft">{data.status === "ENDED" ? "You can start a new game any time." : "Here's what you said along the way."}</p>
          {!!data.recap?.length && (
            <ol className="mt-6 space-y-3">
              {data.recap
                .filter((r) => r.isYou)
                .map((r, i) => (
                  <li key={i} className="rounded-3xl border hairline bg-white p-5">
                    <p className="font-serif text-lg">{r.prompt}</p>
                    <p className="mt-1 text-sm text-ink-soft">{r.skipped ? <em>Skipped</em> : r.answer}</p>
                  </li>
                ))}
            </ol>
          )}
          <ButtonLink to="/app/games" className="mt-8">
            Choose another deck
          </ButtonLink>
        </section>
      ) : (
        <section key={data.question!.id} className="mt-10 animate-rise">
          <div className="relative">
            <div aria-hidden="true" className={cx("absolute inset-x-6 -bottom-3 h-full rounded-[2rem] opacity-40", st.surface)} />
            <div className={cx("relative rounded-[2rem] p-8 shadow-lift sm:p-12", st.surface, st.ink)}>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] opacity-80">
                <Icon name={st.icon} className="h-4 w-4" /> Card {data.progress.index + 1}
              </p>
              <p className="mt-6 font-serif text-3xl leading-snug sm:text-4xl">{data.question!.prompt}</p>
            </div>
          </div>

          {!data.myAnswer ? (
            <div className="mt-10 space-y-5">
              {data.question!.options ? (
                <div role="radiogroup" aria-label="Your answer" className="flex flex-wrap gap-2">
                  {data.question!.options.map((o) => (
                    <Chip key={o} role="radio" selected={answer === o} onToggle={() => setAnswer(o)}>
                      {o}
                    </Chip>
                  ))}
                </div>
              ) : (
                <Textarea label="Your answer" value={answer} maxLength={500} onChange={(e) => setAnswer(e.target.value)} hint={data.isShared ? `Hidden from ${partner?.displayName} until you've both answered.` : undefined} />
              )}
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => act("answer", { answer })} disabled={!answer.trim()} loading={busy === "answer"}>
                  {data.isShared ? "Lock in my answer" : "Answer & next card"}
                </Button>
                <Button variant="quiet" onClick={() => act("skip")} disabled={!!busy}>
                  Skip this card
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-10 grid gap-3 sm:grid-cols-2" aria-live="polite">
              <Reveal label="You" a={data.myAnswer} />
              {data.isShared &&
                (data.partnerAnswer ? (
                  <Reveal label={partner?.displayName ?? "Partner"} a={data.partnerAnswer} />
                ) : (
                  <div className="flex items-center gap-3 rounded-3xl border border-dashed border-plum/30 p-5 text-sm text-ink-muted">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-plum-300" aria-hidden="true" /> Waiting for {partner?.displayName} to answer…
                  </div>
                ))}
              {data.isShared && bothDone && (
                <Button className="sm:col-span-2" onClick={() => act("next")} loading={busy === "next"}>
                  Next card
                </Button>
              )}
            </div>
          )}
        </section>
      )}

      <ConfirmDialog
        open={confirmEnd}
        onClose={() => setConfirmEnd(false)}
        title="End this game?"
        body={data.isShared ? `${partner?.displayName ?? "Your match"} will see that the game has ended.` : "Your answers so far are kept in the recap."}
        confirmLabel="End game"
        onConfirm={async () => {
          await api.post(`/games/sessions/${id}/end`);
          navigate("/app/games");
        }}
      />
    </AppPage>
  );
}

function Reveal({ label, a }: { label: string; a: Answer }) {
  return (
    <div className="animate-rise rounded-3xl border hairline bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">{label}</p>
      <p className="mt-2 text-lg">{a.skipped ? <em className="text-ink-muted">Skipped</em> : a.answer}</p>
    </div>
  );
}
