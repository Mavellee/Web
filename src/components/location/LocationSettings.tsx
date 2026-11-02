import { useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api";
import { RADIUS_OPTIONS, watchPermission, type LocationView } from "../../lib/location";
import { timeAgo } from "../../lib/format";
import { useResource } from "../../lib/useResource";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Select } from "../ui/Field";
import { Skeleton } from "../ui/Skeleton";
import { Toggle } from "../ui/Toggle";
import { useToast } from "../ui/Toast";
import { LocationSetup } from "./LocationSetup";

/** Settings › Location & Discovery: where you are, how far to look, whether others see a distance, and removal. */
export function LocationSettings({ onChanged }: { onChanged?: () => void }) {
  const { data, setData, error, reload } = useResource<LocationView>("/location/me");
  const [permission, setPermission] = useState<PermissionState | null>(null);
  const toast = useToast();

  useEffect(() => {
    let stop = () => {};
    void watchPermission(setPermission).then((s) => (stop = s));
    return () => stop();
  }, []);

  const apply = (v: LocationView) => {
    setData(v);
    onChanged?.();
  };
  const prefs = async (patch: { maxDistanceKm?: number | null; showDistance?: boolean }) => {
    const prev = data;
    setData((d) => (d ? { ...d, ...patch } : d));
    try {
      apply(await api.patch<LocationView>("/location/preferences", patch));
      toast("Saved");
    } catch (e) {
      setData(prev);
      toast(e instanceof ApiError ? e.message : "Couldn't save.", "error");
    }
  };
  const remove = async () => {
    if (!window.confirm("Remove your location? Your saved place and approximate position are deleted now. Discover will stop using distance until you set it again.")) return;
    apply(await api.delete<LocationView>("/location/me"));
    toast("Your location has been removed.", "info");
  };

  return (
    <Card id="location" className="scroll-mt-24 px-6 py-2">
      <h2 className="pt-4 text-xl">Location &amp; Discovery</h2>
      {error ? (
        <p className="py-4 text-sm text-error">
          Couldn't load your location.{" "}
          <button type="button" className="font-semibold underline" onClick={reload}>
            Try again
          </button>
        </p>
      ) : !data ? (
        <Skeleton className="my-4 h-40" />
      ) : (
        <div className="space-y-5 pb-5 pt-3">
          <LocationSetup heading={false} value={data} onChange={apply} />
          {data.hasLocation && data.updatedAt && <p className="text-xs text-ink-muted">Last updated {timeAgo(data.updatedAt)}.</p>}
          {permission === "denied" && (
            <p className="rounded-2xl bg-gold-soft px-4 py-3 text-sm text-gold-ink">
              Location access is turned off for Mavelle in your browser or device settings. Choosing a place by hand still works.
              {data.source === "DEVICE" && " Your last approximate area is kept until you change or remove it."}
            </p>
          )}
          <Select
            label="Discovery distance"
            hint={data.hasLocation ? "Measured on our servers from your place. Nobody sees where you are." : "Set your location to use distance. Until then, Discover shows people anywhere."}
            value={data.maxDistanceKm ?? ""}
            onChange={(e) => void prefs({ maxDistanceKm: e.target.value ? Number(e.target.value) : null })}
          >
            {RADIUS_OPTIONS.map((r) => (
              <option key={r} value={r}>
                Within {r} km
              </option>
            ))}
            {/* A limit saved before these choices existed stays selected until the member picks another. */}
            {data.maxDistanceKm != null && !(RADIUS_OPTIONS as readonly number[]).includes(data.maxDistanceKm) && <option value={data.maxDistanceKm}>Within {data.maxDistanceKm} km (current)</option>}
            <option value="">Anywhere</option>
          </Select>
          <div className="divide-y hairline border-y hairline">
            <Toggle label="Show my approximate distance" description="Others see a range like “Within 5 km”, never your place or position. Turn off to show no distance at all." checked={data.showDistance} onChange={(v) => void prefs({ showDistance: v })} />
          </div>
          {data.hasLocation && (
            <Button variant="secondary" size="sm" onClick={() => void remove()}>
              Remove my location
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
