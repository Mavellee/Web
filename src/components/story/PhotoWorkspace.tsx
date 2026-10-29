import { useRef, useState, type KeyboardEvent } from "react";
import { api, ApiError, photoUrl } from "../../lib/api";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Icon } from "../ui/Icon";
import { IconButton } from "../ui/IconButton";
import { Photo } from "../ui/Photo";
import { useToast } from "../ui/Toast";
import { cx } from "../../lib/format";

type P = { id: string; focusX: number; focusY: number };
const MAX = 6;
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Uploads one file with real progress events (fetch has no upload progress). */
function uploadWithProgress(file: File, onProgress: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/profiles/me/photos");
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let message = "Upload failed.";
      try {
        message = JSON.parse(xhr.responseText).error?.message ?? message;
      } catch {
        /* keep default */
      }
      reject(new ApiError(xhr.status, "UPLOAD", message));
    };
    xhr.onerror = () => reject(new ApiError(0, "NETWORK", "Upload failed. Check your connection."));
    const form = new FormData();
    form.append("photo", file);
    xhr.send(form);
  });
}

export function PhotoWorkspace({ photos, onChange }: { photos: P[]; onChange: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<{ name: string; pct: number; error?: string }[]>([]);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [framing, setFraming] = useState<P | null>(null);
  const [status, setStatus] = useState("");
  const toast = useToast();

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).slice(0, MAX - photos.length);
    for (const file of list) {
      const name = file.name;
      if (!TYPES.includes(file.type) || file.size > MAX_BYTES) {
        setUploads((u) => [...u, { name, pct: 0, error: !TYPES.includes(file.type) ? "Use a JPEG, PNG or WebP photo." : "This photo is over 5 MB." }]);
        continue;
      }
      setUploads((u) => [...u, { name, pct: 0 }]);
      try {
        await uploadWithProgress(file, (pct) => setUploads((u) => u.map((x) => (x.name === name ? { ...x, pct } : x))));
        setUploads((u) => u.filter((x) => x.name !== name));
        onChange();
      } catch (e) {
        setUploads((u) => u.map((x) => (x.name === name ? { ...x, error: e instanceof Error ? e.message : "Upload failed." } : x)));
      }
    }
    if (input.current) input.current.value = "";
  };

  const reorder = async (from: number, to: number) => {
    if (from === to || to < 0 || to >= photos.length) return;
    const ids = photos.map((p) => p.id);
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    try {
      await api.put("/profiles/me/photos/order", { ids });
      setStatus(to === 0 ? "Main photo updated" : `Photo moved to position ${to + 1}`);
      onChange();
    } catch {
      toast("Couldn't reorder photos.", "error");
    }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/profiles/me/photos/${id}`);
      setStatus("Photo removed");
      onChange();
    } catch {
      toast("Couldn't remove that photo.", "error");
    }
  };

  const slot = (i: number) => {
    const p = photos[i];
    const primary = i === 0;
    if (!p) {
      const next = i === photos.length;
      return (
        <button
          key={`empty-${i}`}
          type="button"
          onClick={() => input.current?.click()}
          disabled={!next}
          className={cx(
            "flex h-full w-full flex-col items-center justify-center gap-2 rounded-[1.5rem] border-2 border-dashed text-sm transition",
            next ? "border-plum/30 bg-white/60 font-semibold text-plum hover:border-plum hover:bg-white" : "border-[#E7DCD1] bg-transparent text-ink-muted",
          )}
          aria-label={next ? (primary ? "Add your main photo" : "Add a photo") : `Empty photo slot ${i + 1}`}
        >
          {next && <Icon name="plus" className="h-6 w-6" />}
          <span>{next ? (primary ? "Add your main photo" : "Add photo") : "Empty"}</span>
        </button>
      );
    }
    return (
      <div
        key={p.id}
        draggable
        onDragStart={() => setDragFrom(i)}
        onDragEnd={() => {
          setDragFrom(null);
          setDragOver(null);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(i);
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (dragFrom !== null) void reorder(dragFrom, i);
          setDragFrom(null);
          setDragOver(null);
        }}
        className={cx("group relative h-full w-full cursor-grab overflow-hidden rounded-[1.5rem] transition active:cursor-grabbing", dragOver === i && dragFrom !== i && "ring-4 ring-plum/40", dragFrom === i && "opacity-50")}
      >
        <Photo id={p.id} focus={p} alt={primary ? "Your main photo" : `Your photo ${i + 1}`} className="h-full w-full" rounded="rounded-[1.5rem]" />
        <span className="absolute left-2.5 top-2.5 rounded-full bg-ivory/95 px-2.5 py-0.5 text-[0.7rem] font-semibold text-ink shadow-soft">{primary ? "Main photo" : i + 1}</span>
        <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-1">
          <div className="flex gap-1">
            <IconButton icon="chevronLeft" size="sm" tone="soft" label={`Move photo ${i + 1} earlier`} disabled={i === 0} onClick={() => reorder(i, i - 1)} />
            <IconButton icon="chevronRight" size="sm" tone="soft" label={`Move photo ${i + 1} later`} disabled={i === photos.length - 1} onClick={() => reorder(i, i + 1)} />
          </div>
          <div className="flex gap-1">
            <IconButton icon="edit" size="sm" tone="soft" label={`Adjust framing of photo ${i + 1}`} onClick={() => setFraming(p)} />
            <IconButton icon="close" size="sm" tone="soft" className="!text-rose-ink" label={`Remove photo ${i + 1}`} onClick={() => remove(p.id)} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_15rem] [&>*]:min-w-0">
      <div>
        <div
          className="grid grid-cols-3 gap-3"
          onDragOver={(e) => e.dataTransfer.types.includes("Files") && e.preventDefault()}
          onDrop={(e) => {
            if (e.dataTransfer.files.length) {
              e.preventDefault();
              void addFiles(e.dataTransfer.files);
            }
          }}
        >
          <div className="col-span-2 row-span-2 aspect-[4/5]">{slot(0)}</div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="aspect-[4/5]">
              {slot(i)}
            </div>
          ))}
        </div>
        <input ref={input} type="file" multiple accept={TYPES.join(",")} className="sr-only" aria-label="Choose photos to upload" onChange={(e) => e.target.files && addFiles(e.target.files)} />
        {uploads.length > 0 && (
          <ul className="mt-4 space-y-2" aria-label="Uploads">
            {uploads.map((u) => (
              <li key={u.name} className="rounded-2xl border hairline bg-white p-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="truncate">{u.name}</span>
                  <span className={u.error ? "text-rose-ink" : "text-ink-muted"}>{u.error ?? `${u.pct}%`}</span>
                </div>
                {!u.error && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ivory-deep" role="progressbar" aria-valuenow={u.pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Uploading ${u.name}`}>
                    <div className="h-full rounded-full bg-plum transition-all" style={{ width: `${u.pct}%` }} />
                  </div>
                )}
                {u.error && (
                  <button type="button" className="mt-1 text-xs font-semibold text-plum" onClick={() => setUploads((x) => x.filter((y) => y.name !== u.name))}>
                    Dismiss
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-sm text-ink-muted">Drag photos to reorder, or use the arrows. You can also drop image files straight onto the grid.</p>
        <p className="sr-only" aria-live="polite">
          {status}
        </p>
      </div>
      <aside className="space-y-3 text-sm text-ink-soft">
        <h3 className="font-sans text-sm font-semibold text-ink">Photos that feel like you</h3>
        <ul className="space-y-2">
          {["Recent, and clearly you — your face visible in the first one", "Natural light beats filters", "One doing something you love", "Avoid group shots as your main photo"].map((t) => (
            <li key={t} className="flex gap-2">
              <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-sage-ink" />
              {t}
            </li>
          ))}
        </ul>
        <p className="text-xs text-ink-muted">We never edit or retouch your photos. Framing only chooses which part shows in a crop, and location data is removed before saving.</p>
      </aside>
      <FocusEditor photo={framing} onClose={() => setFraming(null)} onSaved={onChange} />
    </div>
  );
}

