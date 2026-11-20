import { foreignCountries, isEntryChecked } from "./entry-requirements";

/** Um lembrete: em que dia (e hora local, se houver) avisar, e o quê. */
export type Reminder = {
  id: string;
  date: string; // YYYY-MM-DD
  time: string | null; // HH:MM no fuso do aparelho
  title: string;
  detail?: string | undefined;
  kind: "trip" | "checkin" | "payment" | "cancel" | "task" | "entry" | "document";
};

type In = {
  trip: { id: string; name: string; start_date: string | null; end_date: string | null; trip_destinations: { country: string | null }[] };
  transports: { id: string; type: string; origin: string | null; destination: string | null; code: string | null; departure_at: string | null; departure_tz: string | null }[];
  lodgings: { id: string; name: string; free_cancel_until: string | null }[];
  pending: { key: string; label: string; due_date: string | null }[];
  checklist: { id: string; title: string; done: boolean; due_date: string | null }[];
  docs: { id: string; kind: string; expires_at: string | null }[];
  passportExpiry?: string | null;
};

const addDays = (d: string, n: number) => {
  const [y = 1970, m = 1, day = 1] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day + n)).toISOString().slice(0, 10);
};
/** Data e hora locais (no fuso informado) de um instante ISO. */
function localParts(iso: string, tz: string) {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const p = Object.fromEntries(f.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

/**
 * Lembretes da viagem, em ordem. O horário é o do aparelho (fuso de quem recebe):
 * check-in online abre ~24h antes do voo; pagamentos e cancelamento grátis avisam 2 dias antes.
 */
export function buildReminders(x: In, deviceTz: string): Reminder[] {
  const out: Reminder[] = [];
  const { trip } = x;
  if (trip.start_date) {
    out.push({ id: `trip-7`, date: addDays(trip.start_date, -7), time: "09:00", title: `Falta 1 semana para ${trip.name}`, detail: "Confira documentos, reservas e a mala.", kind: "trip" });
    out.push({ id: `trip-1`, date: addDays(trip.start_date, -1), time: "09:00", title: `Amanhã começa ${trip.name}`, detail: "Passaporte, cartões, carregadores e adaptadores na mala.", kind: "trip" });
  }

  for (const t of x.transports) {
    if (!t.departure_at) continue;
    const route = [t.origin, t.destination].filter(Boolean).join(" → ");
    const at = localParts(t.departure_at, deviceTz);
    if (t.type === "flight") {
      const open = localParts(new Date(new Date(t.departure_at).getTime() - 24 * 3600_000).toISOString(), deviceTz);
      out.push({ id: `checkin-${t.id}`, date: open.date, time: open.time, title: `Check-in online: ${route || "voo"}`, detail: [t.code && `Voo ${t.code}`, "O check-in costuma abrir 24h antes (algumas companhias, antes)."].filter(Boolean).join(" · "), kind: "checkin" });
    }
    const dep = localParts(t.departure_at, t.departure_tz || deviceTz);
    out.push({ id: `dep-${t.id}`, date: at.date, time: at.time, title: `${t.type === "flight" ? "Voo" : "Saída"} ${route}`.trim(), detail: `Partida às ${dep.time} (hora local)${t.code ? ` · ${t.code}` : ""}`, kind: "trip" });
  }

  for (const l of x.lodgings) {
    if (!l.free_cancel_until) continue;
    out.push({ id: `cancel-${l.id}`, date: addDays(l.free_cancel_until, -2), time: "09:00", title: `Cancelamento grátis de ${l.name} termina em 2 dias`, detail: `Último dia: ${l.free_cancel_until.split("-").reverse().join("/")}`, kind: "cancel" });
  }

  for (const p of x.pending) {
    if (!p.due_date) continue;
    out.push({ id: `pay-${p.key}`, date: addDays(p.due_date, -2), time: "09:00", title: `Pagamento vence em 2 dias: ${p.label}`, detail: `Vencimento: ${p.due_date.split("-").reverse().join("/")}`, kind: "payment" });
  }

  for (const c of x.checklist) {
    if (c.done || !c.due_date) continue;
    out.push({ id: `task-${c.id}`, date: c.due_date, time: "09:00", title: `Prazo: ${c.title}`, kind: "task" });
  }

  if (trip.start_date) {
    // Exigências de entrada: conferir com antecedência (autorizações eletrônicas podem demorar)
    for (const country of foreignCountries(trip.trip_destinations)) {
      if (isEntryChecked(country, x.checklist)) continue;
      out.push({ id: `entry-${country}`, date: addDays(trip.start_date, -60), time: "09:00", title: `Conferir exigências de entrada: ${country}`, detail: "Visto, autorização eletrônica e validade do passaporte, na fonte oficial.", kind: "entry" });
    }
    const exp = [x.passportExpiry ?? null, ...x.docs.filter((d) => d.kind === "passport").map((d) => d.expires_at)].filter((d): d is string => !!d);
    if (exp.some((e) => trip.end_date && e < addDays(trip.end_date, 183))) {
      out.push({ id: `passport`, date: addDays(trip.start_date, -90), time: "09:00", title: "Passaporte vence menos de 6 meses depois da volta", detail: "Muitos países exigem 6 meses de validade. Veja se dá tempo de renovar.", kind: "document" });
    }
  }

  return out.sort((a, b) => (a.date + (a.time ?? "")).localeCompare(b.date + (b.time ?? "")));
}

/** Lembretes de hoje em diante (os de datas já passadas não fazem sentido avisar). */
export const upcomingReminders = (all: Reminder[], today: string) => all.filter((r) => r.date >= today);
