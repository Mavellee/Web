import { useId, useRef, useState, type KeyboardEvent } from "react";
import { api, ApiError, photoUrl } from "../../lib/api";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Dialog } from "../ui/Dialog";
import { Icon } from "../ui/Icon";
import { IconButton } from "../ui/IconButton";
import { useToast } from "../ui/Toast";
import { MediaThumb, formatDuration } from "../media/MediaThumb";
import { VideoPlayer } from "../media/VideoPlayer";
import { cx } from "../../lib/format";
import type { MediaLimits, OwnMediaItem } from "../../lib/types";

const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm"];
const isVideoFile = (f: File) => VIDEO_TYPES.includes(f.type) || /\.(mp4|m4v|webm)$/i.test(f.name);

type Upload = { key: string; name: string; pct: number; error?: string; poster?: string };

/** Sends a multipart upload with real progress events (fetch has no upload progress). */
function send(url: string, form: FormData, onProgress: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
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
    xhr.send(form);
  });
}

/**
 * Reads a video's length and captures a still frame in the browser, before anything is uploaded.
 * The server re-checks the length itself; the frame becomes the poster shown until someone presses play.
 */
export function inspectVideo(file: File): Promise<{ durationMs: number; poster: Blob | null }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    v.playsInline = true;
    v.src = url;
    const done = (r: { durationMs: number; poster: Blob | null }) => {
      URL.revokeObjectURL(url);
      resolve(r);
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("This video couldn't be opened. Try an MP4 file."));
    };
    v.onloadedmetadata = () => {
      const durationMs = Number.isFinite(v.duration) ? Math.round(v.duration * 1000) : NaN;
      v.currentTime = Math.min(0.5, (v.duration || 1) / 4);
      v.onseeked = () => {
        try {
          const scale = Math.min(1, 1080 / Math.max(v.videoWidth, v.videoHeight, 1));
          const c = document.createElement("canvas");
          c.width = Math.round(v.videoWidth * scale);
          c.height = Math.round(v.videoHeight * scale);
          c.getContext("2d")!.drawImage(v, 0, 0, c.width, c.height);
          c.toBlob((b) => done({ durationMs, poster: b }), "image/jpeg", 0.85);
        } catch {
          done({ durationMs, poster: null });
        }
      };
    };
  });
}

/**
 * "Your Story" media workspace: photos and short videos in one ordered gallery, each with its own caption.
 * Captions are stored on the item itself, so they travel with it when you reorder.
 */
