import { differenceInCalendarDays, format, parseISO } from "date-fns";

export type TripStatus = "planning" | "confirmed" | "ongoing" | "completed";

export const STATUS_LABEL: Record<TripStatus, string> = {
  planning: "Planejando",
  confirmed: "Confirmada",
  ongoing: "Em andamento",
  completed: "Concluída",
};

export const CURRENCIES = ["BRL", "USD", "EUR", "GBP", "ARS", "CLP", "JPY"] as const;

/** Parse a yyyy-mm-dd string as a local calendar date. */
export function toDate(d: string | null | undefined): Date | null {
  if (!d) return null;
  return parseISO(d);
}

export function formatDate(d: string | null | undefined): string {
  const date = toDate(d);
  return date ? format(date, "dd/MM/yyyy") : "—";
}

/** Manual override wins; otherwise derived from dates relative to today. */
export function computeStatus(
  start: string | null,
  end: string | null,
  override: TripStatus | null,
  today: Date = new Date(),
): TripStatus {
  if (override) return override;
  const s = toDate(start);
  const e = toDate(end) ?? s;
  if (e && differenceInCalendarDays(today, e) > 0) return "completed";
  if (s && differenceInCalendarDays(today, s) >= 0) return "ongoing";
  return "planning";
}

/** Days until the trip starts; null when it already started or has no date. */
export function daysUntil(start: string | null, today: Date = new Date()): number | null {
  const s = toDate(start);
  if (!s) return null;
  const diff = differenceInCalendarDays(s, today);
  return diff >= 0 ? diff : null;
}

export function formatMoney(value: number | null | undefined, currency = "BRL"): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(value);
}
