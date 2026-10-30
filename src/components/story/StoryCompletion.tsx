import { Icon } from "../ui/Icon";
import { cx } from "../../lib/format";
import type { OwnProfile } from "../../lib/types";

export type StoryStep = "intro" | "photos" | "words" | "little" | "connection";

/** What others can actually see: only approved media counts, and nothing private is included. */
export function storyItems(p: OwnProfile): { key: string; label: string; done: boolean; step: StoryStep; tip: string }[] {
  const photos = p.photos.filter((m) => m.status === "APPROVED").length;
  return [
    { key: "intro", label: "Introduction", done: !!p.displayName && !!p.gender && p.interestedIn.length > 0, step: "intro", tip: "Say hello: your name is the first thing people see." },
    { key: "photo", label: "Main photo added", done: photos > 0, step: "photos", tip: "Add a clear photo of you. You'll need one before you publish." },
    { key: "more", label: "More photos or videos", done: p.media.filter((m) => m.status === "APPROVED").length >= 3, step: "photos", tip: "Two more moments would give people a better feel for your world." },
    { key: "prompts", label: "Prompts answered", done: p.prompts.length >= 2, step: "words", tip: p.prompts.length ? "Adding one more prompt could help someone start a conversation with you." : "Answer a prompt: it's often what people respond to first." },
    { key: "interests", label: "Interests chosen", done: p.interests.length >= 3, step: "little", tip: "A few interests make it easy to spot what you have in common." },
    { key: "intent", label: "Kind of connection", done: p.intentions.length > 0, step: "connection", tip: "Share what you're open to, so you meet people who want the same." },
  ];
}

export function StoryCompletion({ profile, onGo }: { profile: OwnProfile; onGo: (s: StoryStep) => void }) {
  const items = storyItems(profile);
  const done = items.filter((i) => i.done).length;
  const next = items.find((i) => !i.done);
  return (
    <section aria-labelledby="story-completion" className="rounded-3xl border hairline bg-surface/80 p-5">
      <h2 id="story-completion" className="font-serif text-xl">
        {done === items.length ? "Your story is complete" : "Your story is coming together"}
      </h2>
      <p className="mt-0.5 text-xs text-ink-muted">
        {done} of {items.length} done · publishing needs your introduction, a photo and a kind of connection
      </p>
      <ul className="mt-3 space-y-1.5">
        {items.map((i) => (
          <li key={i.key}>
            <button type="button" onClick={() => onGo(i.step)} className="flex w-full items-center gap-2.5 rounded-lg text-left text-sm transition hover:text-primary">
              <span className={cx("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-300", i.done ? "border-primary bg-primary text-surface" : "border-line-strong")}>{i.done && <Icon name="check" className="h-3 w-3" />}</span>
              <span className={i.done ? "text-ink" : "text-ink-muted"}>{i.label}</span>
              <span className="sr-only">{i.done ? "(done)" : "(not done yet)"}</span>
            </button>
          </li>
        ))}
      </ul>
      {next && <p className="mt-3 border-t hairline pt-3 text-sm text-ink-soft">{next.tip}</p>}
    </section>
  );
}
