import { useRef, useState } from "react";
import { ApiError } from "../../lib/api";
import { Photo } from "../ui/Photo";
import { Icon } from "../ui/Icon";
import { Spinner } from "../ui/Spinner";
import { useToast } from "../ui/Toast";

const MAX = 6;
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

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
      const res = await fetch("/api/profiles/me/photos", { method: "POST", body: form, credentials: "same-origin" });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new ApiError(res.status, json?.error?.code ?? "UPLOAD", json?.error?.message ?? "Upload failed.");
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
    const res = await fetch(`/api/profiles/me/photos/${id}`, { method: "DELETE", credentials: "same-origin" });
    if (res.ok) onChange();
    else setError("Couldn't remove that photo.");
  };

  const makeMain = async (id: string) => {
    const ids = [id, ...photos.map((p) => p.id).filter((x) => x !== id)];
    const res = await fetch("/api/profiles/me/photos/order", { method: "PUT", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) });
    if (res.ok) onChange();
  };

  return (
    <div>
      <ul className="grid grid-cols-3 gap-3">
        {photos.map((p, i) => (
          <li key={p.id} className="group relative">
            <Photo id={p.id} alt={i === 0 ? "Your main photo" : `Your photo ${i + 1}`} className="aspect-[4/5] w-full" rounded="rounded-2xl" />
            {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-ivory/90 px-2 py-0.5 text-[0.7rem] font-semibold text-plum">Main</span>}
            <div className="absolute inset-x-2 bottom-2 flex gap-1.5">
              {i > 0 && (
                <button type="button" onClick={() => makeMain(p.id)} className="flex-1 rounded-full bg-ivory/90 px-2 py-1 text-xs font-semibold text-ink">
                  Make main
                </button>
              )}
              <button type="button" onClick={() => remove(p.id)} className="rounded-full bg-ivory/90 p-1.5 text-rose-ink" aria-label={`Remove photo ${i + 1}`}>
                <Icon name="close" className="h-4 w-4" />
              </button>
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
      <p className="mt-3 text-sm text-ink-muted">Up to {MAX} photos, 5 MB each. We remove hidden location data from photos before saving them.</p>
    </div>
  );
}
