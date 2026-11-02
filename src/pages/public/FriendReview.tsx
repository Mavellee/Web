import { useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input, Textarea } from "../../components/ui/Field";
import { Logo } from "../../components/ui/Logo";
import { LoadingBlock } from "../../components/ui/Skeleton";
import { ThemeToggle } from "../../components/ui/ThemeToggle";
import { api, ApiError } from "../../lib/api";
import { cx } from "../../lib/format";
import { VERDICTS, type Verdict } from "../../lib/friendReview";

type Shared = {
  requesterName: string;
  expiresAt: string;
  profile: { displayName: string; age: number | null; bio: string | null; languages: string[]; photos: { id: string; caption: string | null }[]; prompts: { text: string; answer: string }[]; interests: string[] };
};

/** Photos need the token in a header, so it never lands in a URL or a server log. */
function SharedPhoto({ id, token, alt }: { id: string; token: string; alt: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let url: string | null = null;
    let live = true;
    void fetch(`/api/friend-reviews/shared/photos/${id}`, { headers: { "x-friend-token": token } })
      .then((r) => (r.ok ? r.blob() : null))
      .then((b) => {
        if (!b || !live) return;
        url = URL.createObjectURL(b);
        setSrc(url);
      })
      .catch(() => {});
    return () => {
      live = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [id, token]);
  return src ? <img src={src} alt={alt} className="aspect-[4/5] w-full rounded-3xl object-cover" /> : <div className="aspect-[4/5] w-full animate-pulse rounded-3xl bg-rose-soft" />;
}

/** Opened by a friend with no Mavelle account. The link is the only credential. */
export function FriendReview() {
  const [token, setToken] = useState(() => window.location.hash.slice(1));
  const [data, setData] = useState<Shared | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "gone" | "error" | "sent">("loading");
  const [name, setName] = useState("");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex, nofollow";
    document.head.appendChild(robots);
    return () => robots.remove();
  }, []);

  // Opening a newer link in the same tab only changes the fragment, with no page load.
  useEffect(() => {
    const onChange = () => setToken(window.location.hash.slice(1));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  useEffect(() => {
    setData(null);
    setProblem(null);
    if (!token) return setState("gone");
    setState("loading");
    api
      .post<Shared>("/friend-reviews/shared/open", { token })
      .then((d) => {
        setData(d);
        setState("ready");
      })
      .catch((e) => setState(e instanceof ApiError && (e.status === 404 || e.status === 400) ? "gone" : "error"));
  }, [token]);

  const send = async () => {
    if (!name.trim() || !verdict) return setProblem("Add your first name and choose an answer.");
    setSending(true);
    setProblem(null);
    try {
      await api.post("/friend-reviews/shared/reply", { token, friendName: name.trim(), verdict, comment: comment.trim() || undefined });
      setState("sent");
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setState("gone");
      else setProblem(e instanceof ApiError ? e.message : "That didn't send. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const p = data?.profile;
  return (
    <div className="min-h-dvh">
      <header className="container-page flex items-center justify-between py-4">
        <Logo />
        <ThemeToggle className="text-ink-soft" />
      </header>
      <main className="container-page max-w-2xl pb-16">
        {state === "loading" && <LoadingBlock label="Opening the link" />}
        {state === "gone" && (
          <Card className="p-8 text-center">
            <h1 className="text-2xl">This link is no longer available</h1>
            <p className="mt-2 text-ink-soft">It may have expired, already been answered, or been stopped. Ask your friend for a new one.</p>
          </Card>
        )}
        {state === "error" && (
          <Card className="p-8 text-center">
            <h1 className="text-2xl">That didn't load</h1>
            <p className="mt-2 text-ink-soft">Please check your connection and try again.</p>
          </Card>
        )}
        {state === "sent" && (
          <Card className="p-8 text-center">
            <h1 className="text-2xl">Thank you</h1>
            <p className="mt-2 text-ink-soft">{data?.requesterName} can now read your reply. {p?.displayName} won't see it, and this link is now closed.</p>
          </Card>
        )}
        {state === "ready" && data && p && (
          <>
            <p className="eyebrow">A private request</p>
            <h1 className="mt-2 text-3xl">{data.requesterName} wants your honest opinion</h1>
            <p className="mt-2 text-ink-soft">{p.displayName} agreed to let {data.requesterName} share this with one trusted friend. Please keep it to yourself. No account is needed.</p>
            <section aria-label={`${p.displayName}'s profile`} className="mt-6 space-y-4">
              <h2 className="font-serif text-2xl">
                {p.displayName}
                {p.age != null && <span className="font-normal">, {p.age}</span>}
              </h2>
              {p.photos.length > 0 && (
                <div className={cx("grid gap-3", p.photos.length > 1 && "grid-cols-2")}>
                  {p.photos.map((ph, i) => (
                    <SharedPhoto key={ph.id} id={ph.id} token={token} alt={ph.caption ?? `${p.displayName}, photo ${i + 1}`} />
                  ))}
                </div>
              )}
              {p.bio && <p className="leading-relaxed text-ink-soft">{p.bio}</p>}
              {p.prompts.map((q) => (
                <Card key={q.text} className="p-4">
                  <p className="text-sm font-semibold text-ink-muted">{q.text}</p>
                  <p className="mt-1 font-serif text-lg">{q.answer}</p>
                </Card>
              ))}
              {p.interests.length > 0 && <p className="text-sm text-ink-soft"><span className="font-semibold">Interests:</span> {p.interests.join(", ")}</p>}
              {p.languages.length > 0 && <p className="text-sm text-ink-soft"><span className="font-semibold">Speaks:</span> {p.languages.join(", ")}</p>}
            </section>
            <Card className="mt-8 space-y-4 p-5">
              <h2 className="text-xl">What do you think?</h2>
              <p className="text-sm text-ink-soft">Only {data.requesterName} will see this. You can send one reply.</p>
              <Input label="Your first name" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
              <div role="radiogroup" aria-label="Your answer" className="grid gap-2 sm:grid-cols-3">
                {VERDICTS.map((v) => (
                  <button key={v.value} type="button" role="radio" aria-checked={verdict === v.value} onClick={() => setVerdict(v.value)} className={cx("rounded-2xl border p-3 text-left transition", verdict === v.value ? "border-primary bg-primary-50" : "hairline bg-surface/70 hover:bg-surface")}>
                    <span className="block text-sm font-semibold">{v.label}</span>
                    <span className="block text-xs text-ink-muted">{v.hint}</span>
                  </button>
                ))}
              </div>
              <Textarea label="Anything to add?" optional value={comment} maxLength={300} rows={3} onChange={(e) => setComment(e.target.value)} />
              {problem && <p role="alert" className="text-sm text-error">{problem}</p>}
              <Button className="w-full" loading={sending} onClick={() => void send()}>
                Send to {data.requesterName}
              </Button>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
