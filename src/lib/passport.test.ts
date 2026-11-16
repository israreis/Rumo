import { describe, expect, it } from "vitest";
import { maskPassport, normalizePassport, passportState, relTime } from "./passport";

describe("passport", () => {
  it("classifies the expiry date", () => {
    expect(passportState(null, "2026-11-16").kind).toBe("missing");
    expect(passportState("2026-11-01", "2026-11-16")).toEqual({ kind: "expired", days: 15 });
    expect(passportState("2027-03-01", "2026-11-16").kind).toBe("expiring");
    expect(passportState("2030-01-01", "2026-11-16").kind).toBe("ok");
  });

  it("warns when it ends less than 6 months after the next trip's return", () => {
    const trips = [{ name: "Reino Unido", end_date: "2027-10-31" }, { name: "Antiga", end_date: "2025-12-26" }];
    expect(passportState("2028-02-01", "2026-11-16", trips)).toEqual({ kind: "short-for-trip", trip: "Reino Unido", returnDate: "2027-10-31" });
    expect(passportState("2028-06-01", "2026-11-16", trips).kind).toBe("ok");
  });

  it("masks and normalizes the number", () => {
    expect(maskPassport("FX1234567")).toBe("•••••4567");
    expect(maskPassport(null)).toBe("—");
    expect(normalizePassport(" fx 123.456-7 ")).toBe("FX1234567");
    expect(relTime(10)).toBe("10 dias");
    expect(relTime(120)).toBe("4 meses");
  });
});
