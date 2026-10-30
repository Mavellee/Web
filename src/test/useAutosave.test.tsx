import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAutosave, type SaveStatus } from "../lib/useAutosave";

describe("useAutosave", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());
  const setup = (save: (v: string) => Promise<void>, enabled = true) => {
    const statuses: SaveStatus[] = [];
    const retries: (() => void)[] = [];
    const view = renderHook(({ v, on }) => useAutosave(v, save, { enabled: on, delay: 500, onStatus: (s, r) => (statuses.push(s), r && retries.push(r)) }), { initialProps: { v: "a", on: enabled } });
    return { ...view, statuses, retries };
  };

  it("does not save the starting value", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    setup(save);
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(save).not.toHaveBeenCalled();
  });

  it("debounces: many quick changes make one request, with the last value", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { rerender, statuses } = setup(save);
    for (const v of ["ab", "abc", "abcd"]) {
      rerender({ v, on: true });
      await act(() => vi.advanceTimersByTimeAsync(100));
    }
    await act(() => vi.advanceTimersByTimeAsync(600));
    expect(save.mock.calls).toEqual([["abcd"]]);
    expect(statuses).toEqual(expect.arrayContaining(["dirty", "saving", "saved"]));
  });

  it("runs saves in order, never two at once", async () => {
    const order: string[] = [];
    let release: () => void = () => {};
    const save = vi.fn((v: string) => {
      order.push(`start ${v}`);
      return v === "b" ? new Promise<void>((r) => (release = () => (order.push("end b"), r()))) : Promise.resolve();
    });
    const { rerender } = setup(save);
    rerender({ v: "b", on: true });
    await act(() => vi.advanceTimersByTimeAsync(600));
    rerender({ v: "c", on: true });
    await act(() => vi.advanceTimersByTimeAsync(600));
    expect(order).toEqual(["start b"]);
    await act(async () => release());
    expect(order).toEqual(["start b", "end b", "start c"]);
  });

  it("reports a failure and can retry it", async () => {
    const save = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue(undefined);
    const { rerender, statuses, retries } = setup(save);
    rerender({ v: "b", on: true });
    await act(() => vi.advanceTimersByTimeAsync(600));
    expect(statuses.at(-1)).toBe("error");
    await act(async () => retries[0]());
    expect(save).toHaveBeenCalledTimes(2);
    expect(statuses.at(-1)).toBe("saved");
  });

  it("waits while disabled and saves pending work on unmount", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { rerender, unmount } = setup(save, false);
    rerender({ v: "b", on: false });
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(save).not.toHaveBeenCalled();
    rerender({ v: "c", on: true });
    unmount();
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(save.mock.calls).toEqual([["c"]]);
  });
});
