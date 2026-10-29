import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChatGameLauncher } from "../../components/chatgames/ChatGameLauncher";
import { GameSelectionSheet } from "../../components/chatgames/GameSelectionSheet";
import { InlineGameCard } from "../../components/chatgames/InlineGameCard";
import { useConversationGames } from "../../components/chatgames/useConversationGames";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useSocket, useSocketEvent } from "../../lib/socket";
import { useResource } from "../../lib/useResource";
import { clockTime, cx, dayLabel, timeAgo } from "../../lib/format";
import { DetailMediaThumb } from "../../components/media/MediaThumb";
import { mergeMessages } from "../../lib/messages";
import type { ConversationSummary, Message, PublicProfile } from "../../lib/types";
import { Avatar } from "../../components/ui/Photo";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../../components/ui/States";
import { Spinner } from "../../components/ui/Spinner";
import { useToast } from "../../components/ui/Toast";
import { ReportDialog, SafetyMenu } from "../../components/app/SafetyActions";
import { AiPanel } from "../../components/app/AiPanel";

export function Messages() {
  const { id } = useParams();
  const { data, error, loading, reload } = useResource<ConversationSummary[]>("/conversations");
  useSocketEvent("conversation:updated", reload);
  useSocketEvent("match:ended", reload);

  return (
    <div className="mx-auto grid h-[calc(100dvh-7.5rem)] max-w-6xl md:h-dvh md:px-6 md:py-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <section aria-label="Conversations" className={cx("flex min-h-0 flex-col md:rounded-4xl md:border md:hairline md:bg-surface/60 lg:rounded-r-none", id && "hidden lg:flex")}>
        <div className="px-5 pb-3 pt-6 md:pt-7">
          <h1 className="text-3xl">Messages</h1>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          {loading && !data ? (
            <div className="space-y-2 px-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : error ? (
            <div className="p-3">
              <ErrorState message={error.message} onRetry={reload} />
            </div>
          ) : !data?.length ? (
            <EmptyState title="No conversations yet" action={<ButtonLink to="/app/discover" size="sm">Discover people</ButtonLink>}>
              Conversations start when you match with someone.
            </EmptyState>
          ) : (
            <ul>
              {data.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/app/messages/${c.id}`}
                    aria-current={c.id === id ? "page" : undefined}
                    className={cx("flex items-center gap-3 rounded-2xl px-3 py-3 transition", c.id === id ? "bg-primary-50" : "hover:bg-surface")}
                  >
                    <Avatar id={c.other.photoIds[0]} name={c.other.displayName} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className={cx("truncate", c.unread ? "font-bold" : "font-semibold")}>{c.other.displayName}</p>
                        <span className="shrink-0 text-xs text-ink-muted">{timeAgo(c.lastMessage?.createdAt ?? c.createdAt)}</span>
                      </div>
                      <p className={cx("truncate text-sm", c.unread ? "font-semibold text-ink" : "text-ink-muted")}>{c.lastMessage ? c.lastMessage.body : "New match — say hello"}</p>
                    </div>
                    {c.unread > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-surface" aria-label={`${c.unread} unread`}>
                        {c.unread}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      <section aria-label="Conversation" className={cx("min-h-0 md:rounded-4xl md:border md:hairline md:bg-surface/80 lg:rounded-l-none lg:border-l-0", !id && "hidden lg:block")}>
        {id ? (
          <Conversation key={id} id={id} onActivity={reload} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <EmptyState title="Pick a conversation">Choose someone on the left to continue where you left off.</EmptyState>
          </div>
        )}
      </section>
    </div>
  );
}

type Header = { id: string; matchId: string; other: PublicProfile; otherLastReadAt: string | null };
type Ack = { ok: boolean; data?: Message; error?: { message: string } };

function Conversation({ id, onActivity }: { id: string; onActivity: () => void }) {
  const { account } = useAuth();
  const me = account!.id;
  const { socket, status } = useSocket();
  const navigate = useNavigate();
  const toast = useToast();
  const header = useResource<Header>(`/conversations/${id}`);
  const games = useConversationGames(id);
  const [params, setParams] = useSearchParams();
  const [launcherOpen, setLauncherOpen] = useState(!!params.get("play"));
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [olderLoading, setOlderLoading] = useState(false);
  const [text, setText] = useState("");
  const [theyTyping, setTheyTyping] = useState(false);
  const [otherReadAt, setOtherReadAt] = useState<string | null>(null);
  const [reporting, setReporting] = useState<Message | null>(null);
  const [uploading, setUploading] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const typingSent = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => setOtherReadAt(header.data?.otherLastReadAt ?? null), [header.data]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const page = await api.get<{ items: Message[]; hasMore: boolean }>(`/conversations/${id}/messages?limit=30`);
      setMessages(page.items);
      setHasMore(page.hasMore);
      void api
        .post(`/conversations/${id}/read`)
        .then(() => {
          onActivity();
          window.dispatchEvent(new Event("knot:counts"));
        })
        .catch(() => {});
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : "Couldn't load messages.");
    } finally {
      setLoading(false);
    }
  }, [id, onActivity]);

  useEffect(() => {
    void load();
  }, [load]);

  // Join the conversation room, and after every reconnect rejoin and catch up on anything sent while offline.
  useEffect(() => {
    if (!socket) return;
    const join = () => socket.emit("conversation:join", { conversationId: id });
    const rejoin = () => {
      join();
      api
        .get<{ items: Message[] }>(`/conversations/${id}/messages?limit=30`)
        .then((page) => setMessages((list) => mergeMessages(list, page.items)))
        .catch(() => {});
    };
    if (socket.connected) join();
    socket.on("connect", rejoin);
    return () => {
      socket.off("connect", rejoin);
      socket.emit("conversation:leave", { conversationId: id });
    };
  }, [socket, id]);

  useSocketEvent<Message>(
    "message:new",
    useCallback(
      (m) => {
        if (m.conversationId !== id) return;
        setMessages((list) => mergeMessages(list, [m]));
        if (m.senderId !== me) {
          setTheyTyping(false);
          if (document.visibilityState === "visible") socket?.emit("conversation:read", { conversationId: id });
        }
      },
      [id, me, socket],
    ),
  );
  useSocketEvent<{ conversationId: string; userId: string; isTyping: boolean }>(
    "typing",
    useCallback((t) => t.conversationId === id && t.userId !== me && setTheyTyping(t.isTyping), [id, me]),
  );
  useSocketEvent<{ conversationId: string; userId: string; at: string }>(
    "conversation:read",
    useCallback((r) => r.conversationId === id && r.userId !== me && setOtherReadAt(r.at), [id, me]),
  );
  useSocketEvent<{ conversationId?: string }>(
    "match:ended",
    useCallback(
      (e) => {
        if (e.conversationId === id) {
          toast("This conversation has ended", "info");
          navigate("/app/messages");
        }
      },
      [id, navigate, toast],
    ),
  );

  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages, theyTyping]);

  const loadOlder = async () => {
    const first = messages.find((m) => !m.pending);
    if (!first) return;
    setOlderLoading(true);
    const el = scroller.current;
    const prevHeight = el?.scrollHeight ?? 0;
    try {
      const page = await api.get<{ items: Message[]; hasMore: boolean }>(`/conversations/${id}/messages?limit=30&before=${first.id}`);
      stickToBottom.current = false;
      setMessages((list) => [...page.items, ...list]);
      setHasMore(page.hasMore);
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - prevHeight;
      });
    } catch {
      toast("Couldn't load earlier messages.", "error");
    } finally {
      setOlderLoading(false);
    }
  };

  const setTyping = (on: boolean) => {
    if (!socket?.connected || typingSent.current === on) return;
    typingSent.current = on;
    socket.emit("typing", { conversationId: id, isTyping: on });
  };

  const deliver = async (pending: Message) => {
    const body = pending.body ?? "";
    const done = (m: Message) => setMessages((list) => list.map((x) => (x.clientId === pending.clientId ? m : x)));
    const fail = (message: string) => {
      setMessages((list) => list.map((x) => (x.clientId === pending.clientId ? { ...x, pending: false, failed: true } : x)));
      toast(message, "error");
    };
    if (socket?.connected) {
      socket.timeout(8000).emit("message:send", { conversationId: id, body, clientId: pending.clientId }, (err: Error | null, ack: Ack) => {
        if (err) return void restSend();
        if (ack.ok && ack.data) done(ack.data);
        else fail(ack.error?.message ?? "Message not sent.");
      });
    } else await restSend();

    async function restSend() {
      try {
        done(await api.post<Message>(`/conversations/${id}/messages`, { body, clientId: pending.clientId }));
      } catch (e) {
        fail(e instanceof ApiError ? e.message : "Message not sent.");
      }
    }
  };

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const body = text.trim();
    if (!body) return;
    const clientId = crypto.randomUUID();
    const pending: Message = { id: clientId, conversationId: id, senderId: me, kind: "TEXT", body, hasAttachment: false, clientId, createdAt: new Date().toISOString(), pending: true };
    stickToBottom.current = true;
    setMessages((list) => [...list, pending]);
    setText("");
    setTyping(false);
    await deliver(pending);
    onActivity();
  };

  const retry = (m: Message) => {
    setMessages((list) => list.map((x) => (x.clientId === m.clientId ? { ...x, failed: false, pending: true } : x)));
    void deliver(m);
  };

  const sendImage = async (file: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return toast("Images must be JPEG, PNG or WebP.", "error");
    if (file.size > 5 * 1024 * 1024) return toast("That image is over 5 MB.", "error");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch(`/api/conversations/${id}/attachments`, { method: "POST", body: form, credentials: "same-origin" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Upload failed.");
      stickToBottom.current = true;
      setMessages((list) => (list.some((x) => x.id === json.data.id) ? list : [...list, json.data]));
    } catch (e) {
      toast(e instanceof Error ? e.message : "Upload failed.", "error");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const other = header.data?.other;
  const lastMine = [...messages].reverse().find((m) => m.senderId === me && !m.pending);
  const seen = !!(lastMine && otherReadAt && new Date(otherReadAt) >= new Date(lastMine.createdAt));

  if (header.error)
    return (
      <EmptyState title="Conversation unavailable" action={<ButtonLink to="/app/messages" size="sm">Back to messages</ButtonLink>}>
        It may have ended, or you may not have access to it.
      </EmptyState>
    );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b hairline px-4 py-3">
        <Link to="/app/messages" className="rounded-full p-2 text-ink-soft lg:hidden" aria-label="Back to conversations">
          <Icon name="back" />
        </Link>
        {other ? (
          <Link to={`/app/people/${other.id}`} className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar id={other.photoIds[0]} name={other.displayName} size="h-10 w-10" />
            <div className="min-w-0">
              <p className="truncate font-semibold">{other.displayName}</p>
              <p className="text-xs text-ink-muted" aria-live="polite">
                {theyTyping ? "typing…" : status === "connected" ? "View profile" : "Reconnecting…"}
              </p>
            </div>
          </Link>
        ) : (
          <Skeleton className="h-10 flex-1" />
        )}
        {other && header.data && <SafetyMenu userId={other.id} name={other.displayName} matchId={header.data.matchId} onEnded={() => navigate("/app/messages")} />}
      </header>

      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6"
        role="log"
        aria-label="Messages"
        aria-live="polite"
      >
        {loading ? (
          <div className="flex justify-center py-10 text-primary">
            <Spinner label="Loading messages" />
          </div>
        ) : loadError ? (
          <ErrorState message={loadError} onRetry={load} />
        ) : (
          <>
            {hasMore && (
              <div className="mb-4 flex justify-center">
                <Button variant="secondary" size="sm" onClick={loadOlder} loading={olderLoading}>
                  Load earlier messages
                </Button>
              </div>
            )}
            {!messages.length && other && (
              <div className="mx-auto max-w-sm py-8 text-center">
                <Avatar id={other.photoIds[0]} name={other.displayName} size="h-20 w-20 mx-auto" />
                <p className="mt-4 font-serif text-2xl">You matched with {other.displayName}</p>
                <p className="mt-1 text-sm text-ink-muted">A simple, genuine question is a great start.</p>
              </div>
            )}
            <ol className="space-y-1.5">
              {messages.map((m, i) => {
                const mine = m.senderId === me;
                const prev = messages[i - 1];
                const newDay = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString();
                return (
                  <Fragment key={m.clientId ?? m.id}>
                    {newDay && (
                      <li className="py-3 text-center text-xs font-semibold text-ink-muted" aria-hidden="true">
                        {dayLabel(m.createdAt)}
                      </li>
                    )}
                    {m.kind === "GAME" ? (
                      <li>
                        <InlineGameCard message={m} games={games} />
                      </li>
                    ) : (
                    <li className={cx("group flex items-end gap-2", mine ? "justify-end" : "justify-start")}>
                      {!mine && !m.pending && (
                        <button type="button" onClick={() => setReporting(m)} className="order-last rounded-full p-1 text-ink-muted opacity-0 transition hover:text-accent focus:opacity-100 group-hover:opacity-100" aria-label="Report this message">
                          <Icon name="flag" className="h-4 w-4" />
                        </button>
                      )}
                      <div className={cx("max-w-[80%] rounded-3xl px-4 py-2.5 sm:max-w-[65%]", mine ? "rounded-br-lg bg-primary text-surface" : "rounded-bl-lg bg-surface text-ink shadow-soft", m.pending && "opacity-70")}>
                        {(() => {
                          // A first message that started from a profile detail quotes it.
                          const d = m.metadata?.detail as { label: string; quote: string; kind: string; mediaId?: string; mediaKind?: "IMAGE" | "VIDEO" } | undefined;
                          return d ? (
                            <figure className={cx("mb-2 rounded-2xl px-3 py-2 text-xs", mine ? "bg-parchment/15 text-surface/90" : "bg-parchment-deep text-ink-soft")}>
                              <figcaption className="font-semibold">{d.kind === "PROMPT" ? d.label : d.kind === "MEDIA" ? `About ${mine ? "their" : "your"} ${d.label.toLowerCase()}` : "Interest"}</figcaption>
                              {d.kind === "MEDIA" && d.mediaId && <DetailMediaThumb id={d.mediaId} kind={d.mediaKind} className="my-1.5 h-20 w-16" />}
                              {d.quote && <blockquote className="mt-0.5 font-serif text-sm">{d.quote}</blockquote>}
                            </figure>
                          ) : null;
                        })()}
                        {m.hasAttachment && <img src={`/api/conversations/${id}/attachments/${m.id}`} alt="Shared photo" className="mb-1 max-h-72 rounded-2xl object-cover" loading="lazy" />}
                        {m.body && <p className="whitespace-pre-wrap break-words leading-relaxed">{m.body}</p>}
                        <p className={cx("mt-0.5 text-right text-[0.68rem]", mine ? "text-surface/70" : "text-ink-muted")}>
                          {m.pending ? "Sending…" : m.failed ? "" : clockTime(m.createdAt)}
                        </p>
                      </div>
                    </li>
                    )}
                    {m.failed && (
                      <li className="flex justify-end">
                        <button type="button" onClick={() => retry(m)} className="text-xs font-semibold text-accent underline">
                          Not sent — tap to retry
                        </button>
                      </li>
                    )}
                  </Fragment>
                );
              })}
            </ol>
            {seen && <p className="mt-1 text-right text-xs text-ink-muted">Seen</p>}
            {theyTyping && (
              <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-surface px-3 py-2 shadow-soft" aria-label={`${other?.displayName} is typing`}>
                {[0, 1, 2].map((d) => (
                  <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-300" style={{ animationDelay: `${d * 120}ms` }} />
                ))}
              </p>
            )}
          </>
        )}
      </div>

      <div className="border-t hairline px-3 pb-3 pt-3 sm:px-5">
        {header.data && messages.length < 4 && account?.settings?.aiEnabled !== false && (
          <AiPanel className="mb-3" title="Need an opener?" request={{ feature: "conversation_starter", matchId: header.data.matchId }} onUse={(s) => setText(s)} />
        )}
        <form onSubmit={send} className="flex items-end gap-2">
          <ChatGameLauncher onOpen={() => setLauncherOpen(true)} liveSessionId={games.live?.id ?? null} />
          <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading} className="mb-1 rounded-full p-2.5 text-ink-soft hover:bg-ink/5" aria-label="Send a photo">
            {uploading ? <Spinner className="h-5 w-5" /> : <Icon name="image" />}
          </button>
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Choose a photo to send" onChange={(e) => e.target.files?.[0] && sendImage(e.target.files[0])} />
          <label htmlFor="composer" className="sr-only">
            Message
          </label>
          <textarea
            id="composer"
            rows={1}
            value={text}
            maxLength={2000}
            placeholder="Write a message…"
            onChange={(e) => {
              setText(e.target.value);
              setTyping(true);
              clearTimeout(typingTimer.current);
              typingTimer.current = setTimeout(() => setTyping(false), 2500);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            className="max-h-36 min-h-11 flex-1 resize-none rounded-3xl border border-line bg-surface px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
          />
          <Button type="submit" className="mb-0.5 h-11 w-11 !px-0" disabled={!text.trim()} aria-label="Send message">
            <Icon name="send" />
          </Button>
        </form>
      </div>
      {other && (
        <GameSelectionSheet
          open={launcherOpen}
          onClose={() => {
            setLauncherOpen(false);
            if (params.get("play")) setParams({}, { replace: true });
          }}
          partnerName={other.displayName}
          highlight={params.get("play")}
          onStart={async (slug) => {
            try {
              const v = await games.start(slug);
              stickToBottom.current = true;
              setTimeout(() => document.getElementById(`game-card-${v.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
              return true;
            } catch (e) {
              toast(e instanceof ApiError ? e.message : "Couldn't start the game.", "error");
              return false;
            }
          }}
        />
      )}
      {reporting && other && <ReportDialog open onClose={() => setReporting(null)} userId={other.id} name={other.displayName} messageId={reporting.id} onDone={(blocked) => blocked && navigate("/app/messages")} />}
    </div>
  );
}
