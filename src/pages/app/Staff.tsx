import { useState } from "react";
import { AppPage, PageHeader } from "../../components/app/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input, Select, Textarea } from "../../components/ui/Field";
import { LoadingBlock } from "../../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../../components/ui/States";
import { useToast } from "../../components/ui/Toast";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useResource } from "../../lib/useResource";
import { cx, timeAgo } from "../../lib/format";
import { REPORT_REASONS } from "../../lib/labels";

// ---------------- Expert workspace ----------------

type ReviewEvent = { id: string; action: string; message: string | null; createdAt: string };
type Pending = { id: string; topic: string; question: string; sharedFields: string[]; createdAt: string };
type Assigned = Pending & { status: string; sharedData: Record<string, unknown>; reviews: ReviewEvent[] };

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
        <div className="grid gap-8 lg:grid-cols-[22rem_1fr]">
          <div className="space-y-6">
            <section>
              <h2 className="mb-3 text-xl">Waiting ({queue.data?.pending.length ?? 0})</h2>
              {!queue.data?.pending.length ? (
                <p className="text-sm text-ink-muted">No open requests.</p>
              ) : (
                <ul className="space-y-3">
                  {queue.data.pending.map((p) => (
                    <li key={p.id} className="rounded-3xl border hairline bg-white/75 p-4">
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
                    <button type="button" onClick={() => setSelected(a.id)} className={cx("w-full rounded-2xl px-4 py-3 text-left transition", selected === a.id ? "bg-plum-50" : "bg-white/60 hover:bg-white")}>
                      <span className="block font-semibold">{a.topic}</span>
                      <span className="text-xs text-ink-muted">{a.status === "INFO_REQUESTED" ? "Waiting on member" : "In review"}</span>
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
                    <li key={h.id} className="flex justify-between rounded-2xl bg-white/50 px-4 py-2.5">
                      <span>{h.topic}</span>
                      <Badge tone="neutral">{h.status.toLowerCase()}</Badge>
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
        <h2 className="text-3xl">{data.topic}</h2>
        <Badge tone={open ? "lavender" : "neutral"}>{data.status.replace("_", " ").toLowerCase()}</Badge>
      </div>
      <p className="mt-3 font-serif text-lg">“{data.question}”</p>
      <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-ink-muted">Shared by the member</h3>
      {Object.keys(data.sharedData).length ? (
        <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap rounded-2xl bg-ivory-deep p-4 text-xs leading-relaxed">{JSON.stringify(data.sharedData, null, 2)}</pre>
      ) : (
        <p className="mt-2 text-sm text-ink-muted">Nothing beyond the question.</p>
      )}
      {data.reviews.length > 0 && (
        <ol className="mt-6 space-y-2 border-l-2 border-plum-100 pl-4 text-sm">
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
            <Button variant="quiet" className="text-rose-ink" onClick={() => act("decline", "Request declined")} loading={busy === "decline"}>
              Decline with explanation
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

// ---------------- Admin / moderation ----------------

type Overview = { openReports: number; underageReports: number; pendingExperts: number; activeUsers: number; pendingDeletion: number };
type ReportRow = {
  id: string;
  reason: string;
  target: string;
  details: string | null;
  status: string;
  createdAt: string;
  reporter: { profile: { displayName: string } | null };
  reportedUser: { id: string; status: string; profile: { displayName: string } | null; _count: { reportsReceived: number } };
  message: { body: string | null; kind: string } | null;
};
type ExpertApp = { userId: string; headline: string; bio: string; experienceYears: number; credentials: string | null; specialties: string[]; createdAt: string; user: { email: string; profile: { displayName: string } | null } };
type UserRow = { id: string; email: string; role: string; status: string; age: number | null; createdAt: string; profile: { displayName: string } | null; _count: { reportsReceived: number } };
type AuditRow = { id: string; action: string; actorRole: string | null; targetType: string | null; targetId: string | null; createdAt: string };

const reasonLabel = (r: string) => REPORT_REASONS.find((x) => x.value === r)?.label ?? r;

export function Admin() {
  const { account } = useAuth();
  const [tab, setTab] = useState<"reports" | "experts" | "users" | "audit">("reports");
  const overview = useResource<Overview>("/admin/overview");
  const tabs = [
    ["reports", "Reports"],
    ["experts", "Expert applications"],
    ["users", "Members"],
    ...(account?.role === "ADMIN" ? [["audit", "Audit log"]] : []),
  ] as [typeof tab, string][];

  return (
    <AppPage wide>
      <PageHeader eyebrow="Moderation" title="Trust & safety" lede="Every action here is recorded in the audit log." />
      {overview.data && (
        <dl className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            ["Open reports", overview.data.openReports],
            ["Possible under-18", overview.data.underageReports],
            ["Expert applications", overview.data.pendingExperts],
            ["Active members", overview.data.activeUsers],
            ["Pending deletion", overview.data.pendingDeletion],
          ].map(([l, v]) => (
            <div key={l} className={cx("rounded-3xl p-4", l === "Possible under-18" && Number(v) > 0 ? "bg-rose-soft" : "bg-white/70")}>
              <dt className="text-xs font-semibold text-ink-muted">{l}</dt>
              <dd className="mt-1 font-serif text-3xl">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      <div role="tablist" className="mb-6 flex gap-1 overflow-x-auto rounded-full bg-ivory-deep p-1">
        {tabs.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cx("shrink-0 rounded-full px-4 py-2 text-sm font-semibold", tab === k ? "bg-white text-plum shadow-soft" : "text-ink-soft")}>
            {l}
          </button>
        ))}
      </div>
      {tab === "reports" && <ReportsQueue onChange={overview.reload} />}
      {tab === "experts" && <ExpertApprovals onChange={overview.reload} />}
      {tab === "users" && <UserSearch />}
      {tab === "audit" && <AuditLog />}
    </AppPage>
  );
}

function ReportsQueue({ onChange }: { onChange: () => void }) {
  const { data, error, loading, reload } = useResource<ReportRow[]>("/admin/reports");
  const toast = useToast();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const update = async (r: ReportRow, status: string) => {
    await api.post(`/admin/reports/${r.id}`, { status, resolution: notes[r.id] || undefined });
    toast(`Report ${status.toLowerCase()}`);
    reload();
    onChange();
  };
  const restrict = async (r: ReportRow, status: "SUSPENDED" | "BANNED") => {
    const reason = notes[r.id]?.trim();
    if (!reason || reason.length < 5) return toast("Write a reason in the notes first.", "error");
    try {
      await api.post(`/admin/users/${r.reportedUser.id}/status`, { status, reason });
      toast(`Member ${status.toLowerCase()}`);
      reload();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed.", "error");
    }
  };

  if (loading && !data) return <LoadingBlock />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (!data?.length) return <EmptyState title="Queue is clear">No open reports right now.</EmptyState>;
  return (
    <ul className="space-y-4">
      {data.map((r) => (
        <li key={r.id} className={cx("rounded-3xl border bg-white/80 p-5 shadow-soft", r.reason === "UNDERAGE" ? "border-rose-ink/40" : "hairline")}>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={r.reason === "UNDERAGE" ? "rose" : "neutral"}>{reasonLabel(r.reason)}</Badge>
            <Badge tone="lavender">{r.target.toLowerCase()}</Badge>
            <span className="text-xs text-ink-muted">{timeAgo(r.createdAt)}</span>
          </div>
          <p className="mt-3 text-sm">
            <strong>{r.reportedUser.profile?.displayName ?? "Member"}</strong> ({r.reportedUser.status.toLowerCase()}, {r.reportedUser._count.reportsReceived} total reports) reported by {r.reporter.profile?.displayName ?? "member"}
          </p>
          {r.details && <p className="mt-2 rounded-2xl bg-ivory-deep p-3 text-sm">{r.details}</p>}
          {r.message && (
            <blockquote className="mt-2 rounded-2xl border-l-4 border-rose bg-rose-soft/50 p-3 text-sm">
              <span className="block text-xs font-semibold text-ink-muted">Reported message</span>
              {r.message.body ?? `[${r.message.kind.toLowerCase()}]`}
            </blockquote>
          )}
          <div className="mt-4">
            <Input label="Moderator notes / reason" value={notes[r.id] ?? ""} onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {r.status === "OPEN" && (
              <Button size="sm" variant="secondary" onClick={() => update(r, "INVESTIGATING")}>
                Investigating
              </Button>
            )}
            <Button size="sm" onClick={() => update(r, "RESOLVED")}>
              Resolve
            </Button>
            <Button size="sm" variant="quiet" onClick={() => update(r, "DISMISSED")}>
              Dismiss
            </Button>
            <Button size="sm" variant="quiet" className="text-rose-ink" onClick={() => restrict(r, "SUSPENDED")}>
              {r.reason === "UNDERAGE" ? "Restrict pending age check" : "Suspend member"}
            </Button>
            <Button size="sm" variant="danger" onClick={() => restrict(r, "BANNED")}>
              Ban
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ExpertApprovals({ onChange }: { onChange: () => void }) {
  const { data, loading, error, reload } = useResource<ExpertApp[]>("/admin/experts?status=PENDING");
  const [note, setNote] = useState<Record<string, string>>({});
  const [verified, setVerified] = useState<Record<string, boolean>>({});
  const toast = useToast();
  const decide = async (a: ExpertApp, decision: "APPROVED" | "REJECTED") => {
    try {
      await api.post(`/admin/experts/${a.userId}/decision`, { decision, note: note[a.userId] ?? "", credentialsVerified: !!verified[a.userId] });
      toast(`Application ${decision.toLowerCase()}`);
      reload();
      onChange();
    } catch (e) {
      toast(e instanceof ApiError ? "Add a decision note (5+ characters)." : "Failed.", "error");
    }
  };
  if (loading && !data) return <LoadingBlock />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (!data?.length) return <EmptyState title="No pending applications" />;
  return (
    <ul className="space-y-4">
      {data.map((a) => (
        <li key={a.userId} className="rounded-3xl border hairline bg-white/80 p-5 shadow-soft">
          <p className="font-serif text-xl">{a.user.profile?.displayName}</p>
          <p className="text-sm text-ink-muted">
            {a.user.email} · applied {timeAgo(a.createdAt)}
          </p>
          <p className="mt-3 font-semibold">{a.headline}</p>
          <p className="mt-1 text-sm text-ink-soft">{a.bio}</p>
          <p className="mt-2 text-sm">
            {a.experienceYears} years · {a.specialties.join(", ")}
          </p>
          <p className="mt-1 text-sm text-ink-muted">Credentials (self-declared): {a.credentials ?? "none given"}</p>
          <div className="mt-4 space-y-3">
            <Input label="Decision note (shown to applicant)" value={note[a.userId] ?? ""} onChange={(e) => setNote((n) => ({ ...n, [a.userId]: e.target.value }))} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-5 w-5 accent-plum" checked={!!verified[a.userId]} onChange={(e) => setVerified((v) => ({ ...v, [a.userId]: e.target.checked }))} />I have checked these credentials with the issuing body
            </label>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => decide(a, "APPROVED")}>
                Approve
              </Button>
              <Button size="sm" variant="quiet" onClick={() => decide(a, "REJECTED")}>
                Reject
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function UserSearch() {
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const { data, loading, reload } = useResource<UserRow[]>(query ? `/admin/users?q=${encodeURIComponent(query)}` : null);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState("SUSPENDED");
  const toast = useToast();
  const apply = async (u: UserRow) => {
    try {
      await api.post(`/admin/users/${u.id}/status`, { status, reason });
      toast("Status updated");
      reload();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed.", "error");
    }
  };
  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(q.trim());
        }}
        className="flex items-end gap-2"
      >
        <div className="flex-1">
          <Input label="Search by email or display name" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Button type="submit">Search</Button>
      </form>
      <p className="mt-2 text-xs text-ink-muted">Searches are recorded in the audit log.</p>
      {loading && <LoadingBlock />}
      {data && (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Select label="Action" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="SUSPENDED">Suspend</option>
              <option value="BANNED">Ban</option>
              <option value="ACTIVE">Restore</option>
            </Select>
            <Input label="Reason (required)" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <ul className="mt-4 divide-y hairline rounded-3xl border hairline bg-white/70">
            {data.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                <span>
                  <strong>{u.profile?.displayName ?? "—"}</strong> · {u.email} · {u.age ?? "?"} · {u.role.toLowerCase()} · <span className={u.status === "ACTIVE" ? "text-sage-ink" : "text-rose-ink"}>{u.status.toLowerCase()}</span> · {u._count.reportsReceived} reports
                </span>
                <Button size="sm" variant="secondary" disabled={reason.trim().length < 5} onClick={() => apply(u)}>
                  Apply
                </Button>
              </li>
            ))}
            {!data.length && <li className="p-4 text-sm text-ink-muted">No members found.</li>}
          </ul>
        </>
      )}
    </div>
  );
}

function AuditLog() {
  const { data, loading, error, reload } = useResource<AuditRow[]>("/admin/audit-log");
  if (loading && !data) return <LoadingBlock />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  return (
    <div className="overflow-x-auto rounded-3xl border hairline bg-white/70">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wider text-ink-muted">
          <tr>
            <th className="p-3">When</th>
            <th className="p-3">Action</th>
            <th className="p-3">Actor role</th>
            <th className="p-3">Target</th>
          </tr>
        </thead>
        <tbody className="divide-y hairline">
          {data?.map((a) => (
            <tr key={a.id}>
              <td className="whitespace-nowrap p-3">{new Date(a.createdAt).toLocaleString()}</td>
              <td className="p-3 font-semibold">{a.action}</td>
              <td className="p-3">{a.actorRole?.toLowerCase() ?? "system"}</td>
              <td className="p-3 font-mono text-xs">
                {a.targetType} {a.targetId?.slice(0, 8)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