/** Choose which part of a photo stays in view when it's cropped. The original is never changed. */
function FocusEditor({ photo, onClose, onSaved }: { photo: P | null; onClose: () => void; onSaved: () => void }) {
  const [focus, setFocus] = useState<{ x: number; y: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const f = focus ?? (photo ? { x: photo.focusX, y: photo.focusY } : { x: 50, y: 50 });
  const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
  const onKey = (e: KeyboardEvent) => {
    const d = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, -5], ArrowDown: [0, 5] }[e.key];
    if (!d) return;
    e.preventDefault();
    setFocus({ x: clamp(f.x + d[0]), y: clamp(f.y + d[1]) });
  };
  const close = () => {
    setFocus(null);
    onClose();
  };
  return (
    <Dialog open={!!photo} onClose={close} title="Adjust framing" description="Tap the part of the photo that should stay in view. Your photo itself isn't changed.">
      {photo && (
        <div className="space-y-4">
          <div
            role="slider"
            tabIndex={0}
            aria-label="Focal point"
            aria-valuetext={`${f.x}% from left, ${f.y}% from top`}
            onKeyDown={onKey}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setFocus({ x: clamp(((e.clientX - r.left) / r.width) * 100), y: clamp(((e.clientY - r.top) / r.height) * 100) });
            }}
            className="relative cursor-crosshair overflow-hidden rounded-2xl"
          >
            <img src={photoUrl(photo.id)} alt="" className="max-h-[50vh] w-full object-contain" draggable={false} />
            <span className="pointer-events-none absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(48,40,50,.6)]" style={{ left: `${f.x}%`, top: `${f.y}%` }} />
          </div>
          <div className="flex items-end gap-3" aria-label="Crop previews">
            <img src={photoUrl(photo.id)} alt="" className="aspect-[4/5] w-24 rounded-xl object-cover" style={{ objectPosition: `${f.x}% ${f.y}%` }} />
            <img src={photoUrl(photo.id)} alt="" className="aspect-[16/10] w-36 rounded-xl object-cover" style={{ objectPosition: `${f.x}% ${f.y}%` }} />
            <img src={photoUrl(photo.id)} alt="" className="h-14 w-14 rounded-full object-cover" style={{ objectPosition: `${f.x}% ${f.y}%` }} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="quiet" onClick={close}>
              Cancel
            </Button>
            <Button
              loading={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await api.patch(`/profiles/me/photos/${photo.id}`, { focusX: f.x, focusY: f.y });
                  toast("Framing saved");
                  onSaved();
                  close();
                } catch {
                  toast("Couldn't save framing.", "error");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Save framing
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
