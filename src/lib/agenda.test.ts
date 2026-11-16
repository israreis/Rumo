import { describe, expect, it } from "vitest";
import { buildAgenda } from "./agenda";

const base = { transports: [], lodgings: [], activities: [], events: [] };

describe("buildAgenda", () => {
  it("lists every trip day, even empty ones", () => {
    const days = buildAgenda({ ...base, start: "2026-12-12", end: "2026-12-14" });
    expect(days.map((d) => d.day)).toEqual(["2026-12-12", "2026-12-13", "2026-12-14"]);
    expect(days.every((d) => d.items.length === 0)).toBe(true);
  });

  it("places an overnight flight on departure and arrival days in each local zone", () => {
    const days = buildAgenda({
      ...base,
      start: "2026-12-11",
      end: "2026-12-12",
      transports: [{
        id: "t1", type: "flight", origin: "GRU", destination: "LIS", company: "TAP", code: "TP 88", locator: "XK7P2Q",
        departure_at: "2026-12-12T01:30:00.000Z", departure_tz: "America/Sao_Paulo",
        arrival_at: "2026-12-12T12:05:00.000Z", arrival_tz: "Europe/Lisbon",
      }],
    });
    const dep = days.find((d) => d.day === "2026-12-11")!.items[0]!;
    const arr = days.find((d) => d.day === "2026-12-12")!.items[0]!;
    expect(dep).toMatchObject({ kind: "transport", time: "22:30", code: "XK7P2Q" });
    expect(arr).toMatchObject({ kind: "arrival", time: "12:05", title: "Chegada em LIS" });
  });

  it("orders timed items by time and keeps manual order for untimed ones", () => {
    const days = buildAgenda({
      ...base,
      start: "2026-12-13",
      end: "2026-12-13",
      activities: [
        { id: "a", name: "Museu", date: "2026-12-13", time: null, location: null, position: 2 },
        { id: "b", name: "Torre", date: "2026-12-13", time: "10:00:00", location: null, position: 0 },
      ],
      events: [
        { id: "e", day: "2026-12-13", start_time: "08:30:00", end_time: "09:00:00", title: "Café", location: null, position: 5 },
        { id: "f", day: "2026-12-13", start_time: null, end_time: null, title: "Livre", location: null, position: 1 },
      ],
    });
    expect(days[0]!.items.map((i) => i.title)).toEqual(["Café", "Torre", "Livre", "Museu"]);
  });

  it("adds check-in and check-out with booking code only on check-in", () => {
    const days = buildAgenda({
      ...base,
      start: "2026-12-12",
      end: "2026-12-13",
      lodgings: [{ id: "l", name: "Hotel", address: "Rua 1", check_in_date: "2026-12-12", check_in_time: "15:00:00", check_out_date: "2026-12-13", check_out_time: "11:00:00", booking_code: "BK1" }],
    });
    expect(days[0]!.items[0]).toMatchObject({ kind: "checkin", time: "15:00", code: "BK1" });
    expect(days[1]!.items[0]).toMatchObject({ kind: "checkout", time: "11:00", code: null });
  });
});
