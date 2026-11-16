import { addMonths, differenceInCalendarDays, differenceInCalendarMonths, parseISO } from "date-fns";

/**
 * Situação do passaporte real do usuário. Muitos países exigem validade mínima de
 * 6 meses além da data de saída, então "vencendo" = menos de 6 meses pela frente,
 * ou menos de 6 meses depois da volta da próxima viagem.
 */
export type PassportState =
  | { kind: "missing" }
  | { kind: "expired"; days: number }
  | { kind: "expiring"; days: number; months: number }
  | { kind: "short-for-trip"; trip: string; returnDate: string }
  | { kind: "ok"; months: number };

export function passportState(
  expiry: string | null | undefined,
  today: string,
  nextTrips: { name: string; end_date: string | null }[] = [],
): PassportState {
  if (!expiry) return { kind: "missing" };
  const e = parseISO(expiry), t = parseISO(today);
  const days = differenceInCalendarDays(e, t);
  if (days < 0) return { kind: "expired", days: -days };
  const months = differenceInCalendarMonths(e, t);
  if (e < addMonths(t, 6)) return { kind: "expiring", days, months };
  const short = nextTrips
    .filter((x) => x.end_date && x.end_date >= today)
    .sort((a, b) => a.end_date!.localeCompare(b.end_date!))
    .find((x) => e < addMonths(parseISO(x.end_date!), 6));
  if (short) return { kind: "short-for-trip", trip: short.name, returnDate: short.end_date! };
  return { kind: "ok", months };
}

/** "FX1234567" → "•••••4567": o número completo só aparece no formulário. */
export function maskPassport(n: string | null | undefined) {
  if (!n) return "—";
  const v = n.trim();
  return v.length <= 4 ? v : `${"•".repeat(Math.min(5, v.length - 4))}${v.slice(-4)}`;
}

/** Normaliza o que foi digitado: maiúsculas, sem espaços nem pontuação. */
export function normalizePassport(n: string) {
  return n.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function relTime(days: number) {
  if (days < 45) return `${days} ${days === 1 ? "dia" : "dias"}`;
  const m = Math.round(days / 30.4);
  return `${m} ${m === 1 ? "mês" : "meses"}`;
}
