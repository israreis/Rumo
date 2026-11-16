import { addDays, addMonths, differenceInCalendarDays, format } from "date-fns";
import { toDate } from "./trip-utils";

export const DOC_KINDS: Record<string, string> = {
  passport: "Passaporte", visa: "Visto", insurance: "Seguro viagem", vaccination: "Carteira de vacinação", idp: "CNH internacional",
};
export const CONTACT_KINDS: Record<string, string> = {
  embassy: "Embaixada/consulado", insurer: "Seguradora", bank: "Banco/cartão", personal: "Contato pessoal",
};
export const CHECKLIST_LISTS: Record<string, string> = { pre: "Pré-viagem", packing: "Mala" };

/** True when the passport expires less than 6 months after the return date (or has no date). */
export function passportTooShort(expires: string | null, returnDate: string | null): boolean {
  const e = toDate(expires), r = toDate(returnDate);
  if (!e || !r) return false;
  return e < addMonths(r, 6);
}

/** Lodgings whose free-cancellation deadline is within the next `warnDays` days (inclusive, not past). */
export function freeCancelSoon<T extends { free_cancel_until: string | null }>(rows: T[], today: Date, warnDays = 3): (T & { daysLeft: number })[] {
  return rows.flatMap((r) => {
    const d = toDate(r.free_cancel_until);
    if (!d) return [];
    const left = differenceInCalendarDays(d, today);
    return left >= 0 && left <= warnDays ? [{ ...r, daysLeft: left }] : [];
  });
}

/** "Dia X de Y" during the trip; null outside it. */
export function tripDayOf(start: string | null, end: string | null, today: Date): { day: number; total: number } | null {
  const s = toDate(start), e = toDate(end);
  if (!s || !e) return null;
  const day = differenceInCalendarDays(today, s) + 1, total = differenceInCalendarDays(e, s) + 1;
  return day >= 1 && day <= total ? { day, total } : null;
}

export const progressPct = (items: { done: boolean }[]) => (items.length ? Math.round((items.filter((i) => i.done).length / items.length) * 100) : 0);

export const TEMPLATES: Record<string, { label: string; pre: string[]; packing: string[] }> = {
  international: { label: "Internacional", pre: ["Verificar validade do passaporte", "Checar exigência de visto", "Contratar seguro viagem", "Avisar o banco sobre a viagem", "Comprar chip/eSIM", "Fazer check-in online", "Trocar um pouco de moeda local"], packing: ["Passaporte", "Adaptador de tomada", "Cartão multimoeda", "Cópia dos documentos", "Carregador e power bank"] },
  beach: { label: "Praia", pre: ["Reservar passeios de barco", "Checar previsão do tempo"], packing: ["Protetor solar", "Roupa de banho", "Chinelo", "Óculos de sol", "Chapéu/boné", "Toalha de praia"] },
  cold: { label: "Frio", pre: ["Checar previsão do tempo", "Verificar correntes de neve/estradas"], packing: ["Casaco impermeável", "Segunda pele", "Luvas", "Gorro", "Cachecol", "Meias térmicas", "Hidratante labial"] },
  business: { label: "Negócios", pre: ["Confirmar agenda de reuniões", "Imprimir cartões de visita", "Confirmar reembolso de despesas"], packing: ["Notebook e carregador", "Roupa social", "Cartões de visita", "Adaptador HDMI"] },
};

export function upcomingDue<T extends { due_date: string | null }>(rows: T[], today: Date, days = 30) {
  const lim = format(addDays(today, days), "yyyy-MM-dd");
  return rows.filter((r) => r.due_date && r.due_date <= lim).sort((a, b) => a.due_date!.localeCompare(b.due_date!));
}
