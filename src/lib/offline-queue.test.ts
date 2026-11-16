import { beforeEach, describe, expect, it, vi } from "vitest";
import { enqueueExpense, isNetworkError, pendingExpenses, removePending, subscribePending } from "./offline-queue";

describe("offline expense queue", () => {
  beforeEach(() => localStorage.clear());

  it("stores, filters by trip, notifies and removes", () => {
    const seen = vi.fn();
    const off = subscribePending(seen);
    const a = enqueueExpense({ tripId: "t1", tripCurrency: "BRL", iofPct: 3.5, spreadPct: 4, row: { amount: 10, currency: "EUR" } });
    enqueueExpense({ tripId: "t2", tripCurrency: "BRL", iofPct: 0, spreadPct: 0, row: { amount: 5 } });
    expect(pendingExpenses()).toHaveLength(2);
    expect(pendingExpenses("t1").map((p) => p.id)).toEqual([a.id]);
    removePending(a.id);
    expect(pendingExpenses("t1")).toHaveLength(0);
    expect(seen).toHaveBeenCalledTimes(3);
    off();
  });

  it("recognises connection failures", () => {
    expect(isNetworkError(new TypeError("Failed to fetch"))).toBe(true);
    expect(isNetworkError({ message: "Load failed" })).toBe(true);
    expect(isNetworkError(new Error("duplicate key value"))).toBe(false);
  });
});
