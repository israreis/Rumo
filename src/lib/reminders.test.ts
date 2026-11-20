import { describe, expect, it } from "vitest";
import { entryCheckTitle, entryInfo, foreignCountries, isEntryChecked } from "./entry-requirements";
import { buildReminders, upcomingReminders } from "./reminders";

const base = {
  trip: { id: "t", name: "Londres", start_date: "2027-03-10", end_date: "2027-03-20", trip_destinations: [{ country: "Reino Unido" }, { country: "Islândia" }, { country: "Reino Unido" }] },
  transports: [], lodgings: [], pending: [], checklist: [], docs: [],
};

describe("buildReminders", () => {
  it("avisa 1 semana e 1 dia antes e pede para conferir a entrada de cada país", () => {
    const r = buildReminders(base, "America/Sao_Paulo");
    expect(r.map((x) => x.id)).toEqual(["entry-Reino Unido", "entry-Islândia", "trip-7", "trip-1"]);
    expect(r.find((x) => x.id === "trip-1")?.date).toBe("2027-03-09");
  });

  it("check-in 24h antes do voo, no fuso do aparelho", () => {
    const r = buildReminders({ ...base, transports: [{ id: "f", type: "flight", origin: "GRU", destination: "LHR", code: "BA246", departure_at: "2027-03-10T23:00:00Z", departure_tz: "America/Sao_Paulo" }] }, "America/Sao_Paulo");
    const c = r.find((x) => x.kind === "checkin")!;
    expect([c.date, c.time]).toEqual(["2027-03-09", "20:00"]);
  });

  it("some com a entrada conferida e não repete o que já passou", () => {
    const checklist = [{ id: "1", title: entryCheckTitle("Reino Unido"), done: true, due_date: null }];
    const r = buildReminders({ ...base, checklist }, "UTC");
    expect(r.some((x) => x.id === "entry-Reino Unido")).toBe(false);
    expect(upcomingReminders(r, "2027-03-05").map((x) => x.id)).toEqual(["trip-1"]);
  });
});

describe("entry-requirements", () => {
  it("aponta a fonte oficial e ignora o Brasil", () => {
    expect(foreignCountries([{ country: "Brasil" }, { country: "França" }, { country: "franca" }])).toEqual(["França"]);
    expect(entryInfo("Inglaterra").url).toContain("gov.uk");
    expect(entryInfo("França").url).toContain("europa.eu");
    expect(isEntryChecked("Islândia", [{ title: "exigencias de entrada conferidas: islandia", done: true }])).toBe(true);
  });
});
