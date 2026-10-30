import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppPage, PageHeader } from "../../components/app/PageHeader";
import { DoodleCanvas } from "../../components/couple/DoodleCanvas";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Icon } from "../../components/ui/Icon";
import { LoadingBlock } from "../../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../../components/ui/States";
import { useToast } from "../../components/ui/Toast";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { paintStrokes, type CoupleSpace, type Doodle, type DoodleMeta } from "../../lib/couple";
import { cx } from "../../lib/format";
import { useSocket, useSocketEvent } from "../../lib/socket";
import { useResource } from "../../lib/useResource";
import { deckStyle } from "./games/decks";

function Thumb({ id, active, onOpen }: { id: string; active: boolean; onOpen: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { data } = useResource<Doodle>(`/couple/doodles/${id}`);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (ctx && data) paintStrokes(ctx, data.strokes, 200);
  }, [data]);
  return (
    <button type="button" onClick={onOpen} aria-label="Open doodle" aria-pressed={active} className={cx("overflow-hidden rounded-2xl border bg-paper", active ? "border-primary shadow-soft" : "hairline hover:shadow-soft")}>
      <canvas ref={ref} width={200} height={200} className="block aspect-square w-full" />
    </button>
  );
}

function DoodleStudio({ matchId, me }: { matchId: string; me: string }) {
  const { socket, status } = useSocket();
  const toast = useToast();
  const list = useResource<DoodleMeta[]>("/couple/doodles");
  const [openId, setOpenId] = useState<string | null>(null);
  const [doodle, setDoodle] = useState<Doodle | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fail = useCallback((e: unknown) => toast(e instanceof ApiError ? e.message : "Something went wrong.", "error"), [toast]);

  useSocketEvent("doodle:changed", list.reload);
  const ids = list.data?.map((d) => d.id);
  const shown = openId && ids?.includes(openId) ? openId : (ids?.[0] ?? null);

  const load = useCallback(async () => {
    if (!shown) return setDoodle(null);
    try {
      setDoodle(await api.get<Doodle>(`/couple/doodles/${shown}`));
    } catch (e) {
      fail(e);
    }
  }, [shown, fail]);
  // Rejoin and refetch on every reconnect, so strokes drawn while offline appear.
  useEffect(() => {
    if (status !== "connected") return;
    socket?.emit("couple:join", {});
    void load();
  }, [socket, status, load]);

  const start = async () => {
    try {
      const d = await api.post<Doodle>("/couple/doodles");
      setOpenId(d.id);
      await list.reload();
    } catch (e) {
      fail(e);
    }
  };

  return (
    <section aria-labelledby="doodle-heading">
      <div className="flex items-center justify-between gap-3">
        <h2 id="doodle-heading" className="text-2xl">Doodle together</h2>
        <Button size="sm" variant="secondary" onClick={() => void start()}>
          <Icon name="plus" className="h-4 w-4" />
          New doodle
        </Button>
      </div>
      <p className="mt-1 text-sm text-ink-muted">Draw at the same time and watch each other's lines appear. Everything saves on its own.</p>
      <div className="mt-4">
        {doodle ? (
          <>
            {/* Short enough that the canvas and its tools fit on screen together. */}
            <div className="mx-auto max-w-[min(100%,calc(100dvh-14rem))]">
              <DoodleCanvas doodle={doodle} matchId={matchId} me={me} />
              <div className="mt-2 text-right">
                <Button size="sm" variant="quiet" onClick={() => setConfirmDelete(true)}>
                  Delete this doodle
                </Button>
              </div>
            </div>
          </>
        ) : list.data && !list.data.length ? (
          <EmptyState title="A blank page, just for you two" action={<Button onClick={() => void start()}>Start your first doodle</Button>}>
            Only the two of you can see what you draw here.
          </EmptyState>
        ) : (
          <LoadingBlock label="Loading doodles" />
        )}
      </div>
      {ids && ids.length > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {ids.map((id) => (
            <Thumb key={id} id={id} active={id === shown} onOpen={() => setOpenId(id)} />
          ))}
        </div>
      )}
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        danger
        title="Delete this doodle?"
        body="It disappears for both of you and can't be brought back."
        confirmLabel="Delete"
        onConfirm={async () => {
          try {
            await api.delete(`/couple/doodles/${shown}`);
            await list.reload();
          } catch (e) {
            fail(e);
          }
          setConfirmDelete(false);
        }}
      />
    </section>
  );
}

