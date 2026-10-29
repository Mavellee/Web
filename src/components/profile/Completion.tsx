import { Icon } from "../ui/Icon";
import { cx } from "../../lib/format";
import type { OwnProfile } from "../../lib/types";

export interface CompletionItem {
  key: string;
  label: string;
  done: boolean;
  tab: string;
}

/** Completion is derived only from what is actually saved on the server. */
export function completionItems(p: OwnProfile, answeredQuestions: number | null): CompletionItem[] {
  const items: CompletionItem[] = [
    { key: "photo", label: "Add a photo", done: p.photos.length > 0, tab: "photos" },
    { key: "photos3", label: "Add at least three photos", done: p.photos.length >= 3, tab: "photos" },
    { key: "prompts", label: "Answer two prompts in your own words", done: (p.prompts?.length ?? 0) >= 2, tab: "words" },
    { key: "interests", label: "Choose three or more of the little things", done: p.interests.length >= 3, tab: "little" },
    { key: "languages", label: "Add the languages you speak", done: p.languages.length > 0, tab: "details" },
    { key: "city", label: "Set your city", done: !!p.city || p.hasApproxLocation, tab: "details" },
    { key: "intentions", label: "Choose your intentions", done: p.intentions.length > 0, tab: "intentions" },
  ];
  if (answeredQuestions !== null) items.push({ key: "questions", label: "Answer three compatibility questions", done: answeredQuestions >= 3, tab: "compatibility" });
  return items;
}

export function CompletionMeter({ items, onGo }: { items: CompletionItem[]; onGo: (tab: string) => void }) {
  const done = items.filter((i) => i.done).length;
  const pct = Math.round((done / items.length) * 100);
  const todo = items.filter((i) => !i.done);
  return (
    <section aria-labelledby="completion-title" className="rounded-3xl border hairline bg-white/80 p-5">
      <div className="flex items-baseline justify-between">
        <h2 id="completion-title" className="font-sans text-sm font-semibold">
          Profile completeness
        </h2>
        <span className="font-serif text-2xl text-plum">{pct}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-ivory-deep" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completeness">
        <div className="h-full rounded-full bg-sage-ink transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      {todo.length ? (
        <ul className="mt-4 space-y-1">
          {todo.map((i) => (
            <li key={i.key}>
              <button type="button" onClick={() => onGo(i.tab)} className="flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-left text-sm text-ink-soft transition hover:bg-ink/5 hover:text-ink">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />
                  {i.label}
                </span>
                <Icon name="arrow" className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={cx("mt-3 text-sm text-sage-ink")}>Your profile is complete. Nice.</p>
      )}
    </section>
  );
}
