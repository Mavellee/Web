import { useState } from "react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";

export function ConfirmDialog({ open, onClose, title, body, confirmLabel, onConfirm, danger }: { open: boolean; onClose: () => void; title: string; body: string; confirmLabel: string; onConfirm: () => Promise<void>; danger?: boolean }) {
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <p className="text-ink-soft">{body}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="quiet" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant={danger ? "danger" : "primary"}
          loading={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm();
              onClose();
            } finally {
              setBusy(false);
            }
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
