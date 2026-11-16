export const BROWSER_TZ = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";

export function allTimezones(): string[] {
  try {
    return (Intl as any).supportedValuesOf("timeZone");
  } catch {
    return ["America/Sao_Paulo", "Europe/Lisbon", "Europe/London", "Europe/Paris", "America/New_York", "UTC"];
  }
}

function parts(date: Date, tz: string) {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  });
  const o: any = {};
  for (const p of f.formatToParts(date)) o[p.type] = p.value;
  return o;
}

function offsetMs(date: Date, tz: string) {
  const p = parts(date, tz);
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
  return asUtc - Math.floor(date.getTime() / 60000) * 60000;
}

/** "yyyy-MM-ddTHH:mm" wall time in `tz` -> ISO UTC string. */
export function zonedToUtc(local: string, tz: string): string {
  const [d = "", t = "00:00"] = local.split("T");
  const [y = 0, m = 1, day = 1] = d.split("-").map(Number);
  const [h = 0, mi = 0] = t.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, day, h, mi);
  let ts = guess - offsetMs(new Date(guess), tz);
  ts = guess - offsetMs(new Date(ts), tz);
  return new Date(ts).toISOString();
}

/** ISO -> "yyyy-MM-ddTHH:mm" wall time in `tz`. */
export function utcToZoned(iso: string, tz: string): string {
  const p = parts(new Date(iso), tz);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

export function zonedDate(iso: string, tz: string) {
  return utcToZoned(iso, tz).slice(0, 10);
}
export function zonedTime(iso: string, tz: string) {
  return utcToZoned(iso, tz).slice(11, 16);
}
export function formatZoned(iso: string | null, tz: string | null) {
  if (!iso) return "—";
  const z = utcToZoned(iso, tz || BROWSER_TZ);
  return `${z.slice(8, 10)}/${z.slice(5, 7)}/${z.slice(0, 4)} ${z.slice(11, 16)}`;
}

/** Real elapsed time between two instants, e.g. "11h 35min". */
export function durationLabel(fromIso: string | null, toIso: string | null): string | null {
  if (!fromIso || !toIso) return null;
  const min = Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 60000);
  if (min < 0) return null;
  const h = Math.floor(min / 60), m = min % 60;
  return h ? `${h}h${m ? ` ${String(m).padStart(2, "0")}min` : ""}` : `${m}min`;
}
