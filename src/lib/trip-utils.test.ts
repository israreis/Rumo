import { describe, expect, it } from "vitest";
import { computeStatus, daysUntil, formatDate } from "./trip-utils";

const today = new Date(2026, 10, 16); // 16/11/2026

describe("trip status", () => {
  it("is Planejando before the start date", () => {
    expect(computeStatus("2026-12-01", "2026-12-10", null, today)).toBe("planning");
  });
  it("is Em andamento between start and end", () => {
    expect(computeStatus("2026-11-10", "2026-11-20", null, today)).toBe("ongoing");
  });
  it("is Concluída after the end date", () => {
    expect(computeStatus("2026-10-01", "2026-10-10", null, today)).toBe("completed");
  });
  it("manual status overrides the dates", () => {
    expect(computeStatus("2026-12-01", "2026-12-10", "confirmed", today)).toBe("confirmed");
  });
});

describe("countdown and dates", () => {
  it("counts days until departure", () => {
    expect(daysUntil("2026-11-26", today)).toBe(10);
  });
  it("formats dates as dd/mm/aaaa", () => {
    expect(formatDate("2026-03-05")).toBe("05/03/2026");
  });
});
