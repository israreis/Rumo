import { describe, expect, it } from "vitest";
import { conflictingIds, destinationForDay, nightsWithoutLodging, tripDays } from "./itinerary";

const dests = [
  { city: "Lisboa", country: "Portugal", arrival_date: "2026-12-16", departure_date: "2026-12-22" },
  { city: "Porto", country: "Portugal", arrival_date: "2026-12-22", departure_date: "2026-12-26" },
];

describe("itinerary", () => {
  it("creates one block per day including the return day", () => {
    expect(tripDays("2026-12-16", "2026-12-26")).toHaveLength(11);
  });
  it("uses the arriving city on a transfer day", () => {
    expect(destinationForDay("2026-12-22", dests)?.city).toBe("Porto");
    expect(destinationForDay("2026-12-20", dests)?.city).toBe("Lisboa");
  });
  it("flags nights without lodging", () => {
    const l = [{ check_in_date: "2026-12-16", check_out_date: "2026-12-22" }];
    expect(nightsWithoutLodging("2026-12-16", "2026-12-26", l)).toEqual(["2026-12-22", "2026-12-23", "2026-12-24", "2026-12-25"]);
  });
  it("detects overlapping times", () => {
    const ids = conflictingIds([
      { id: "a", start: "10:00", end: "12:00" },
      { id: "b", start: "11:30", end: "13:00" },
      { id: "c", start: "13:00", end: "14:00" },
    ]);
    expect([...ids].sort()).toEqual(["a", "b"]);
  });
});