function CoupleGames({ space }: { space: CoupleSpace }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [starting, setStarting] = useState<string | null>(null);
  const start = async (slug: string) => {
    setStarting(slug);
    try {
      await api.post(`/conversations/${space.conversationId}/games`, { gameSlug: slug });
      navigate(`/app/messages/${space.conversationId}`);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Couldn't start that game.", "error");
    } finally {
      setStarting(null);
    }
  };
  return (
    <section aria-labelledby="couple-games-heading">
      <h2 id="couple-games-heading" className="text-2xl">Games for two</h2>
      <p className="mt-1 text-sm text-ink-muted">These decks are only for couples. They play out in your chat, and {space.partner.displayName} can join when they're ready.</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {space.games.map((g) => {
          const st = deckStyle(g.category);
          return (
            <li key={g.slug}>
              <Card className="flex h-full flex-col p-4">
                <span className={cx("flex h-10 w-10 items-center justify-center rounded-2xl", st.surface, st.ink)}>
                  <Icon name={st.icon} />
                </span>
                <h3 className="mt-3 font-serif text-lg leading-tight">{g.name}</h3>
                <p className="mt-1 flex-1 text-sm text-ink-soft">{g.description}</p>
                <p className="mt-2 text-xs text-ink-muted">About {g.minutes} min · {g.rounds} cards</p>
                <Button size="sm" className="mt-3" loading={starting === g.slug} disabled={!space.conversationId || !!starting} onClick={() => void start(g.slug)}>
                  Play
                </Button>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Shown to anyone without an open space, including right after one closes. */
function Closed() {
  const settings = useResource<{ discoveryPaused: boolean }>("/settings");
  const toast = useToast();
  const resume = async () => {
    try {
      await api.post("/settings/discovery", { paused: false });
      settings.setData({ discoveryPaused: false });
      toast("You're back in Discover");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Couldn't save.", "error");
    }
  };
  return (
    <EmptyState
      title="This space opens when you're both in"
      action={
        <div className="flex flex-col gap-2 sm:flex-row">
          <ButtonLink to="/app/matches">Go to matches</ButtonLink>
          {settings.data?.discoveryPaused && (
            <Button variant="secondary" onClick={() => void resume()}>
              Show me in Discover
            </Button>
          )}
        </div>
      }
    >
      When you and a match are in a relationship, tap “We're together” in your chat. Once they confirm, you'll have doodling and couple games here.
      {settings.data?.discoveryPaused && " You're currently hidden from Discover."}
    </EmptyState>
  );
}

export function Us() {
  const { account } = useAuth();
  const toast = useToast();
  const { data, error, loading, reload } = useResource<CoupleSpace | null>("/couple/me");
  const [ending, setEnding] = useState(false);
  useSocketEvent("couple:update", reload);

  if (loading && !data)
    return (
      <AppPage>
        <LoadingBlock label="Loading your space" />
      </AppPage>
    );
  if (error)
    return (
      <AppPage>
        <ErrorState message={error.message} onRetry={reload} />
      </AppPage>
    );
  if (!data)
    return (
      <AppPage>
        <Closed />
      </AppPage>
    );
  const since = new Date(data.startedAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  return (
    <AppPage>
      <PageHeader title={`You & ${data.partner.displayName}`} lede={`Together on Knot since ${since}.`} />
      <div className="space-y-10">
        <DoodleStudio matchId={data.matchId} me={account!.id} />
        <CoupleGames space={data} />
        <div className="border-t hairline pt-5 text-center">
          <Button variant="quiet" onClick={() => setEnding(true)}>
            End our relationship status
          </Button>
        </div>
      </div>
      <ConfirmDialog
        open={ending}
        onClose={() => setEnding(false)}
        danger
        title="End this?"
        body={`This closes your couple space for you both straight away. ${data.partner.displayName} doesn't need to approve it. Your chat stays open, and you'll both stay hidden from Discover until each of you chooses to come back.`}
        confirmLabel="End it"
        onConfirm={async () => {
          try {
            await api.post(`/couple/matches/${data.matchId}/end`);
            window.dispatchEvent(new Event("knot:couple"));
            await reload();
          } catch (e) {
            toast(e instanceof ApiError ? e.message : "Something went wrong.", "error");
          }
          setEnding(false);
        }}
      />
    </AppPage>
  );
}
