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

  it("makes one stamp per city, collected on arrival, plus the finished-trip stamp", () => {
    const s = tripStamps(trip, "2027-10-24");
    expect(s.map((x) => x.main)).toEqual(["Londres", "Edimburgo", "Ilha de Skye", "Reykjavík", "Concluída"]);
    expect(s.filter((x) => x.earned).map((x) => x.main)).toEqual(["Londres", "Edimburgo", "Ilha de Skye"]);
    expect(s[1]!.bottom).toBe("20 OUT 2027");
    expect(Math.abs(s[0]!.tilt)).toBeLessThanOrEqual(7);
  });

  it("counts cities and countries of the collected stamps only", () => {
    const c = collection([trip], "2027-11-01");
    expect(c.earned).toHaveLength(5);
    expect(c.pending).toHaveLength(0);
    expect(c.cities).toBe(4);
    expect(c.countries).toBe(2);
    expect(collection([trip], "2027-10-01").earned).toHaveLength(0);
  });
});
