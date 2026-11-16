import { addMonths, format, parseISO } from "date-fns";

export const BUDGET_CATEGORIES: Record<string, string> = {
  tickets: "Passagens", local_transport: "Transporte local", lodging: "Hospedagem", food: "Alimentação",
  activities: "Ingressos/atividades", insurance: "Seguro viagem", documents: "Documentação/visto", shopping: "Compras",
  internet: "Chip/internet", tips: "Gorjetas", emergency: "Reserva de emergência", other: "Outros",
};
export const PAYMENT_METHODS: Record<string, string> = { cash: "Dinheiro", credit: "Crédito", debit: "Débito", multi: "Cartão multimoeda" };

export function transportCategory(type: string) {
  return ["flight", "train", "bus", "ferry"].includes(type) ? "tickets" : "local_transport";
}
export function activityCategory(cat: string) {
  return cat === "restaurant" ? "food" : "activities";
}
export function eventCategory(cat: string) {
  return ({ meal: "food", transport: "local_transport", activity: "activities", lodging: "lodging" } as Record<string, string>)[cat] ?? "other";
}

/** Original amount of a budget line: daily estimates multiply by days and people. */
export function budgetItemAmount(i: { kind: string; amount: number; days?: number | null; people?: number | null }) {
  return i.kind === "daily" ? i.amount * (i.days ?? 1) * (i.people ?? 1) : i.amount;
}

/** Splits a value into monthly installments starting at `firstMonth` (yyyy-MM-dd). */
export function installmentSchedule(total: number, n: number, firstMonth: string) {
  const count = Math.max(1, n);
  const base = Math.floor((total / count) * 100) / 100;
  return Array.from({ length: count }, (_, i) => ({
    month: format(addMonths(parseISO(firstMonth), i), "yyyy-MM"),
    amount: i === count - 1 ? Math.round((total - base * (count - 1)) * 100) / 100 : base,
  }));
}

export type Split = { traveler_id: string; value: number };
export type ExpenseForSplit = { converted_amount: number; amount: number; paid_by: string | null; split_mode: string; splits: Split[] };

/** Each traveler's share (in trip currency) of one expense. */
export function expenseShares(e: ExpenseForSplit, allTravelers: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  const parts = e.splits.length ? e.splits : allTravelers.map((id) => ({ traveler_id: id, value: 0 }));
  if (e.split_mode === "percent") {
    for (const p of parts) out[p.traveler_id] = (e.converted_amount * p.value) / 100;
  } else if (e.split_mode === "amount") {
    const ratio = e.amount ? e.converted_amount / e.amount : 1;
    for (const p of parts) out[p.traveler_id] = p.value * ratio;
  } else {
    for (const p of parts) out[p.traveler_id] = e.converted_amount / parts.length;
  }
  return out;
}

/** Net balance per traveler: positive = should receive. */
export function balances(expenses: ExpenseForSplit[], travelers: string[]) {
  const b: Record<string, number> = Object.fromEntries(travelers.map((t) => [t, 0]));
  for (const e of expenses) {
    if (!e.paid_by) continue;
    b[e.paid_by] = (b[e.paid_by] ?? 0) + e.converted_amount;
    for (const [t, v] of Object.entries(expenseShares(e, travelers))) b[t] = (b[t] ?? 0) - v;
  }
  return b;
}

/** Greedy settlement: largest debtor pays largest creditor; yields at most n-1 transfers. */
export function settle(bal: Record<string, number>) {
  const cents = Object.entries(bal).map(([id, v]) => ({ id, v: Math.round(v * 100) }));
  const cred = cents.filter((x) => x.v > 0).sort((a, b) => b.v - a.v);
  const debt = cents.filter((x) => x.v < 0).map((x) => ({ id: x.id, v: -x.v })).sort((a, b) => b.v - a.v);
  const out: { from: string; to: string; amount: number }[] = [];
  let i = 0, j = 0;
  while (i < debt.length && j < cred.length) {
    const d = debt[i]!, c = cred[j]!;
    const m = Math.min(d.v, c.v);
    if (m > 0) out.push({ from: d.id, to: c.id, amount: m / 100 });
    d.v -= m; c.v -= m;
    if (d.v === 0) i++;
    if (c.v === 0) j++;
  }
  return out;
}

/** How much can still be spent today, spreading the remaining budget over the remaining days. */
export function dailyAllowance(remainingBeforeToday: number, spentToday: number, daysLeftIncludingToday: number) {
  if (daysLeftIncludingToday <= 0) return 0;
  return remainingBeforeToday / daysLeftIncludingToday - spentToday;
}
