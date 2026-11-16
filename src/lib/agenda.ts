import { tripDays } from "./itinerary";
import { zonedDate, zonedTime } from "./tz";

/**
 * Flat, day-by-day agenda of a trip, shared by the PDF/print view, the .ics export and the
 * public read-only page. Pure: takes plain rows, so it works with the signed-in data and
 * with the trimmed public payload alike.
 */
export type AgendaKind = "transport" | "arrival" | "checkin" | "checkout" | "activity" | "event";

export type AgendaItem = {
  key: string;
  kind: AgendaKind;
  day: string;
  time: string | null;
  endTime: string | null;
  title: string;
  sub: string | null;
  location: string | null;
  /** Booking reference shown in the PDF; never present in the public payload. */
  code: string | null;
  /** Instant (ISO UTC) when known — transports. Used for calendar exports. */
  startIso: string | null;
  endIso: string | null;
  tz: string | null;
};

export type AgendaTransport = {
  id: string; type: string; origin: string | null; destination: string | null;
  departure_at: string | null; departure_tz: string | null; arrival_at: string | null; arrival_tz: string | null;
  company: string | null; code: string | null; locator?: string | null;
};
export type AgendaLodging = {
  id: string; name: string; address: string | null;
  check_in_date: string | null; check_in_time: string | null; check_out_date: string | null; check_out_time: string | null;
  booking_code?: string | null;
};
export type AgendaActivity = { id: string; name: string; date: string | null; time: string | null; location: string | null; position: number };
export type AgendaEvent = {
  id: string; day: string; start_time: string | null; end_time: string | null; title: string; location: string | null;
  position: number; notes?: string | null;
};

const TYPE_LABEL: Record<string, string> = {
  flight: "Voo", train: "Trem", bus: "Ônibus", car: "Carro alugado", transfer: "Transfer", ferry: "Ferry", other: "Transporte",
};

const hm = (t: string | null | undefined) => (t ? t.slice(0, 5) : null);
const join = (...xs: (string | null | undefined)[]) => xs.filter(Boolean).join(" · ") || null;

export function buildAgenda(input: {
  start: string | null;
  end: string | null;
  transports: AgendaTransport[];
  lodgings: AgendaLodging[];
  activities: AgendaActivity[];
  events: AgendaEvent[];
}): { day: string; items: AgendaItem[] }[] {
  const out: AgendaItem[] = [];

  for (const t of input.transports) {
    const label = `${TYPE_LABEL[t.type] ?? "Transporte"} ${t.origin ?? ""} → ${t.destination ?? ""}`.trim();
    const sub = join(t.company, t.code);
    if (t.departure_at) {
      const dtz = t.departure_tz || "UTC";
      const atz = t.arrival_tz || "UTC";
      const day = zonedDate(t.departure_at, dtz);
      const sameDay = t.arrival_at ? zonedDate(t.arrival_at, atz) === day : false;
      out.push({
        key: `tr:${t.id}`, kind: "transport", day, time: zonedTime(t.departure_at, dtz),
        endTime: sameDay && t.arrival_at ? zonedTime(t.arrival_at, atz) : null,
        title: label, sub, location: t.origin, code: t.locator ?? null,
        startIso: t.departure_at, endIso: t.arrival_at, tz: dtz,
      });
      if (t.arrival_at && !sameDay) {
        out.push({
          key: `ta:${t.id}`, kind: "arrival", day: zonedDate(t.arrival_at, atz), time: zonedTime(t.arrival_at, atz), endTime: null,
          title: `Chegada em ${t.destination ?? ""}`.trim(), sub, location: t.destination, code: null,
          startIso: null, endIso: null, tz: atz,
        });
      }
    }
  }

  for (const l of input.lodgings) {
    if (l.check_in_date)
      out.push({
        key: `ci:${l.id}`, kind: "checkin", day: l.check_in_date, time: hm(l.check_in_time), endTime: null,
        title: `Check-in · ${l.name}`, sub: null, location: l.address, code: l.booking_code ?? null, startIso: null, endIso: null, tz: null,
      });
    if (l.check_out_date)
      out.push({
        key: `co:${l.id}`, kind: "checkout", day: l.check_out_date, time: hm(l.check_out_time), endTime: null,
        title: `Check-out · ${l.name}`, sub: null, location: l.address, code: null, startIso: null, endIso: null, tz: null,
      });
  }

  for (const a of input.activities) {
    if (!a.date) continue;
    out.push({
      key: `ac:${a.id}`, kind: "activity", day: a.date, time: hm(a.time), endTime: null, title: a.name, sub: null,
      location: a.location, code: null, startIso: null, endIso: null, tz: null,
    });
  }

  for (const e of input.events) {
    out.push({
      key: `ev:${e.id}`, kind: "event", day: e.day, time: hm(e.start_time), endTime: hm(e.end_time), title: e.title,
      sub: e.notes ?? null, location: e.location, code: null, startIso: null, endIso: null, tz: null,
    });
  }

  const order = new Map<string, number>();
  input.activities.forEach((a) => order.set(`ac:${a.id}`, a.position));
  input.events.forEach((e) => order.set(`ev:${e.id}`, e.position));

  const days = tripDays(input.start, input.end);
  const extra = [...new Set(out.map((i) => i.day))].filter((d) => !days.includes(d)).sort();
  const allDays = [...days, ...extra].sort();

  return allDays.map((day) => ({
    day,
    items: out
      .filter((i) => i.day === day)
      .sort((a, b) => {
        // Timed items first by time; untimed keep their manual order at the end.
        if (a.time && b.time) return a.time.localeCompare(b.time);
        if (a.time) return -1;
        if (b.time) return 1;
        return (order.get(a.key) ?? 0) - (order.get(b.key) ?? 0);
      }),
  }));
}
