import { addDays, differenceInCalendarDays, format } from "date-fns";
import { toDate } from "./trip-utils";
import { BROWSER_TZ, zonedDate, zonedTime } from "./tz";
import type { Destination } from "./trips-api";

export function tripDays(start: string | null, end: string | null): string[] {
  const s = toDate(start), e = toDate(end);
  if (!s || !e) return [];
  const n = differenceInCalendarDays(e, s);
  return Array.from({ length: Math.max(0, n) + 1 }, (_, i) => format(addDays(s, i), "yyyy-MM-dd"));
}

/** The destination you are in on a day: the latest one that has already started. */
export function destinationForDay(day: string, dests: Destination[]): Destination | null {
  let found: Destination | null = null;
  for (const d of dests) {
    if (d.arrival_date && d.arrival_date <= day && (!d.departure_date || d.departure_date >= day)) found = d;
  }
  return found;
}

export function dayTimezone(day: string, dests: Destination[]) {
  return destinationForDay(day, dests)?.timezone || BROWSER_TZ;
}

type OvernightLeg = { departure_at: string | null; departure_tz: string | null; arrival_at: string | null; arrival_tz: string | null };

/**
 * Nights (date of the evening) between start and end not covered by any lodging.
 * A night spent travelling (a leg that departs that evening and lands on a later local date,
 * e.g. an overnight flight) does not need a bed, so it is not reported.
 */
export function nightsWithoutLodging(
  start: string | null, end: string | null,
  lodgings: { check_in_date: string | null; check_out_date: string | null }[],
  transports: OvernightLeg[] = [],
): string[] {
  const days = tripDays(start, end).slice(0, -1);
  const onTheMove = new Set(
    transports
      .filter((t) => t.departure_at && t.arrival_at)
      .map((t) => ({ d: zonedDate(t.departure_at!, t.departure_tz || "UTC"), a: zonedDate(t.arrival_at!, t.arrival_tz || "UTC") }))
      .filter((x) => x.a > x.d)
      .map((x) => x.d),
  );
  return days.filter(
    (n) => !onTheMove.has(n) && !lodgings.some((l) => l.check_in_date && l.check_out_date && l.check_in_date <= n && n < l.check_out_date),
  );
}

export type Slot = { id: string; start: string | null; end: string | null };
const toMin = (t: string) => +t.slice(0, 2) * 60 + +t.slice(3, 5);

/** Ids of timed items whose intervals overlap. Items without end last 60 minutes. */
export function conflictingIds(items: Slot[]): Set<string> {
  const timed = items.filter((i) => i.start).map((i) => {
    const s = toMin(i.start!);
    const e = i.end ? toMin(i.end) : s + 60;
    return { id: i.id, s, e: e > s ? e : s + 1 };
  });
  const out = new Set<string>();
  for (let a = 0; a < timed.length; a++)
    for (let b = a + 1; b < timed.length; b++)
    {
      const x = timed[a]!, y = timed[b]!;
      if (x.s < y.e && y.s < x.e) { out.add(x.id); out.add(y.id); }
    }
  return out;
}

export { zonedDate, zonedTime };
