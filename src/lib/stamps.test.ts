import { describe, expect, it } from "vitest";
import { collection, stampDate, tripStamps } from "./stamps";

const trip = {
  id: "t1",
  name: "Reino Unido e Islândia",
  end_date: "2027-10-31",
  trip_destinations: [
    { city: "Londres", country: "Reino Unido", arrival_date: "2027-10-16" },
    { city: "Edimburgo", country: "Reino Unido", arrival_date: "2027-10-20" },
    { city: "Ilha de Skye (Portree)", country: "Reino Unido", arrival_date: "2027-10-23" },
    { city: "Edimburgo", country: "Reino Unido", arrival_date: "2027-10-25" },
    { city: "Reykjavík", country: "Islândia", arrival_date: "2027-10-28" },
  ],
};

describe("stamps", () => {
  it("formats the date like a stamp", () => {
    expect(stampDate("2027-10-21")).toBe("21 OUT 2027");
  });

  it("makes one stamp per country, entered through the first city, only", () => {
    const s = tripStamps(trip, "2027-10-24");
    expect(s.map((x) => x.main)).toEqual(["Reino Unido", "Islândia"]);
    expect(s[0]!.top).toBe("Londres");
    expect(s[0]!.bottom).toBe("16 OUT 2027");
    expect(s.filter((x) => x.earned).map((x) => x.main)).toEqual(["Reino Unido"]);
    expect(Math.abs(s[0]!.tilt)).toBeLessThanOrEqual(7);
  });

  it("counts cities and countries of the collected stamps only", () => {
    const c = collection([trip], "2027-11-01");
    expect(c.earned).toHaveLength(2);
    expect(c.pending).toHaveLength(0);
    expect(c.cities).toBe(4);
    expect(c.countries).toBe(2);
    expect(collection([trip], "2027-10-01").earned).toHaveLength(0);
  });

  it("lists each country only once in 'para carimbar'", () => {
    const again = { ...trip, id: "t3", end_date: "2028-05-10", trip_destinations: [{ city: "Manchester", country: "Reino Unido", arrival_date: "2028-05-01" }] };
    const c = collection([trip, again], "2027-10-01");
    expect(c.pending.map((x) => x.main)).toEqual(["Reino Unido", "Islândia"]);
  });

  it("a finished trip stamps all its countries, even with arrival dates left in the future", () => {
    const done = {
      id: "t2", name: "Lisboa e Porto", end_date: "2025-12-26",
      trip_destinations: [
        { city: "Lisboa", country: "Portugal", arrival_date: "2026-12-16" },
        { city: "Porto", country: "Portugal", arrival_date: null },
      ],
    };
    const c = collection([done], "2026-11-16");
    expect(c.earned).toHaveLength(1);
    expect(c.cities).toBe(2);
    expect(c.countries).toBe(1);
    expect(c.earned.find((x) => x.main === "Portugal")!.bottom).toBe("26 DEZ 2025");
  });
});
