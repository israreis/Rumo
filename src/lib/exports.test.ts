import { describe, expect, it } from "vitest";
import { buildIcs, slug, toCsv } from "./exports";

describe("toCsv", () => {
  it("uses ; and comma decimals, quotes when needed and starts with a BOM", () => {
    const csv = toCsv(["Item", "Valor", "Pago"], [["Jantar; vinho", 12.5, true], ['Diz "oi"', null, false]]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv.slice(1).split("\r\n")).toEqual(["Item;Valor;Pago", '"Jantar; vinho";12,50;sim', '"Diz ""oi""";;não']);
  });
});

describe("slug", () => {
  it("strips accents and symbols", () => {
    expect(slug("Lisboa & Porto — Verão!")).toBe("lisboa-porto-verao");
    expect(slug("***")).toBe("viagem");
  });
});

describe("buildIcs", () => {
  it("writes instants in UTC, local times through the day zone and untimed items as all-day", () => {
    const ics = buildIcs({
      tripName: "Lisboa, Porto",
      tripId: "trip1",
      dayTz: () => "Europe/Lisbon",
      days: [{
        day: "2026-07-10",
        items: [
          { key: "tr:1", kind: "transport", day: "2026-07-10", time: "22:30", endTime: null, title: "Voo GRU → LIS", sub: "TAP", location: "GRU", code: "XK7", startIso: "2026-07-11T01:30:00.000Z", endIso: "2026-07-11T11:05:00.000Z", tz: "America/Sao_Paulo" },
          { key: "ac:2", kind: "activity", day: "2026-07-10", time: "10:00", endTime: null, title: "Torre", sub: null, location: null, code: null, startIso: null, endIso: null, tz: null },
          { key: "ac:3", kind: "activity", day: "2026-07-10", time: null, endTime: null, title: "Livre", sub: null, location: null, code: null, startIso: null, endIso: null, tz: null },
        ],
      }],
    });
    expect(ics).toContain("X-WR-CALNAME:Lisboa\\, Porto");
    expect(ics).toContain("DTSTART:20260711T013000Z");
    expect(ics).toContain("DESCRIPTION:TAP\\nReserva: XK7");
    // 10:00 in Lisbon summer time is 09:00 UTC
    expect(ics).toContain("DTSTART:20260710T090000Z");
    expect(ics).toContain("DTSTART;VALUE=DATE:20260710");
    expect(ics).toContain("DTEND;VALUE=DATE:20260711");
    expect(ics.match(/BEGIN:VEVENT/g)?.length).toBe(3);
  });
});
