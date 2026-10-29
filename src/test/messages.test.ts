import { describe, expect, it } from "vitest";
import { mergeMessages } from "../lib/messages";
import type { Message } from "../lib/types";

const msg = (id: string, at: number, over: Partial<Message> = {}): Message => ({ id, conversationId: "c", senderId: "me", kind: "TEXT", body: id, hasAttachment: false, clientId: null, createdAt: new Date(at).toISOString(), ...over });

describe("mergeMessages", () => {
  it("adds missed messages after a reconnect, in server order, without duplicates", () => {
    const onScreen = [msg("a", 1000), msg("b", 2000)];
    const fromServer = [msg("b", 2000), msg("c", 3000), msg("d", 2500)];
    expect(mergeMessages(onScreen, fromServer).map((m) => m.id)).toEqual(["a", "b", "d", "c"]);
  });

  it("replaces our own pending message with the server's copy, and keeps unsent ones at the end", () => {
    const pending = msg("tmp-1", 9000, { clientId: "k1", pending: true });
    const failed = msg("tmp-2", 9500, { clientId: "k2", failed: true });
    const confirmed = msg("srv-1", 4000, { clientId: "k1" });
    const out = mergeMessages([msg("a", 1000), pending, failed], [confirmed]);
    expect(out.map((m) => m.id)).toEqual(["a", "srv-1", "tmp-2"]);
    expect(out.some((m) => m.pending)).toBe(false);
  });

  it("is a no-op for an event we already have", () => {
    const list = [msg("a", 1000), msg("b", 2000)];
    expect(mergeMessages(list, [msg("b", 2000)])).toEqual(list);
  });
});
