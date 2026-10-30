import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AstroConsentForm } from "../../components/astro/AstroConsentForm";
import { Constellation, TwoCharts } from "../../components/astro/Celestial";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { LoadingBlock } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/States";
import { useToast } from "../../components/ui/Toast";
import { api, ApiError } from "../../lib/api";
import type { AstroReport, AstroState, AstroStatus, ChartSummary } from "../../lib/astro";
import { useSocketEvent } from "../../lib/socket";
import { useResource } from "../../lib/useResource";

const WORKING: Partial<Record<AstroStatus, string>> = {
  CALCULATING: "Calculating both charts from your birth details.",
  INTERPRETING: "Your charts are calculated. Writing your reading.",
};

/** The whole Knot Astro journey for one match. Every state comes from the server, so a refresh resumes correctly. */
export function KnotAstro() {
  const { matchId = "" } = useParams();
  const { data: state, setData, reload, error, loading } = useResource<AstroState>(`/astro/matches/${matchId}`);
  const profile = useResource<{ dateOfBirth: string | null }>("/profiles/me");
  useSocketEvent<{ matchId: string }>(
    "astro:update",
    useCallback((e) => {
      if (e.matchId === matchId) void reload();
    }, [matchId, reload]),
  );
  const [acting, setActing] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const act = async (path: string) => {
    setActing(true);
    try {
      const next = await api.post<AstroState>(`/astro/matches/${matchId}/${path}`);
      setData(next);
      return next;
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "That didn't go through. Please try again.", "error");
    } finally {
      setActing(false);
    }
  };

  if (loading && !state) return <LoadingBlock label="Loading Knot Astro" />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (!state) return null;
  const chat = state.available && state.conversationId ? `/app/messages/${state.conversationId}` : "/app/messages";
  const toChat = (
    <ButtonLink to={chat} variant="secondary">
      Go to your chat
    </ButtonLink>
  );

  if (!state.available)
    return (
      <Frame>
        <h1 className="text-4xl">Knot Astro isn't part of this match.</h1>
        <p className="mt-3 text-ink-soft">It's offered when both people are looking for a long-term relationship or marriage. Your match and chat work exactly the same.</p>
        <div className="mt-6">
          <ButtonLink to="/app/messages">Go to your messages</ButtonLink>
        </div>
      </Frame>
    );

  if (state.hasReport && state.myState === "CONSENTED" && state.theirState === "CONSENTED" && !WORKING[state.status]) return <Report matchId={matchId} state={state} onRetry={() => act("retry")} onWithdrawn={() => void reload()} acting={acting} />;

  const working = WORKING[state.status];
  if (working || (state.status === "FAILED" && state.myState === "CONSENTED"))
    return (
      <Frame>
        <TwoCharts busy={!!working} />
        <h1 className="mt-6 text-center text-4xl">{working ? "Your charts are being explored…" : "We couldn't finish the calculation."}</h1>
        <p role="status" className="mt-3 text-center text-ink-soft">
          {working ?? "Your match and chat aren't affected. You can try again whenever you like."}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
          {!working && state.canRetry && (
            <Button loading={acting} onClick={() => void act("retry")}>
              Try again
            </Button>
          )}
          {toChat}
        </div>
        {working && <p className="mt-4 text-center text-sm text-ink-muted">You don't need to wait here. Start talking, and we'll let you know when it's ready.</p>}
      </Frame>
    );

  if (!state.eligible)
    return (
      <Frame>
        <h1 className="text-4xl">Knot Astro isn't available right now.</h1>
        <p className="mt-3 text-ink-soft">It needs both people to be looking for a long-term relationship or marriage.</p>
        <div className="mt-6">{toChat}</div>
      </Frame>
    );

  if (!state.configured)
    return (
      <Frame>
        <h1 className="text-4xl">Knot Astro isn't available right now.</h1>
        <p className="mt-3 text-ink-soft">Your match and chat aren't affected.</p>
        <div className="mt-6">{toChat}</div>
      </Frame>
    );

  if (state.theirState === "NOT_PARTICIPATING" && state.myState !== "DECLINED")
    return (
      <Frame>
        <h1 className="text-4xl">Your conversation is the reading.</h1>
        <p className="mt-3 text-ink-soft">Knot Astro isn't going ahead for this match. That says nothing about the two of you, and your chat is open.</p>
        <div className="mt-6">
          <ButtonLink to={chat}>Start Your Conversation</ButtonLink>
        </div>
      </Frame>
    );

  if (state.myState === "CONSENTED")
    return (
      <Frame>
        <TwoCharts />
        <h1 className="mt-6 text-center text-4xl">Yours is in.</h1>
        <p className="mt-3 text-center text-ink-soft">We'll explore your charts if your match decides to join. There's no rush, and no pressure on either of you.</p>
        <div className="mt-8 flex justify-center">{toChat}</div>
      </Frame>
    );

  if (state.myState === "INTERESTED")
    return (
      <Frame>
        <h1 className="text-4xl">Your birth details</h1>
        <p className="mt-3 mb-8 text-ink-soft">Only you see this form.</p>
        <AstroConsentForm matchId={matchId} hasSaved={state.hasSavedBirth} defaultDate={profile.data?.dateOfBirth?.slice(0, 10)} onDone={setData} />
      </Frame>
    );

  return (
    <Frame>
      <TwoCharts />
      <p className="eyebrow mt-6 justify-center text-center">Knot Astro</p>
      <h1 className="mt-3 text-center text-4xl sm:text-5xl">You've found a connection. Shall we discover what the stars say?</h1>
      <p className="mt-4 text-center text-lg text-ink-soft">{state.theirState === "INTERESTED" || state.theirState === "CONSENTED" ? "Your match would like to explore this with you. " : ""}It's optional, and it never affects your match or your chat.</p>
      <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
        <Button size="lg" loading={acting} onClick={() => void act("opt-in")}>
          Explore Our Compatibility
        </Button>
        <Button
          size="lg"
          variant="secondary"
          disabled={acting}
          onClick={async () => {
            await act("decline");
            navigate(chat);
          }}
        >
          Skip and Start Chatting
        </Button>
      </div>
    </Frame>
  );
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="px-4 py-6 sm:py-10">
      <div className="relative mx-auto max-w-2xl overflow-hidden rounded-[2.5rem] border hairline bg-surface/70 px-5 py-10 sm:px-10 sm:py-14">
        <Constellation />
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}

