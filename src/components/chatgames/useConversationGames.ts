import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api";
import { useSocket, useSocketEvent } from "../../lib/socket";
import { useToast } from "../ui/Toast";
import { isLive, type GameView } from "./types";

/**
 * Authoritative game state for one conversation, always loaded from the server.
 * Socket events only say "session X changed"; we then fetch our own private view.
 */
export function useConversationGames(conversationId: string) {
  const [sessions, setSessions] = useState<Record<string, GameView>>({});
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { socket } = useSocket();
  const toast = useToast();
  const base = `/conversations/${conversationId}/games`;

  const put = useCallback((v: GameView) => setSessions((s) => (s[v.id] && s[v.id].version > v.version ? s : { ...s, [v.id]: v })), []);

  const loadAll = useCallback(async () => {
    try {
      const list = await api.get<GameView[]>(base);
      setSessions(Object.fromEntries(list.map((v) => [v.id, v])));
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't load games.");
    } finally {
      setLoaded(true);
    }
  }, [base]);

  const refresh = useCallback(
    async (sessionId: string) => {
      try {
        put(await api.get<GameView>(`${base}/${sessionId}`));
      } catch {
        /* the next event or reload will catch up */
      }
    },
    [base, put],
  );

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  // Restore state after the socket reconnects (we may have missed events while offline).
  useEffect(() => {
    if (!socket) return;
    const onConnect = () => void loadAll();
    socket.on("connect", onConnect);
    return () => {
      socket.off("connect", onConnect);
    };
  }, [socket, loadAll]);

  useSocketEvent<{ conversationId: string; sessionId: string }>(
    "game:updated",
    useCallback((e) => e.conversationId === conversationId && void refresh(e.sessionId), [conversationId, refresh]),
  );

  useSocketEvent<{ userId: string; online: boolean }>(
    "presence",
    useCallback(
      (p) =>
        setSessions((all) =>
          Object.fromEntries(Object.entries(all).map(([id, v]) => [id, { ...v, participants: v.participants.map((x) => (x.userId === p.userId ? { ...x, online: p.online } : x)) }])),
        ),
      [],
    ),
  );

  const start = useCallback(
    async (gameSlug: string) => {
      const v = await api.post<GameView>(base, { gameSlug });
      put(v);
      return v;
    },
    [base, put],
  );

  /** Runs a game command; the server's response is the new truth. Errors are shown, never hidden. */
  const act = useCallback(
    async (sessionId: string, action: string, body: object = {}) => {
      try {
        const v = await api.post<GameView>(`${base}/${sessionId}/${action}`, body);
        put(v);
        return true;
      } catch (e) {
        toast(e instanceof ApiError ? e.message : "That didn't go through. Try again.", "error");
        if (e instanceof ApiError && e.status === 409) void refresh(sessionId);
        return false;
      }
    },
    [base, put, refresh, toast],
  );

  const live = Object.values(sessions).find(isLive) ?? null;
  return { sessions, live, loaded, error, start, act, refresh };
}

export type ConversationGames = ReturnType<typeof useConversationGames>;
