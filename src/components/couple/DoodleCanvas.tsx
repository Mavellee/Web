import { useCallback, useEffect, useRef, useState } from "react";
import { paintStrokes, type Doodle, type Stroke } from "../../lib/couple";
import { useSocket, useSocketEvent } from "../../lib/socket";
import { cx } from "../../lib/format";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { useToast } from "../ui/Toast";

const COLOURS = ["#30232A", "#641E32", "#A83F55", "#D9A0A7", "#C6A15B", "#3F6B5C", "#3D5A80"];
const SIZES = [6, 14, 30];
const CANVAS = 1000;
const MAX_POINTS = 800; // the server's per-stroke limit; longer lines continue as a new stroke
const LIVE_MS = 60;

const newId = () => crypto.randomUUID().slice(0, 18);
type Ack = { ok: boolean; error?: { message: string } };
type Live = { doodleId: string; strokeId: string; c: string; s: number; e: boolean; p: number[] };

/** The shared canvas. Finished strokes are saved; pen movement in progress is only relayed to the partner. */
export function DoodleCanvas({ doodle, matchId, me }: { doodle: Doodle; matchId: string; me: string }) {
  const { socket } = useSocket();
  const toast = useToast();
  const ref = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Stroke[]>(doodle.strokes);
  const theirLive = useRef(new Map<string, Stroke>());
  const current = useRef<Stroke | null>(null);
  const unsent = useRef<number[]>([]);
  const lastSent = useRef(0);
  const frame = useRef(0);
  const [colour, setColour] = useState(COLOURS[1]);
  const [size, setSize] = useState(SIZES[1]);
  const [erasing, setErasing] = useState(false);
  const [canUndo, setCanUndo] = useState(doodle.strokes.some((s) => s.by === me));

  const redraw = useCallback(() => {
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const ctx = ref.current?.getContext("2d");
      if (!ctx) return;
      paintStrokes(ctx, [...strokes.current, ...theirLive.current.values(), ...(current.current ? [current.current] : [])], CANVAS);
    });
  }, []);

  useEffect(() => {
    strokes.current = doodle.strokes;
    theirLive.current.clear();
    setCanUndo(doodle.strokes.some((s) => s.by === me));
    redraw();
  }, [doodle, me, redraw]);
  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
      frame.current = 0; // otherwise a re-run effect would think a paint is still queued, and never paint again
    },
    [],
  );

  useSocketEvent<Live>(
    "doodle:live",
    useCallback(
      (e) => {
        if (e.doodleId !== doodle.id) return;
        const st = theirLive.current.get(e.strokeId);
        if (st) st.p.push(...e.p);
        else theirLive.current.set(e.strokeId, { id: e.strokeId, c: e.c, s: e.s, e: e.e, p: [...e.p] });
        redraw();
      },
      [doodle.id, redraw],
    ),
  );
  useSocketEvent<{ doodleId: string; stroke: Stroke }>(
    "doodle:stroke",
    useCallback(
      (e) => {
        if (e.doodleId !== doodle.id) return;
        theirLive.current.delete(e.stroke.id);
        strokes.current = [...strokes.current, e.stroke];
        redraw();
      },
      [doodle.id, redraw],
    ),
  );
  useSocketEvent<{ doodleId: string; strokeId: string }>(
    "doodle:undo",
    useCallback(
      (e) => {
        if (e.doodleId !== doodle.id) return;
        strokes.current = strokes.current.filter((s) => s.id !== e.strokeId);
        redraw();
      },
      [doodle.id, redraw],
    ),
  );

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const clamp = (v: number) => Math.max(0, Math.min(CANVAS, Math.round(v)));
    return [clamp(((e.clientX - box.left) / box.width) * CANVAS), clamp(((e.clientY - box.top) / box.height) * CANVAS)];
  };
  const flushLive = () => {
    const st = current.current;
    if (!st || unsent.current.length < 2) return;
    socket?.volatile.emit("doodle:live", { matchId, doodleId: doodle.id, strokeId: st.id, c: st.c, s: st.s, e: st.e, p: unsent.current.slice(0, 200) });
    unsent.current = [];
    lastSent.current = Date.now();
  };
  const commit = () => {
    const st = current.current;
    if (!st) return;
    current.current = null;
    unsent.current = [];
    const mineStroke = { ...st, by: me };
    strokes.current = [...strokes.current, mineStroke];
    setCanUndo(true);
    redraw();
    socket?.emit("doodle:stroke", { doodleId: doodle.id, stroke: st }, (r: Ack) => {
      if (r.ok) return;
      strokes.current = strokes.current.filter((s) => s.id !== st.id);
      redraw();
      toast(r.error?.message ?? "That stroke didn't save.", "error");
    });
  };
  const begin = (p: number[]) => {
    current.current = { id: newId(), c: erasing ? "#000000" : colour, s: erasing ? Math.max(size, 30) : size, e: erasing, p };
    unsent.current = [...p];
  };
  const undo = () => {
    socket?.emit("doodle:undo", { doodleId: doodle.id }, (r: Ack & { data?: { strokeId: string | null } }) => {
      if (!r.ok) return toast(r.error?.message ?? "Couldn't undo.", "error");
      strokes.current = strokes.current.filter((s) => s.id !== r.data?.strokeId);
      setCanUndo(strokes.current.some((s) => s.by === me));
      redraw();
    });
  };

  return (
    <div>
      <canvas
        ref={ref}
        width={CANVAS}
        height={CANVAS}
        aria-label="Shared doodle canvas"
        className="aspect-square w-full cursor-crosshair touch-none rounded-3xl border hairline bg-surface"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          begin(point(e));
          redraw();
        }}
        onPointerMove={(e) => {
          const st = current.current;
          if (!st) return;
          const p = point(e);
          // Long lines continue as a new stroke from the same point, so nothing is cut off.
          if (st.p.length + 2 > MAX_POINTS) {
            commit();
            begin(p);
          } else {
            st.p.push(...p);
            unsent.current.push(...p);
          }
          if (Date.now() - lastSent.current > LIVE_MS) flushLive();
          redraw();
        }}
        onPointerUp={commit}
        onPointerCancel={commit}
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {COLOURS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Colour ${c}`}
            aria-pressed={!erasing && colour === c}
            onClick={() => {
              setColour(c);
              setErasing(false);
            }}
            style={{ backgroundColor: c }}
            className={cx("h-8 w-8 rounded-full border-2", !erasing && colour === c ? "border-gold ring-2 ring-gold/40" : "border-surface")}
          />
        ))}
        <span className="mx-1 h-6 w-px bg-ink/10" aria-hidden="true" />
        {SIZES.map((s) => (
          <button key={s} type="button" aria-label={`Brush size ${s}`} aria-pressed={size === s} onClick={() => setSize(s)} className={cx("flex h-8 w-8 items-center justify-center rounded-full border", size === s ? "border-primary bg-primary-50" : "hairline bg-surface")}>
            <span className="rounded-full bg-ink" style={{ width: 4 + s / 2.5, height: 4 + s / 2.5 }} />
          </button>
        ))}
        <span className="flex-1" />
        <Button size="sm" variant={erasing ? "primary" : "secondary"} onClick={() => setErasing((x) => !x)} aria-pressed={erasing}>
          Eraser
        </Button>
        <Button size="sm" variant="secondary" onClick={undo} disabled={!canUndo}>
          <Icon name="undo" className="h-4 w-4" />
          Undo
        </Button>
      </div>
    </div>
  );
}
