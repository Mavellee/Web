import { useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { IconButton } from "../ui/IconButton";
import { api, ApiError } from "../../lib/api";
import { REPORT_REASONS } from "../../lib/labels";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Checkbox, Select, Textarea } from "../ui/Field";
import { useToast } from "../ui/Toast";

/** Report dialog for a user, profile or a single message. */
export function ReportDialog({ open, onClose, userId, name, messageId, onDone }: { open: boolean; onClose: () => void; userId: string; name: string; messageId?: string; onDone?: (blocked: boolean) => void }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return setError("Choose a reason.");
    setBusy(true);
    setError(null);
    try {
      await api.post("/safety/reports", { userId, target: messageId ? "MESSAGE" : "PROFILE", messageId, reason, details: details || undefined, alsoBlock });
      toast("Thank you. Our team will review this.");
      onClose();
      onDone?.(alsoBlock);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't send the report.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={messageId ? "Report this message" : `Report ${name}`} description="Reports are confidential. We won't tell them who reported them.">
      <form onSubmit={submit} className="space-y-4">
        <Select label="What's happening?" value={reason} onChange={(e) => setReason(e.target.value)}>
          <option value="">Choose a reason…</option>
          {REPORT_REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>
        <Textarea label="Anything else we should know?" optional value={details} maxLength={1000} onChange={(e) => setDetails(e.target.value)} />
        <Checkbox label={`Also block ${name}`} checked={alsoBlock} onChange={(e) => setAlsoBlock(e.target.checked)} />
        {error && (
          <p role="alert" className="text-sm text-rose-ink">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="quiet" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" loading={busy}>
            Send report
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/** Report / block menu for a person. */
export function SafetyMenu({ userId, name, matchId, onEnded }: { userId: string; name: string; matchId?: string; onEnded?: () => void }) {
  const [open, setOpen] = useState<"menu" | "report" | "block" | "unmatch" | null>(null);
  const toast = useToast();
  const root = useRef<HTMLDivElement>(null);
  // Close the menu on outside click or Escape.
  useEffect(() => {
    if (open !== "menu") return;
    const onDown = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div className="relative" ref={root}>
      <IconButton icon="more" label={`Safety options for ${name}`} tone="soft" aria-haspopup="menu" aria-expanded={open === "menu"} onClick={() => setOpen(open === "menu" ? null : "menu")} />
      {open === "menu" && (
        <div role="menu" className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border hairline bg-ivory p-1.5 shadow-lift animate-rise">
          {matchId && (
            <button role="menuitem" className="block w-full rounded-xl px-3 py-2.5 text-left text-sm hover:bg-ink/5" onClick={() => setOpen("unmatch")}>
              Unmatch
            </button>
          )}
          <button role="menuitem" className="block w-full rounded-xl px-3 py-2.5 text-left text-sm hover:bg-ink/5" onClick={() => setOpen("block")}>
            Block {name}
          </button>
          <button role="menuitem" className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-rose-ink hover:bg-rose-soft" onClick={() => setOpen("report")}>
            Report {name}
          </button>
        </div>
      )}
      <ReportDialog open={open === "report"} onClose={() => setOpen(null)} userId={userId} name={name} onDone={(blocked) => blocked && onEnded?.()} />
      <ConfirmDialog
        open={open === "block"}
        onClose={() => setOpen(null)}
        title={`Block ${name}?`}
        body="You won't see each other anywhere on Knot, and any match or conversation will end. They won't be told."
        confirmLabel="Block"
        danger
        onConfirm={async () => {
          await api.post("/safety/blocks", { userId });
          toast(`${name} is blocked`, "info");
          onEnded?.();
        }}
      />
      {matchId && (
        <ConfirmDialog
          open={open === "unmatch"}
          onClose={() => setOpen(null)}
          title={`Unmatch with ${name}?`}
          body="Your conversation will close for both of you. This can't be undone."
          confirmLabel="Unmatch"
          danger
          onConfirm={async () => {
            await api.delete(`/matches/${matchId}`);
            toast("Unmatched", "info");
            onEnded?.();
          }}
        />
      )}
    </div>
  );
}
