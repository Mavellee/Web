import { useState } from "react";
import { AppPage, PageHeader } from "../../components/app/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Textarea } from "../../components/ui/Field";
import { LoadingBlock } from "../../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../../components/ui/States";
import { useToast } from "../../components/ui/Toast";
import { api, ApiError } from "../../lib/api";
import { useResource } from "../../lib/useResource";
import { cx, timeAgo } from "../../lib/format";

import { SharedDataView, StatusPill } from "../../components/experts/SharedDataView";

// ---------------- Expert workspace ----------------

type ReviewEvent = { id: string; action: string; message: string | null; createdAt: string };
type Pending = { id: string; topic: string; question: string; sharedFields: string[]; createdAt: string };
type Assigned = Pending & { status: string; sharedData: Parameters<typeof SharedDataView>[0]["data"]; reviews: ReviewEvent[] };

export function ExpertWorkspace() {
  const queue = useResource<{ pending: Pending[]; assigned: Assigned[] }>("/experts/workspace/queue");
  const history = useResource<Assigned[]>("/experts/workspace/history");
  const toast = useToast();
  const [selected, setSelected] = useState<string | null>(null);

  const claim = async (id: string) => {
    try {
      await api.post(`/experts/workspace/queue/${id}/claim`);
      toast("Request claimed");
      setSelected(id);
      queue.reload();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Couldn't claim.", "error");
      queue.reload();
    }
  };

  return (
    <AppPage wide>
      <PageHeader eyebrow="Expert workspace" title="Review queue" lede="You see only what each member chose to share. You never have access to members' chats, and your review never creates, approves or blocks a match." />
      {queue.loading && !queue.data ? (
        <LoadingBlock />
      ) : queue.error ? (
        <ErrorState message={queue.error.message} onRetry={queue.reload} />
      ) : (
        <div className="grid gap-8 grid-cols-1 lg:grid-cols-[22rem_minmax(0,1fr)] [&>*]:min-w-0">
          <div className="space-y-6">
            <section>
              <h2 className="mb-3 text-xl">Waiting ({queue.data?.pending.length ?? 0})</h2>
              {!queue.data?.pending.length ? (
                <p className="text-sm text-ink-muted">No open requests.</p>
              ) : (
                <ul className="space-y-3">
                  {queue.data.pending.map((p) => (
                    <li key={p.id} className="rounded-3xl border hairline bg-surface/75 p-4">
                      <p className="font-semibold">{p.topic}</p>
                      <p className="mt-1 line-clamp-3 text-sm text-ink-soft">{p.question}</p>
                      <p className="mt-2 text-xs text-ink-muted">
                        {timeAgo(p.createdAt)} · shares {p.sharedFields.join(", ") || "question only"}
                      </p>
                      <Button size="sm" className="mt-3" onClick={() => claim(p.id)}>
                        Claim
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section>
              <h2 className="mb-3 text-xl">Yours ({queue.data?.assigned.length ?? 0})</h2>
              <ul className="space-y-2">
                {queue.data?.assigned.map((a) => (
                  <li key={a.id}>
                    <button type="button" onClick={() => setSelected(a.id)} className={cx("w-full rounded-2xl px-4 py-3 text-left transition", selected === a.id ? "bg-primary-50" : "bg-surface/60 hover:bg-surface")}>
                      <span className="block font-semibold">{a.topic}</span>
                      <span className="mt-1 block"><StatusPill status={a.status} /></span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
            {!!history.data?.length && (
              <section>
                <h2 className="mb-3 text-xl">History</h2>
                <ul className="space-y-2 text-sm">
                  {history.data.map((h) => (
                    <li key={h.id} className="flex justify-between rounded-2xl bg-surface/50 px-4 py-2.5">
                      <span>{h.topic}</span>
                      <StatusPill status={h.status} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
          <div>
            {selected ? (
              <RequestDetail
                id={selected}
                onDone={() => {
                  queue.reload();
                  history.reload();
                }}
              />
            ) : (
              <EmptyState title="Select a request">Claim a request or pick one of yours to review.</EmptyState>
            )}
          </div>
        </div>
      )}
    </AppPage>
  );
}

function RequestDetail({ id, onDone }: { id: string; onDone: () => void }) {
  const { data, error, loading, reload } = useResource<Assigned>(`/experts/workspace/queue/${id}`);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const toast = useToast();

  const act = async (path: string, label: string) => {
    setBusy(path);
    try {
      await api.post(`/experts/workspace/queue/${id}/${path}`, { message });
      toast(label);
      setMessage("");
      reload();
      onDone();
    } catch (e) {
      toast(e instanceof ApiError ? (e.details ? "Please write a short explanation (10+ characters)." : e.message) : "Couldn't update.", "error");
    } finally {
      setBusy(null);
    }
  };

  if (loading && !data) return <LoadingBlock />;
  if (error || !data) return <ErrorState message={error?.message ?? "Not found"} onRetry={reload} />;
  const open = data.status === "IN_REVIEW";

  return (
    <Card className="p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="font-serif text-3xl">{data.topic}</h2>
        <StatusPill status={data.status} />
      </div>
      <p className="mt-3 font-serif text-lg">“{data.question}”</p>
      <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-ink-muted">Shared by the member</h3>
      <div className="mt-3">
        <SharedDataView data={data.sharedData} fields={data.sharedFields} />
      </div>
      {data.reviews.length > 0 && (
        <ol className="mt-6 space-y-2 border-l-2 border-primary-100 pl-4 text-sm">
          {data.reviews.map((r) => (
            <li key={r.id}>
              <p className="text-xs font-semibold text-ink-muted">
                {r.action.replace("_", " ").toLowerCase()} · {timeAgo(r.createdAt)}
              </p>
              {r.message && <p className="whitespace-pre-wrap">{r.message}</p>}
            </li>
          ))}
        </ol>
      )}
      {(open || data.status === "INFO_REQUESTED") && (
        <div className="mt-6 space-y-3">
          <Textarea label="Your message to the member" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={3000} hint="Offer reflections, not verdicts. Don't tell members whether they should or shouldn't be with someone." />
          <div className="flex flex-wrap gap-2">
            {open && (
              <>
                <Button onClick={() => act("complete", "Review sent")} loading={busy === "complete"}>
                  Complete review
                </Button>
                <Button variant="secondary" onClick={() => act("request-info", "Question sent")} loading={busy === "request-info"}>
                  Ask for more information
                </Button>
              </>
            )}
            <Button variant="quiet" className="text-accent" onClick={() => act("decline", "Request declined")} loading={busy === "decline"}>
              Decline with explanation
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