export function MediaWorkspace({ media, limits, onChange }: { media: OwnMediaItem[]; limits: MediaLimits; onChange: () => void }) {
  const photoInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const [replacing, setReplacing] = useState<OwnMediaItem | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [framing, setFraming] = useState<OwnMediaItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = media.find((m) => m.id === editingId) ?? null;
  const [removing, setRemoving] = useState<OwnMediaItem | null>(null);
  const [status, setStatus] = useState("");
  const toast = useToast();
  const photos = media.filter((m) => m.kind === "IMAGE").length;
  const videos = media.length - photos;
  const mb = (b: number) => Math.round(b / 1048576);

  const track = (u: Upload) => setUploads((list) => [...list, u]);
  const update = (key: string, patch: Partial<Upload>) => setUploads((list) => list.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  const drop = (key: string) =>
    setUploads((list) => {
      const u = list.find((x) => x.key === key);
      if (u?.poster) URL.revokeObjectURL(u.poster);
      return list.filter((x) => x.key !== key);
    });

  /** Validates in the browser for fast feedback; the server re-validates everything by content. */
  const prepare = async (file: File, key: string): Promise<{ url: string; form: FormData } | null> => {
    const form = new FormData();
    if (isVideoFile(file)) {
      if (file.size > limits.videoMaxBytes) return update(key, { error: `Videos can be up to ${mb(limits.videoMaxBytes)} MB.` }), null;
      let info;
      try {
        info = await inspectVideo(file);
      } catch (e) {
        return update(key, { error: e instanceof Error ? e.message : "This video couldn't be opened." }), null;
      }
      if (info.durationMs > limits.videoMaxSeconds * 1000 + 500) return update(key, { error: `Videos can be up to ${limits.videoMaxSeconds} seconds. This one is ${Math.round(info.durationMs / 1000)} seconds.` }), null;
      if (info.poster) update(key, { poster: URL.createObjectURL(info.poster) });
      form.append("video", file);
      if (info.poster) form.append("poster", info.poster, "poster.jpg");
      return { url: "/api/profiles/me/videos", form };
    }
    if (!PHOTO_TYPES.includes(file.type)) return update(key, { error: "Use a JPEG, PNG or WebP photo, or an MP4 or WebM video." }), null;
    if (file.size > limits.photoMaxBytes) return update(key, { error: `Photos can be up to ${mb(limits.photoMaxBytes)} MB.` }), null;
    form.append("photo", file);
    return { url: "/api/profiles/me/photos", form };
  };

  const addFiles = async (files: FileList | File[]) => {
    let p = photos;
    let v = videos;
    for (const file of Array.from(files)) {
      const key = `${file.name}-${file.size}-${Date.now()}-${Math.random()}`;
      const video = isVideoFile(file);
      track({ key, name: file.name, pct: 0 });
      if (video ? v >= limits.maxVideos : p >= limits.maxPhotos) {
        update(key, { error: video ? `You can add up to ${limits.maxVideos} videos.` : `You can add up to ${limits.maxPhotos} photos.` });
        continue;
      }
      const ready = await prepare(file, key);
      if (!ready) continue;
      try {
        await send(ready.url, ready.form, (pct) => update(key, { pct }));
        if (video) v++;
        else p++;
        drop(key);
        setStatus(`${video ? "Video" : "Photo"} added`);
        onChange();
      } catch (e) {
        update(key, { error: e instanceof Error ? e.message : "Upload failed." });
      }
    }
    for (const input of [photoInput, videoInput]) if (input.current) input.current.value = "";
  };

  const replace = async (item: OwnMediaItem, file: File) => {
    const key = `replace-${item.id}-${Date.now()}`;
    track({ key, name: file.name, pct: 0 });
    if (isVideoFile(file) !== (item.kind === "VIDEO")) return update(key, { error: item.kind === "VIDEO" ? "Replace a video with another video." : "Replace a photo with another photo." });
    const ready = await prepare(file, key);
    if (!ready) return;
    try {
      await send(`/api/profiles/me/photos/${item.id}/replace`, ready.form, (pct) => update(key, { pct }));
      drop(key);
      setStatus(`${item.kind === "VIDEO" ? "Video" : "Photo"} replaced; caption kept`);
      onChange();
    } catch (e) {
      update(key, { error: e instanceof Error ? e.message : "Upload failed." });
    }
  };

  const reorder = async (from: number, to: number) => {
    if (from === to || to < 0 || to >= media.length) return;
    const ids = media.map((m) => m.id);
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    try {
      await api.put("/profiles/me/photos/order", { ids });
      setStatus(`Moved to position ${to + 1}`);
      onChange();
    } catch {
      toast("Couldn't reorder.", "error");
    }
  };

  const makePrimary = async (m: OwnMediaItem) => {
    try {
      await api.put(`/profiles/me/photos/${m.id}/primary`);
      setStatus("Main photo updated");
      onChange();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Couldn't change your main photo.", "error");
    }
  };

  const remove = async (m: OwnMediaItem) => {
    try {
      await api.delete(`/profiles/me/photos/${m.id}`);
      setStatus(`${m.kind === "VIDEO" ? "Video" : "Photo"} removed`);
      onChange();
    } catch {
      toast("Couldn't remove that.", "error");
    }
  };

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_15rem] [&>*]:min-w-0">
      <div
        onDragOver={(e) => e.dataTransfer.types.includes("Files") && e.preventDefault()}
        onDrop={(e) => {
          if (e.dataTransfer.files.length) {
            e.preventDefault();
            void addFiles(e.dataTransfer.files);
          }
        }}
      >
        <div className="flex flex-col gap-3 rounded-[1.75rem] border-2 border-dashed border-primary/25 bg-surface/60 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">Add photos and short videos</p>
            <p className="text-sm text-ink-muted">
              {photos} of {limits.maxPhotos} photos · {videos} of {limits.maxVideos} videos (up to {limits.videoMaxSeconds} seconds, {mb(limits.videoMaxBytes)} MB). Drop files here, or:
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button size="sm" onClick={() => photoInput.current?.click()} disabled={photos >= limits.maxPhotos} icon={<Icon name="image" className="h-4 w-4" />}>
              Add photos
            </Button>
            <Button size="sm" variant="secondary" onClick={() => videoInput.current?.click()} disabled={videos >= limits.maxVideos} icon={<Icon name="video" className="h-4 w-4" />}>
              Add a video
            </Button>
          </div>
        </div>
        <input ref={photoInput} type="file" multiple accept={PHOTO_TYPES.join(",")} className="sr-only" aria-label="Choose photos to upload" onChange={(e) => e.target.files && addFiles(e.target.files)} />
        <input ref={videoInput} type="file" accept="video/mp4,video/webm,.mp4,.m4v,.webm" className="sr-only" aria-label="Choose a video to upload" onChange={(e) => e.target.files && addFiles(e.target.files)} />
        <input
          ref={replaceInput}
          type="file"
          accept={replacing?.kind === "VIDEO" ? "video/mp4,video/webm,.mp4,.m4v,.webm" : PHOTO_TYPES.join(",")}
          className="sr-only"
          aria-label="Choose a replacement file"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f && replacing) void replace(replacing, f);
            setReplacing(null);
            e.target.value = "";
          }}
        />

        {uploads.length > 0 && (
          <ul className="mt-4 space-y-2" aria-label="Uploads">
            {uploads.map((u) => (
              <li key={u.key} className="flex items-center gap-3 rounded-2xl border hairline bg-surface p-3 text-sm">
                {u.poster && <img src={u.poster} alt="" className="h-14 w-11 shrink-0 rounded-lg object-cover" />}
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-3">
                    <span className="truncate">{u.name}</span>
                    <span className={u.error ? "text-error" : "text-ink-muted"}>{u.error ? "" : `${u.pct}%`}</span>
                  </div>
                  {u.error ? (
                    <p role="alert" className="mt-1 text-error">
                      {u.error}{" "}
                      <button type="button" className="ml-1 text-xs font-semibold text-primary" onClick={() => drop(u.key)}>
                        Dismiss
                      </button>
                    </p>
                  ) : (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-parchment-deep" role="progressbar" aria-valuenow={u.pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Uploading ${u.name}`}>
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${u.pct}%` }} />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <ol className="mt-6 grid grid-cols-3 gap-2.5 sm:gap-3" aria-label="Your photos and videos, in display order">
          <li>
            <button
              type="button"
              onClick={() => (photos < limits.maxPhotos ? photoInput : videoInput).current?.click()}
              disabled={photos >= limits.maxPhotos && videos >= limits.maxVideos}
              className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-primary/25 bg-surface/70 text-sm font-semibold text-primary transition hover:border-primary hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon name="plus" className="h-6 w-6" />
              Add
            </button>
          </li>
          {media.map((m, i) => (
            <li
              key={m.id}
              draggable
              onDragStart={(e) => {
                setDragFrom(i);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragEnd={() => {
                setDragFrom(null);
                setDragOver(null);
              }}
              onDragOver={(e) => {
                if (dragFrom === null) return;
                e.preventDefault();
                setDragOver(i);
              }}
              onDrop={(e) => {
                if (dragFrom === null) return;
                e.preventDefault();
                void reorder(dragFrom, i);
                setDragFrom(null);
                setDragOver(null);
              }}
              className={cx("relative rounded-2xl transition", dragOver === i && dragFrom !== i && "ring-4 ring-primary/30", dragFrom === i && "opacity-50")}
            >
              <button type="button" onClick={() => setEditingId(m.id)} className="block w-full cursor-grab overflow-hidden rounded-2xl active:cursor-grabbing" aria-label={`Edit ${m.kind === "VIDEO" ? "video" : "photo"} ${i + 1}${m.isPrimary ? ", main photo" : ""}${m.caption ? `, caption: ${m.caption}` : ", no caption"}`}>
                <MediaThumb item={m} alt="" className="aspect-[4/5] w-full" rounded="rounded-2xl" />
              </button>
              <span className="pointer-events-none absolute bottom-1.5 left-1.5 flex flex-wrap gap-1">
                {m.isPrimary && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[0.65rem] font-semibold text-surface">
                    <Icon name="star" filled className="h-3 w-3" /> Main photo
                  </span>
                )}
              </span>
              <span className={cx("pointer-events-none absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full", m.caption ? "bg-surface/95 text-primary shadow-soft" : "bg-ink/35 text-surface")} aria-hidden="true">
                <Icon name="edit" className="h-3.5 w-3.5" />
              </span>
              {m.status !== "APPROVED" && <span className="pointer-events-none absolute inset-x-1.5 bottom-1.5 rounded-full bg-gold-soft px-2 py-0.5 text-center text-[0.65rem] font-semibold text-gold-ink">{m.status === "REJECTED" ? "Removed by review" : "In review"}</span>}
            </li>
          ))}
        </ol>
        {media.length === 0 && <p className="mt-4 rounded-2xl bg-parchment-deep/60 p-5 text-sm text-ink-soft">Nothing here yet. Start with one clear, recent photo of you — videos are optional.</p>}
        <p className="mt-3 text-sm text-ink-muted">Tap a photo or video to add a caption, reorder it or make it your main photo. You can also drag tiles to reorder. Videos are never used as your main photo.</p>
        <p className="sr-only" aria-live="polite">
          {status}
        </p>
      </div>
      <aside className="space-y-3 text-sm text-ink-soft">
        <h3 className="font-sans text-sm font-semibold text-ink">Media that feels like you</h3>
        <ul className="space-y-2">
          {["Recent, and clearly you — your face visible in your main photo", "Natural light beats filters", "A caption can add the story behind a photo", "Short clips work best: a laugh, a place, a hobby"].map((t) => (
            <li key={t} className="flex gap-2">
              <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              {t}
            </li>
          ))}
        </ul>
        <p className="text-xs text-ink-muted">We never edit or retouch your media. Location data is removed before saving, and videos never play automatically for others.</p>
      </aside>

      <FocusEditor photo={framing} onClose={() => setFraming(null)} onSaved={onChange} />
      {editing && (
        <ItemSheet
          key={editing.id}
          item={editing}
          index={media.findIndex((m) => m.id === editing.id)}
          total={media.length}
          max={limits.captionMax}
          onClose={() => setEditingId(null)}
          onSaved={onChange}
          onMove={(to) => reorder(media.findIndex((m) => m.id === editing.id), to)}
          onPrimary={() => makePrimary(editing)}
          onFraming={() => setFraming(editing)}
          onReplace={() => {
            setReplacing(editing);
            requestAnimationFrame(() => replaceInput.current?.click());
          }}
          onDelete={() => {
            setEditingId(null);
            setRemoving(editing);
          }}
        />
      )}
      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        title={removing?.kind === "VIDEO" ? "Delete this video?" : "Delete this photo?"}
        body="It's removed from your profile and deleted from our storage, along with its caption."
        confirmLabel="Delete"
        danger
        onConfirm={async () => {
          if (removing) await remove(removing);
        }}
      />
    </div>
  );
}

/**
 * One item, opened from the grid: a large preview, its own caption (counter, live preview, Cancel / Save),
 * and everything else you can do with it. Captions belong to the item, so they move with it.
 */
function ItemSheet({ item, index, total, max, onClose, onSaved, onMove, onPrimary, onFraming, onReplace, onDelete }: { item: OwnMediaItem; index: number; total: number; max: number; onClose: () => void; onSaved: () => void; onMove: (to: number) => void; onPrimary: () => void; onFraming: () => void; onReplace: () => void; onDelete: () => void }) {
  const id = useId();
  const [draft, setDraft] = useState(item.caption ?? "");
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const dirty = draft.trim() !== (item.caption ?? "");
  const kind = item.kind === "VIDEO" ? "video" : "photo";
  const save = async (caption: string | null) => {
    setBusy(true);
    try {
      await api.patch(`/profiles/me/photos/${item.id}`, { caption });
      onSaved();
      toast(caption ? "Caption saved" : "Caption removed");
      return true;
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Couldn't save the caption.", "error");
      return false;
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open onClose={onClose} title={item.caption ? "Edit caption" : "Add a caption"} description={`${item.kind === "VIDEO" ? "Video" : "Photo"} ${index + 1} of ${total}`}>
      <div className="space-y-4">
        <div className="overflow-hidden rounded-2xl bg-ink">
          {item.kind === "VIDEO" ? <VideoPlayer item={item} label="Your video" className="max-h-[40vh] w-full" /> : <img src={photoUrl(item.id)} alt="" style={{ objectPosition: `${item.focusX}% ${item.focusY}%` }} className="max-h-[40vh] w-full object-cover" />}
        </div>
        <div>
          <label htmlFor={id} className="sr-only">
            Caption
          </label>
          <textarea
            id={id}
            rows={2}
            value={draft}
            maxLength={max}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={item.kind === "VIDEO" ? "What's happening in this clip? (optional)" : "The story behind this photo (optional)"}
            aria-describedby={`${id}-count`}
            className="block w-full resize-y rounded-2xl border border-line bg-surface px-3.5 py-3 text-[0.95rem] focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
          />
          <p id={`${id}-count`} className="mt-1 text-right text-xs tabular-nums text-ink-muted" aria-live="polite">
            {draft.length}/{max}
          </p>
          <p className="min-h-[1.25rem] text-sm">
            {draft.trim() ? (
              <>
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">On your profile: </span>
                <span className="font-serif text-base italic text-ink-soft">{draft.trim()}</span>
              </>
            ) : (
              <span className="text-xs text-ink-muted">Captions are optional.</span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 border-t hairline pt-3">
          <IconButton icon="chevronLeft" size="sm" label={`Move ${kind} earlier`} disabled={index <= 0} onClick={() => onMove(index - 1)} />
          <IconButton icon="chevronRight" size="sm" label={`Move ${kind} later`} disabled={index >= total - 1} onClick={() => onMove(index + 1)} />
          {item.kind === "IMAGE" && !item.isPrimary && (
            <Button size="sm" variant="ghost" onClick={onPrimary} icon={<Icon name="star" className="h-4 w-4" />}>
              Make main photo
            </Button>
          )}
          {item.kind === "IMAGE" && (
            <Button size="sm" variant="ghost" onClick={onFraming} icon={<Icon name="edit" className="h-4 w-4" />}>
              Framing
            </Button>
          )}
          {item.kind === "VIDEO" && <span className="px-2 text-xs text-ink-muted">Video · {formatDuration(item.durationMs)}</span>}
          <Button size="sm" variant="ghost" onClick={onReplace} icon={<Icon name="upload" className="h-4 w-4" />}>
            Replace
          </Button>
          <Button size="sm" variant="ghost" className="!text-accent" onClick={onDelete} icon={<Icon name="close" className="h-4 w-4" />}>
            Delete
          </Button>
          {item.caption && !dirty && (
            <Button size="sm" variant="quiet" disabled={busy} onClick={() => save(null)}>
              Remove caption
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button loading={busy} disabled={!dirty} onClick={async () => (await save(draft.trim() || null)) && onClose()}>
            Save
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

/** Choose which part of a photo stays in view when it's cropped. The original is never changed. */
function FocusEditor({ photo, onClose, onSaved }: { photo: OwnMediaItem | null; onClose: () => void; onSaved: () => void }) {
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
            <span className="pointer-events-none absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface shadow-[0_0_0_2px_rgba(48,35,42,.6)]" style={{ left: `${f.x}%`, top: `${f.y}%` }} />
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
