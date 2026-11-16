import { describe, expect, it } from "vitest";
import { durationLabel, utcToZoned, zonedToUtc } from "./tz";

describe("timezones", () => {
  it("converts São Paulo wall time to UTC", () => {
    expect(zonedToUtc("2026-12-15T22:30", "America/Sao_Paulo")).toBe("2026-12-16T01:30:00.000Z");
  });
  it("round-trips Lisbon wall time", () => {
    expect(utcToZoned(zonedToUtc("2026-07-01T12:05", "Europe/Lisbon"), "Europe/Lisbon")).toBe("2026-07-01T12:05");
  });
  it("flight duration accounts for different timezones", () => {
    const dep = zonedToUtc("2026-12-15T22:30", "America/Sao_Paulo");
    const arr = zonedToUtc("2026-12-16T12:05", "Europe/Lisbon");
    expect(durationLabel(dep, arr)).toBe("10h 35min");
  });
});
