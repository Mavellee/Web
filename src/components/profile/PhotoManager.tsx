import { useRef, useState } from "react";
import { api, ApiError } from "../../lib/api";
import { Photo } from "../ui/Photo";
import { Icon } from "../ui/Icon";
import { IconButton } from "../ui/IconButton";
import { Spinner } from "../ui/Spinner";
import { useToast } from "../ui/Toast";

const MAX = 6;
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Upload, remove and reorder photos. Order is saved to the server on every move. */
export function PhotoManager({ photos, onChange }: { photos: { id: string }[]; onChange: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const upload = async (file: File) => {
    setError(null);
    if (!TYPES.includes(file.type)) return setError("Please choose a JPEG, PNG or WebP image.");
    if (file.size > MAX_BYTES) return setError("That photo is over 5 MB. Try a smaller one.");
    setBusy(true);
    try {
      const form = new FormData();
      form.append("photo", file);
      await api.post("/profiles/me/photos", form);
      toast("Photo added");
      onChange();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Upload failed. Please try again.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/profiles/me/photos/${id}`);
      toast("Photo removed", "info");
      onChange();
    } catch {
      setError("Couldn't remove that photo.");
    }
  };

  const move = async (from: number, to: number) => {
    const ids = photos.map((p) => p.id);
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    try {
      await api.put("/profiles/me/photos/order", { ids });
      onChange();
    } catch {
      setError("Couldn't reorder photos.");
    }
  };

  return (
    <div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((p, i) => (
          <li key={p.id} className="relative">
            <Photo id={p.id} alt={i === 0 ? "Your main photo" : `Your photo ${i + 1}`} className="aspect-[4/5] w-full" rounded="rounded-2xl" position="object-top" />
            <span className="absolute left-2 top-2 rounded-full bg-ivory/95 px-2 py-0.5 text-[0.7rem] font-semibold text-ink">{i === 0 ? "Main photo" : i + 1}</span>
            <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-1">
              <div className="flex gap-1">
                <IconButton icon="chevronLeft" label={`Move photo ${i + 1} earlier`} tone="soft" size="sm" disabled={i === 0} onClick={() => move(i, i - 1)} />
                <IconButton icon="chevronRight" label={`Move photo ${i + 1} later`} tone="soft" size="sm" disabled={i === photos.length - 1} onClick={() => move(i, i + 1)} />
              </div>
              <IconButton icon="close" label={`Remove photo ${i + 1}`} tone="soft" size="sm" className="!text-rose-ink" onClick={() => remove(p.id)} />
            </div>
          </li>
        ))}
        {photos.length < MAX && (
          <li>
            <button
              type="button"
              onClick={() => input.current?.click()}
              disabled={busy}
              className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-plum/25 bg-white/50 text-sm font-semibold text-plum transition hover:border-plum/50 hover:bg-white"
            >
              {busy ? <Spinner label="Uploading" /> : <Icon name="plus" className="h-6 w-6" />}
              {busy ? "Uploading…" : "Add photo"}
            </button>
          </li>
        )}
      </ul>
      <input ref={input} type="file" accept={TYPES.join(",")} className="sr-only" aria-label="Choose a photo to upload" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      {error && (
        <p role="alert" className="mt-3 text-sm text-rose-ink">
          {error}
        </p>
      )}
      <p className="mt-3 text-sm text-ink-muted">Up to {MAX} photos, 5 MB each. Your first photo is shown first. We remove hidden location data from photos before saving them.</p>
    </div>
  );
}
