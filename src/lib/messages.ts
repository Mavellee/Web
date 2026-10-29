import type { Message } from "./types";

const sameSend = (a: Message, b: Message) => !!a.clientId && a.clientId === b.clientId && a.senderId === b.senderId;

/**
 * Merges messages from the server into what's on screen: no duplicates (by id, or by the client id of a
 * message we sent ourselves), confirmed messages in server order, and our own unsent or failed messages
 * kept at the end until the server confirms them.
 */
export function mergeMessages(current: Message[], incoming: Message[]): Message[] {
  const local = current.filter((m) => (m.pending || m.failed) && !incoming.some((i) => sameSend(i, m)));
  const byId = new Map<string, Message>();
  for (const m of current) if (!m.pending && !m.failed) byId.set(m.id, m);
  for (const m of incoming) byId.set(m.id, m);
  const confirmed = [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  return [...confirmed, ...local];
}
