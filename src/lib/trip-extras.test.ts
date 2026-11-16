import { describe, expect, it } from "vitest";
import { freeCancelSoon, passportTooShort, progressPct, tripDayOf } from "./trip-extras";

describe("trip extras", () => {
  it("alerts passport expiring under 6 months after return", () => {
    expect(passportTooShort("2027-05-01", "2026-12-10")).toBe(true);
    expect(passportTooShort("2027-06-10", "2026-12-10")).toBe(false);
  });
  it("warns free cancellation 3 days before", () => {
    const t = new Date(2026, 10, 16);
    const r = freeCancelSoon([{ free_cancel_until: "2026-11-19" }, { free_cancel_until: "2026-11-20" }, { free_cancel_until: "2026-11-15" }], t);
    expect(r.map((x) => x.daysLeft)).toEqual([3]);
  });
  it("computes Dia X de Y", () => {
    expect(tripDayOf("2026-11-10", "2026-11-19", new Date(2026, 10, 16))).toEqual({ day: 7, total: 10 });
    expect(tripDayOf("2026-11-20", "2026-11-29", new Date(2026, 10, 16))).toBeNull();
  });
  it("checklist progress %", () => expect(progressPct([{ done: true }, { done: false }, { done: false }])).toBe(33));
});