function Report({ matchId, state, onRetry, onWithdrawn, acting }: { matchId: string; state: Extract<AstroState, { available: true }>; onRetry: () => void; onWithdrawn: () => void; acting: boolean }) {
  const { data: r, error, reload, loading } = useResource<AstroReport>(`/astro/matches/${matchId}/report`);
  const toast = useToast();
  useEffect(() => void reload(), [state.status, reload]);
  if (loading && !r) return <LoadingBlock label="Loading your report" />;
  if (error || !r) return <ErrorState message={error?.message ?? "This report isn't available."} onRetry={reload} />;
  const i = r.interpretation;
  const chat = r.conversationId ? `/app/messages/${r.conversationId}` : "/app/messages";
  const withdraw = async () => {
    if (!window.confirm("Remove this report for both of you? Your match and chat stay as they are.")) return;
    try {
      await api.post(`/astro/matches/${matchId}/withdraw`);
      onWithdrawn();
    } catch {
      toast("That didn't go through. Please try again.", "error");
    }
  };
  const missing = [...r.me.unavailable.map((u) => ({ who: r.me.name, ...u })), ...r.them.unavailable.map((u) => ({ who: r.them.name, ...u }))];

  return (
    <article className="mx-auto max-w-3xl space-y-10 px-4 py-6 sm:py-10">
      <header className="relative overflow-hidden rounded-[2.5rem] bg-primary-800 px-6 py-12 text-center text-surface sm:px-12">
        <Constellation className="!text-gold/50" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Knot Astro</p>
          <h1 className="mt-3 text-4xl text-surface sm:text-5xl">Your Cosmic Connection</h1>
          <p className="mt-3 font-serif text-xl text-surface/85">
            {r.me.name} &amp; {r.them.name}
          </p>
          {i && <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-surface/85">{i.overview}</p>}
        </div>
      </header>

      <section aria-labelledby="charts">
        <h2 id="charts" className="text-3xl">
          Your charts
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <ChartCard c={r.me} note={i ? (r.interpretationMine === "personA" ? i.chartInsights.personA : i.chartInsights.personB) : null} />
          <ChartCard c={r.them} note={i ? (r.interpretationMine === "personA" ? i.chartInsights.personB : i.chartInsights.personA) : null} />
        </div>
      </section>

      {!i && (
        <section className="rounded-3xl border hairline bg-surface/80 p-6">
          <h2 className="text-2xl">Your written reading isn't here</h2>
          <p className="mt-2 text-ink-soft">{r.failure === "NO_CONSENT" ? "An AI reading needs both of you to agree, so this report shows the calculated results only." : r.failure === "NOT_CONFIGURED" ? "AI readings aren't switched on yet, so this report shows the calculated results only." : r.failure === "OVER_BUDGET" ? "We've reached our limit for AI readings for now. The calculated results are all here." : "We couldn't write it this time. The calculated results are all here, and nothing about your match or chat has changed."}</p>
          {state.canRetry && (
            <Button className="mt-4" variant="secondary" loading={acting} onClick={onRetry}>
              Try the reading again
            </Button>
          )}
        </section>
      )}

      {i && (
        <>
          <Prose title="Emotional connection">{i.emotionalConnection}</Prose>
          <Prose title="Communication styles">{i.communication}</Prose>
          <Prose title="Attraction and relationship themes">{i.attraction}</Prose>
        </>
      )}

      <section aria-labelledby="dimensions">
        <h2 id="dimensions" className="text-3xl">
          Compatibility dimensions
        </h2>
        {r.themes.length > 0 && (
          <ul className="mt-4 space-y-2">
            {r.themes.map((t) => (
              <li key={t} className="flex gap-2.5 text-ink-soft">
                <Icon name="spark" className="mt-1 h-4 w-4 shrink-0 text-gold-ink" />
                {t}
              </li>
            ))}
          </ul>
        )}
        {i && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <ListCard title="Potential harmony" items={i.harmony} />
            <ListCard title="Differences worth understanding" items={i.differences} />
          </div>
        )}
        {r.guna ? (
          <div className="mt-6 rounded-3xl border hairline bg-surface/80 p-6">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-2xl">Guna Milan</h3>
              <p className="font-serif text-2xl text-primary">
                {r.guna.total} <span className="text-base text-ink-muted">of {r.guna.max}</span>
              </p>
            </div>
            <ul className="mt-4 divide-y hairline text-sm">
              {r.guna.kootas.map((k) => (
                <li key={k.key} className="flex items-center justify-between gap-4 py-2.5">
                  <span>
                    <span className="font-semibold">{k.label}</span> <span className="text-ink-muted">· {k.meaning}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-ink-soft">
                    {k.score} / {k.max}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-ink-muted">Calculated with the eight-koota (Ashtakoota) North Indian method from your Moon placements. Schools differ on some tables. This is an astrological tradition, not a scientific assessment of a relationship, and nothing on Knot depends on it.</p>
          </div>
        ) : (
          <p className="mt-6 rounded-3xl bg-surface/80 p-5 text-sm text-ink-soft">{r.gunaUnavailableReason}</p>
        )}
        {missing.length > 0 && (
          <div className="mt-6 text-sm text-ink-muted">
            <p className="font-semibold text-ink-soft">What this report leaves out</p>
            <ul className="mt-1 space-y-1">
              {missing.map((m) => (
                <li key={m.who + m.field}>
                  {m.who}: {m.field}. {m.reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {i && (
        <>
          <Prose title="Your story so far">{i.narrative}</Prose>
          <ListCard title="Something to reflect on" items={i.reflectionPrompts} />
          <section aria-labelledby="starters">
            <h2 id="starters" className="text-3xl">
              Questions to explore together
            </h2>
            <p className="mt-1 text-sm text-ink-muted">Nothing is sent until you choose to send it.</p>
            <ul className="mt-4 space-y-3">
              {i.starters.map((q) => (
                <li key={q} className="flex flex-col gap-3 rounded-3xl border hairline bg-surface/80 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-serif text-lg leading-snug">{q}</p>
                  <Link to={chat} state={{ draft: q }} className="shrink-0 text-sm font-semibold text-primary">
                    Use in chat
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <footer className="space-y-4 border-t hairline pt-8 text-center">
        <ButtonLink to={chat} size="lg">
          Start Your Conversation
        </ButtonLink>
        <p className="text-xs text-ink-muted">
          Astrology is a reflective tradition, not evidence of what will happen. The two of you decide where this goes.
          {r.model && " Reading written by AI from your calculated charts."} Method {r.version}.
        </p>
        <button type="button" onClick={withdraw} className="text-sm font-semibold text-ink-soft underline">
          Withdraw and remove this report
        </button>
      </footer>
    </article>
  );
}

function ChartCard({ c, note }: { c: ChartSummary; note: string | null }) {
  const rows: [string, string | null][] = [
    ["Sun sign", c.sun],
    ["Moon sign", c.moon],
    ["Nakshatra", c.nakshatra && (c.pada ? `${c.nakshatra}, pada ${c.pada}` : c.nakshatra)],
    ["Rising sign", c.lagna],
  ];
  return (
    <div className="rounded-3xl border hairline bg-surface/80 p-5">
      <h3 className="text-2xl">{c.name}</h3>
      <dl className="mt-3 space-y-1.5 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <dt className="text-ink-muted">{k}</dt>
            <dd className={v ? "font-semibold" : "text-ink-muted"}>{v ?? "Not available"}</dd>
          </div>
        ))}
      </dl>
      {note && <p className="mt-4 border-t hairline pt-4 text-sm leading-relaxed text-ink-soft">{note}</p>}
    </div>
  );
}

const Prose = ({ title, children }: { title: string; children: ReactNode }) => (
  <section>
    <h2 className="text-3xl">{title}</h2>
    <p className="mt-3 text-lg leading-relaxed text-ink-soft">{children}</p>
  </section>
);

const ListCard = ({ title, items }: { title: string; items: string[] }) => (
  <div className="rounded-3xl border hairline bg-surface/80 p-5">
    <h3 className="font-sans text-sm font-semibold">{title}</h3>
    <ul className="mt-2 space-y-2 text-sm leading-relaxed text-ink-soft">
      {items.map((x) => (
        <li key={x}>{x}</li>
      ))}
    </ul>
  </div>
);
