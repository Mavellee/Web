import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { Drawer } from "../ui/Drawer";
import { Icon } from "../ui/Icon";
import { Skeleton } from "../ui/Skeleton";
import { ErrorState } from "../ui/States";
import { useResource } from "../../lib/useResource";
import { cx } from "../../lib/format";
import { deckStyle } from "../../pages/app/games/decks";
import type { CatalogGame } from "./types";

const modeLabel = (g: CatalogGame) => (g.mode === "guess" ? "Take turns guessing" : g.answer === "choice" ? "Pick privately, reveal together" : "Answer privately, reveal together");

/** Compact catalogue: bottom sheet on phones, modal on larger screens. */
export function GameSelectionSheet({ open, onClose, onStart, partnerName, highlight }: { open: boolean; onClose: () => void; onStart: (slug: string) => Promise<boolean>; partnerName: string; highlight?: string | null }) {
  const { data, error, loading, reload } = useResource<CatalogGame[]>(open ? "/games/catalog" : null);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    if (open && highlight) document.getElementById(`game-${highlight}`)?.scrollIntoView({ block: "center" });
  }, [open, highlight, data]);

  return (
    <Drawer open={open} onClose={onClose} title="Play together" description={`Start a game with ${partnerName}. They'll be invited to join here in the chat.`} variant="sheet">
      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-44" />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error.message} onRetry={reload} />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {data?.map((g) => {
              const st = deckStyle(g.category);
              return (
                <li key={g.slug} id={`game-${g.slug}`}>
                  <article className={cx("flex h-full flex-col rounded-3xl border bg-surface p-4 transition", highlight === g.slug ? "border-primary shadow-lift" : "hairline hover:shadow-soft")}>
                    <div className="flex items-start gap-3">
                      <span className={cx("flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl", st.surface, st.ink)}>
                        <Icon name={st.icon} />
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-serif text-lg leading-tight">{g.name}</h3>
                        <p className="mt-0.5 text-xs text-ink-muted">
                          {g.players} players · about {g.minutes} min · {g.rounds} cards
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-ink-soft">{g.description}</p>
                    {g.preview && (
                      <div className="mt-3 rounded-2xl bg-parchment-deep/70 p-3" aria-label="Preview">
                        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink-muted">{modeLabel(g)}</p>
                        <p className="mt-1 font-serif text-[0.95rem] leading-snug">{g.mode === "guess" ? `Guess your match's ${g.preview.prompt}` : g.preview.prompt}</p>
                        {g.preview.options && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {g.preview.options.slice(0, 3).map((o) => (
                              <span key={o} className="rounded-full border hairline bg-surface px-2 py-0.5 text-xs">
                                {o}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <Button
                      size="sm"
                      className="mt-4 w-full"
                      loading={starting === g.slug}
                      disabled={!!starting}
                      onClick={async () => {
                        setStarting(g.slug);
                        const ok = await onStart(g.slug);
                        setStarting(null);
                        if (ok) onClose();
                      }}
                    >
                      Start game
                    </Button>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-4 text-center text-xs text-ink-muted">Games are optional and skippable. Answers stay private until you've both answered.</p>
      </div>
    </Drawer>
  );
}
