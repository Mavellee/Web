import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "./auth";

type Status = "connecting" | "connected" | "reconnecting" | "offline";
const SocketContext = createContext<{ socket: Socket | null; status: Status }>({ socket: null, status: "offline" });

/** One authenticated socket per signed-in, active session. Reconnects automatically. */
export function SocketProvider({ children }: { children: ReactNode }) {
  const { account, refresh } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<Status>("offline");
  const active = account?.status === "ACTIVE";

  useEffect(() => {
    if (!active) return;
    const s = io({ path: "/socket.io", withCredentials: true, reconnectionDelayMax: 8000 });
    setSocket(s);
    setStatus("connecting");
    s.on("connect", () => setStatus("connected"));
    s.on("disconnect", (reason) => {
      setStatus("reconnecting");
      // The server only drops a socket itself when its session was revoked (logout elsewhere, suspension).
      if (reason === "io server disconnect") void refresh();
    });
    s.on("connect_error", () => setStatus("reconnecting"));
    return () => {
      s.close();
      setSocket(null);
      setStatus("offline");
    };
  }, [active, refresh]);

  return <SocketContext.Provider value={{ socket, status }}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);

/** Subscribes to a socket event for the lifetime of the component. */
export function useSocketEvent<T>(event: string, handler: (payload: T) => void) {
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket) return;
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, [socket, event, handler]);
}
