import type { AgendaItem } from "./agenda";
import { zonedToUtc } from "./tz";

/** Triggers a browser download of a text file. */
export function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function slug(s: string) {
  return (
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "viagem"
  );
}

/* ---------- CSV (Excel pt-BR friendly: ";" separator, comma decimals, BOM) ---------- */

export type CsvValue = string | number | boolean | null | undefined;

function csvCell(v: CsvValue): string {
  if (v == null) return "";
  if (typeof v === "number") return Number.isFinite(v) ? v.toFixed(2).replace(".", ",") : "";
  if (typeof v === "boolean") return v ? "sim" : "não";
  const s = String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: string[], rows: CsvValue[][]): string {
  const lines = [headers.map(csvCell).join(";"), ...rows.map((r) => r.map(csvCell).join(";"))];
  return "\uFEFF" + lines.join("\r\n");
}

/* ---------- iCalendar (.ics) ---------- */

function icsEscape(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Folds lines at 75 octets as RFC 5545 asks (approximated by characters). */
function fold(line: string) {
  if (line.length <= 73) return line;
  const parts: string[] = [];
  for (let i = 0; i < line.length; i += 73) parts.push((i ? " " : "") + line.slice(i, i + 73));
  return parts.join("\r\n");
}

const utcStamp = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "").replace(/Z?$/, "Z");
const dateOnly = (d: string) => d.replace(/-/g, "");

function nextDay(d: string) {
  const [y = 1970, m = 1, day = 1] = d.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, day + 1));
  return dt.toISOString().slice(0, 10);
}

/**
 * Builds a calendar with every agenda item. Timed items use the trip-day timezone when
 * known (`dayTz`), so a 10:00 visit in Lisbon lands at 10:00 Lisbon time in any calendar.
 */
export function buildIcs(opts: {
  tripName: string;
  tripId: string;
  days: { day: string; items: AgendaItem[] }[];
  dayTz: (day: string) => string;
}): string {
  const now = utcStamp(new Date().toISOString());
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Rumo//Planejador de viagens//PT-BR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${icsEscape(opts.tripName)}`];

  for (const { day, items } of opts.days) {
    for (const it of items) {
      lines.push("BEGIN:VEVENT", `UID:${it.key}-${opts.tripId}@rumo`, `DTSTAMP:${now}`, `SUMMARY:${icsEscape(it.title)}`);
      if (it.startIso) {
        lines.push(`DTSTART:${utcStamp(it.startIso)}`);
        lines.push(`DTEND:${utcStamp(it.endIso && it.endIso > it.startIso ? it.endIso : new Date(new Date(it.startIso).getTime() + 3600_000).toISOString())}`);
      } else if (it.time) {
        const tz = it.tz || opts.dayTz(day);
        const start = zonedToUtc(`${day}T${it.time}`, tz);
        const end = it.endTime && it.endTime > it.time ? zonedToUtc(`${day}T${it.endTime}`, tz) : new Date(new Date(start).getTime() + 3600_000).toISOString();
        lines.push(`DTSTART:${utcStamp(start)}`, `DTEND:${utcStamp(end)}`);
      } else {
        lines.push(`DTSTART;VALUE=DATE:${dateOnly(day)}`, `DTEND;VALUE=DATE:${dateOnly(nextDay(day))}`);
      }
      if (it.location) lines.push(`LOCATION:${icsEscape(it.location)}`);
      const desc = [it.sub, it.code ? `Reserva: ${it.code}` : null].filter(Boolean).join("\n");
      if (desc) lines.push(`DESCRIPTION:${icsEscape(desc)}`);
      lines.push("END:VEVENT");
    }
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

/**
 * Calendário só com os lembretes da viagem, cada um com alarme (VALARM): importado no celular,
 * o próprio calendário avisa na hora certa, sem depender do app aberto.
 */
export function buildRemindersIcs(opts: {
  tripName: string;
  tripId: string;
  reminders: { id: string; date: string; time: string | null; title: string; detail?: string | undefined }[];
  tz: string;
}): string {
  const now = utcStamp(new Date().toISOString());
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Rumo//Lembretes//PT-BR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${icsEscape(`Lembretes · ${opts.tripName}`)}`];
  for (const r of opts.reminders) {
    lines.push("BEGIN:VEVENT", `UID:lembrete-${r.id}-${opts.tripId}@rumo`, `DTSTAMP:${now}`, `SUMMARY:${icsEscape(r.title)}`);
    if (r.time) {
      const start = zonedToUtc(`${r.date}T${r.time}`, opts.tz);
      lines.push(`DTSTART:${utcStamp(start)}`, `DTEND:${utcStamp(new Date(new Date(start).getTime() + 15 * 60_000).toISOString())}`);
    } else {
      lines.push(`DTSTART;VALUE=DATE:${dateOnly(r.date)}`, `DTEND;VALUE=DATE:${dateOnly(nextDay(r.date))}`);
    }
    if (r.detail) lines.push(`DESCRIPTION:${icsEscape(r.detail)}`);
    lines.push("TRANSP:TRANSPARENT");
    lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsEscape(r.title)}`, `TRIGGER:${r.time ? "PT0M" : "PT9H"}`, "END:VALARM");
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
