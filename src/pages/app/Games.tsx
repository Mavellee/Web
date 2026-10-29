import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppPage, PageHeader } from "../../components/app/PageHeader";
import { AiPanel } from "../../components/app/AiPanel";
import { Button } from "../../components/ui/Button";
import { Chip } from "../../components/ui/Chip";
import { Dialog } from "../../components/ui/Dialog";
import { Icon } from "../../components/ui/Icon";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/States";
import { api, ApiError } from "../../lib/api";
import { useResource } from "../../lib/useResource";
import { cx } from "../../lib/format";
import { deckStyle } from "./games/decks";

type Game = { slug: string; name: string; description: string; category: string; questionCount: number };
type ActiveSession = { id: string; game: { name: string; category: string }; progress: { current: number; total: number }; withName: string | null; isShared: boolean };
type MatchLite = { id: string; conversationId: string | null; profile: { displayName: string } };

export function Games() {
  const games = useResource<Game[]>("/games");
  const sessions = useResource<ActiveSession[]>("/games/sessions");
  const matches = useResource<MatchLite[]>("/matches");
  const [picked, setPicked] = useState<Game | null>(null);
  const [count, setCount] = useState(8);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const start = async () => {
    if (!picked) return;
    setBusy(true);
    setError(null);
    try {
      const s = await api.post<{ id: string }>("/games/sessions", { gameSlug: picked.slug, questionCount: count });
      navigate(`/app/games/${s.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't start the game.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppPage wide>
      <PageHeader title="Games" lede="Curated question decks. Play with a match right inside your conversation, or on your own here to reflect. Skip anything, any time." />

      {!!sessions.data?.length && (
        <section aria-labelledby="in-progress" className="mb-12">
          <h2 id="in-progress" className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
            Continue playing
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.data.map((s) => {
              const st = deckStyle(s.game.category);
              return (
                <li key={s.id}>
                  <Link to={`/app/games/${s.id}`} className="flex items-center gap-4 rounded-3xl border hairline bg-white p-4 transition hover:shadow-soft">
                    <span className={cx("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", st.surface, st.ink)}>
                      <Icon name={st.icon} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{s.game.name}</span>
                      <span className="text-sm text-ink-muted">
                        Solo · {s.progress.current}/{s.progress.total}
                      </span>
                    </span>
                    <Icon name="arrow" className="h-5 w-5 text-plum" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <h2 className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">Choose a deck</h2>
      {games.loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-56 rounded-[1.75rem]" />
          ))}
        </div>
      ) : games.error ? (
        <ErrorState message={games.error.message} onRetry={games.reload} />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {games.data?.map((g) => {
            const st = deckStyle(g.category);
            return (
              <li key={g.slug}>
                <button type="button" onClick={() => setPicked(g)} className={cx("group relative flex h-full min-h-56 w-full flex-col overflow-hidden rounded-[1.75rem] p-6 text-left transition duration-300 hover:-translate-y-1 hover:shadow-lift", st.surface, st.ink)}>
                  {/* Stacked-card edge hints that it's a deck. */}
                  <span aria-hidden="true" className="absolute -right-6 -top-6 h-24 w-24 rounded-3xl border-2 border-current opacity-10 transition group-hover:rotate-6" />
                  <span className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] opacity-80">
                    {st.mood}
                    <span>{g.questionCount} cards</span>
                  </span>
                  <span className="mt-8 font-serif text-2xl leading-tight">{g.name}</span>
                  <span className="mt-2 flex-1 text-sm opacity-85">{g.description}</span>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold">
                    Set up a game <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-12 max-w-2xl">
        <AiPanel title="Reflection prompts for you" request={{ feature: "reflection" }} />
      </div>

      <Dialog open={!!picked} onClose={() => setPicked(null)} title={picked?.name ?? ""} description={picked?.description}>
        <div className="space-y-5">
          {matches.data && matches.data.filter((m) => m.conversationId).length > 0 && (
            <section aria-labelledby="play-with">
              <h3 id="play-with" className="font-sans text-sm font-semibold">
                Play with a match
              </h3>
              <p className="text-xs text-ink-muted">Opens your conversation — you'll play together right in the chat.</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {matches.data
                  .filter((m) => m.conversationId)
                  .map((m) => (
                    <li key={m.id}>
                      <Button size="sm" variant="secondary" onClick={() => navigate(`/app/messages/${m.conversationId}?play=${picked?.slug}`)}>
                        With {m.profile.displayName}
                      </Button>
                    </li>
                  ))}
              </ul>
            </section>
          )}
          <div className="border-t hairline pt-4">
            <h3 className="font-sans text-sm font-semibold">Or play solo</h3>
            <p className="text-xs text-ink-muted">Reflect on your own, or pass the phone to someone you're with.</p>
          </div>
          <fieldset>
            <legend className="text-sm font-semibold">How many cards?</legend>
            <div role="radiogroup" className="mt-3 flex gap-2">
              {[5, 8, 10].map((n) => (
                <Chip key={n} role="radio" selected={count === n} onToggle={() => setCount(n)}>
                  {n} cards
                </Chip>
              ))}
            </div>
          </fieldset>
          {error && (
            <p role="alert" className="text-sm text-rose-ink">
              {error}
            </p>
          )}
          <Button className="w-full" size="lg" variant="secondary" onClick={start} loading={busy}>
            Start solo game
          </Button>
        </div>
      </Dialog>
    </AppPage>
  );
}
