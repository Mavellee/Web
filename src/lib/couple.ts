import type { PublicProfile } from "./types";
import type { CatalogGame } from "../components/chatgames/types";

export type CoupleState = { status: "NONE" | "REQUESTED_BY_ME" | "REQUESTED_BY_THEM" | "ACTIVE"; startedAt: string | null };
export type CoupleSpace = { matchId: string; conversationId: string | null; startedAt: string; partner: PublicProfile; games: CatalogGame[] };
export type Stroke = { id: string; c: string; s: number; e: boolean; p: number[]; by?: string };
export type DoodleMeta = { id: string; createdById: string; createdAt: string; updatedAt: string };
export type Doodle = DoodleMeta & { strokes: Stroke[] };

/** Paints strokes (x,y pairs on a 0-1000 square) onto a canvas of any size. */
export function paintStrokes(ctx: CanvasRenderingContext2D, strokes: Stroke[], size: number) {
  const k = size / 1000;
  ctx.clearRect(0, 0, size, size);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const st of strokes) {
    ctx.globalCompositeOperation = st.e ? "destination-out" : "source-over";
    ctx.strokeStyle = st.c;
    ctx.fillStyle = st.c;
    ctx.lineWidth = st.s * k;
    ctx.beginPath();
    ctx.moveTo(st.p[0] * k, st.p[1] * k);
    // A single tap still leaves a dot.
    if (st.p.length === 2) ctx.lineTo(st.p[0] * k + 0.01, st.p[1] * k);
    for (let i = 2; i < st.p.length; i += 2) ctx.lineTo(st.p[i] * k, st.p[i + 1] * k);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "source-over";
}
