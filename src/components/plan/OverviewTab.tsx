import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, BedDouble, CalendarClock, CheckSquare, Clock, FileWarning, PiggyBank, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Progress } from "@/components/ui/progress";
import { Dial } from "@/components/Dial";
import { BUDGET_CATEGORIES } from "@/lib/budget";
import { conflictingIds, nightsWithoutLodging, tripDays } from "@/lib/itinerary";
import { planQuery, type Activity, type ItineraryEvent, type Lodging, type Transport } from "@/lib/plan-api";
import { DOC_KINDS, freeCancelSoon, passportTooShort, progressPct, tripDayOf, upcomingDue } from "@/lib/trip-extras";
import { daysUntil, formatDate, formatMoney, toDate } from "@/lib/trip-utils";
import { zonedDate, zonedTime } from "@/lib/tz";
import type { Trip } from "@/lib/trips-api";
import { cn } from "@/lib/utils";
import type { ChecklistItem } from "./ChecklistTab";
import type { TravelerDoc } from "./DocumentsTab";
import { sum, useBudget } from "./useBudget";

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--caramelo)", "var(--tinta-suave)"];
type Alert = { tone: "destructive" | "warning"; icon: typeof AlertTriangle; text: string };

export function OverviewTab({ trip }: { trip: Trip }) {
  const id = trip.id, cur = trip.currency;
  const { lines, expenses } = useBudget(trip);
  const { data: transports = [] } = useQuery(planQuery<Transport>("transports", id));
  const { data: lodgings = [] } = useQuery(planQuery<Lodging>("lodgings", id));
  const { data: activities = [] } = useQuery(planQuery<Activity>("activities", id));
  const { data: events = [] } = useQuery(planQuery<ItineraryEvent>("itinerary_events", id));
  const { data: docs = [] } = useQuery(planQuery<TravelerDoc>("traveler_documents", id));
  const { data: checklist = [] } = useQuery(planQuery<ChecklistItem>("checklist_items", id));

  const now = new Date(), today = format(now, "yyyy-MM-dd");
  const dayOf = tripDayOf(trip.start_date, trip.end_date, now);
  const until = daysUntil(trip.start_date);

  const planned = sum(lines.map((l) => l.converted ?? 0));
  const goal = trip.budget ?? planned;
  const spentExp = sum(expenses.map((e) => Number(e.converted_amount)));
  const paidPlan = sum(lines.filter((l) => l.paid && !l.daily).map((l) => l.converted ?? 0));
  const spent = spentExp + paidPlan;
  const balance = goal - spent;
  const pending = lines.filter((l) => !l.paid && !l.daily);
  const due = upcomingDue(pending, now, 45).slice(0, 5);

  // Upcoming itinerary (next 6 timed or dated items from today)
  const upcoming = [
    ...transports.filter((t) => t.departure_at).map((t) => ({ k: `t${t.id}`, d: zonedDate(t.departure_at!, t.departure_tz || "UTC"), t: zonedTime(t.departure_at!, t.departure_tz || "UTC"), title: `${t.origin ?? ""} → ${t.destination ?? ""}` })),
    ...lodgings.filter((l) => l.check_in_date).map((l) => ({ k: `l${l.id}`, d: l.check_in_date!, t: l.check_in_time?.slice(0, 5) ?? "", title: `Check-in · ${l.name}` })),
    ...activities.filter((a) => a.date).map((a) => ({ k: `a${a.id}`, d: a.date!, t: a.time?.slice(0, 5) ?? "", title: a.name })),
    ...events.map((e) => ({ k: `e${e.id}`, d: e.day, t: e.start_time?.slice(0, 5) ?? "", title: e.title })),
  ].filter((x) => x.d >= today).sort((a, b) => (a.d + a.t).localeCompare(b.d + b.t)).slice(0, 6);

  // Alerts
  const alerts: Alert[] = [];
  const tName = Object.fromEntries(trip.trip_travelers.map((t) => [t.id!, t.name]));
  docs.forEach((d) => {
    if (d.kind === "passport" && passportTooShort(d.expires_at, trip.end_date))
      alerts.push({ tone: "destructive", icon: FileWarning, text: `Passaporte de ${tName[d.traveler_id ?? ""] ?? "viajante"} vence em ${formatDate(d.expires_at)} — menos de 6 meses após a volta.` });
    else if (d.expires_at && trip.end_date && d.expires_at < trip.end_date)
      alerts.push({ tone: "warning", icon: FileWarning, text: `${DOC_KINDS[d.kind]} de ${tName[d.traveler_id ?? ""] ?? "viajante"} vence antes do fim da viagem.` });
  });
  freeCancelSoon(lodgings, now).forEach((l) =>
    alerts.push({ tone: "warning", icon: BedDouble, text: `Cancelamento grátis de ${l.name} termina ${l.daysLeft === 0 ? "hoje" : `em ${l.daysLeft} dia(s)`} (${formatDate(l.free_cancel_until)}).` }));
  const gaps = nightsWithoutLodging(trip.start_date, trip.end_date, lodgings, transports);
  if (gaps.length) alerts.push({ tone: "warning", icon: BedDouble, text: `${gaps.length} noite(s) sem hospedagem: ${gaps.slice(0, 4).map(formatDate).join(", ")}${gaps.length > 4 ? "…" : ""}` });
  const days = tripDays(trip.start_date, trip.end_date);
  days.forEach((d) => {
    const slots = [
      ...activities.filter((a) => a.date === d).map((a) => ({ id: a.id, start: a.time?.slice(0, 5) ?? null, end: null })),
      ...events.filter((e) => e.day === d).map((e) => ({ id: e.id, start: e.start_time?.slice(0, 5) ?? null, end: e.end_time?.slice(0, 5) ?? null })),
    ];
    if (conflictingIds(slots).size) alerts.push({ tone: "warning", icon: Clock, text: `Conflito de horário no roteiro em ${formatDate(d)}.` });
  });
  if (trip.budget && planned > trip.budget) alerts.push({ tone: "destructive", icon: PiggyBank, text: `Planejado (${formatMoney(planned, cur)}) passa do orçamento em ${formatMoney(planned - trip.budget, cur)}.` });
  if (trip.budget && spent > trip.budget) alerts.push({ tone: "destructive", icon: Wallet, text: `Gasto real já ultrapassou o orçamento em ${formatMoney(spent - trip.budget, cur)}.` });

  const openTasks = checklist.filter((c) => !c.done).sort((a, b) => (a.due_date ?? "9").localeCompare(b.due_date ?? "9"));

  // Charts
  const byCat = Object.entries(BUDGET_CATEGORIES).map(([c, name]) => ({
    name, value: Math.round(sum(expenses.filter((e) => e.category === c).map((e) => Number(e.converted_amount)))),
  })).filter((x) => x.value > 0);
  const expDays = [...new Set([...days, ...expenses.map((e) => e.date)])].sort();
  let acc = 0;
  const perDay = expDays.map((d) => {
    const v = sum(expenses.filter((e) => e.date === d).map((e) => Number(e.converted_amount)));
    acc += v;
    return { d: format(toDate(d)!, "dd/MM"), dia: Math.round(v), acumulado: Math.round(acc) };
  });
  const tip = { contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--popover-foreground)" }, formatter: (v: number) => formatMoney(v, cur) };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-primary p-5 text-primary-foreground shadow-card">
          <p className="text-xs uppercase tracking-wide opacity-80">{dayOf ? "Em viagem" : until != null && until > 0 ? "Contagem regressiva" : "Viagem"}</p>
          <p className="mt-2 font-display text-3xl font-semibold">
            {dayOf ? `Dia ${dayOf.day} de ${dayOf.total}` : until != null && until > 0 ? `${until} ${until === 1 ? "dia" : "dias"}` : until === 0 ? "É hoje!" : "Concluída"}
          </p>
        </div>
        <Kpi label="Total previsto" value={formatMoney(goal, cur)} sub={trip.budget ? `planejado ${formatMoney(planned, cur)}` : "soma do planejado"} />
        <Kpi label="Gasto até agora" value={formatMoney(spent, cur)} sub={`${formatMoney(paidPlan, cur)} pago antes + ${formatMoney(spentExp, cur)} na viagem`} />
        <div className="flex min-w-0 items-center gap-3 rounded-2xl border bg-card p-4 shadow-card">
          <Dial value={goal ? (spent / goal) * 100 : 0} label="Orçamento usado" sub="usado" className="size-20 lg:size-16 xl:size-24" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Saldo</p>
            <p className={cn("mt-1 whitespace-nowrap font-num text-lg font-medium leading-tight xl:text-xl", balance < 0 ? "text-destructive" : "text-success")}>{formatMoney(balance, cur)}</p>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border bg-card p-5 shadow-card">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><AlertTriangle className="size-5 text-warning" /> Central de alertas</h2>
        {!alerts.length ? <p className="mt-2 text-sm text-muted-foreground">Tudo certo por aqui. Nenhum alerta no momento. ✈️</p> : (
          <ul className="mt-3 space-y-2">
            {alerts.map((a, i) => (
              <li key={i} className={cn("flex items-start gap-2 rounded-xl px-3 py-2 text-sm", a.tone === "destructive" ? "bg-destructive/10 text-destructive" : "bg-warning/15")}>
                <a.icon className="mt-0.5 size-4 shrink-0" /> {a.text}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Próximos eventos" icon={CalendarClock}>
          {!upcoming.length ? <Muted>Nada agendado à frente. Monte o roteiro na aba Roteiro.</Muted> : (
            <ul className="space-y-2.5">
              {upcoming.map((u) => (
                <li key={u.k} className="flex gap-3 text-sm">
                  <span className="w-20 shrink-0 text-muted-foreground">{format(toDate(u.d)!, "EEE dd/MM", { locale: ptBR })}{u.t && <><br />{u.t}</>}</span>
                  <span className="font-medium">{u.title}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Pagamentos pendentes" icon={Wallet}>
          <p className="text-sm text-muted-foreground">{pending.length} item(ns) · {formatMoney(sum(pending.map((l) => l.converted ?? 0)), cur)} a pagar</p>
          {due.length ? (
            <ul className="mt-3 space-y-2">
              {due.map((l) => (
                <li key={l.key} className="flex justify-between gap-2 text-sm">
                  <span className={cn(l.due_date! < today && "text-destructive")}>{formatDate(l.due_date)} · {l.label}</span>
                  <span className="shrink-0 font-medium">{formatMoney(l.converted ?? l.amount, l.converted != null ? cur : l.currency)}</span>
                </li>
              ))}
            </ul>
          ) : <Muted>Sem vencimentos nos próximos 45 dias.</Muted>}
        </Card>
        <Card title="Pendências do checklist" icon={CheckSquare}>
          <div className="flex items-center gap-3"><Dial value={progressPct(checklist)} label="Checklist concluída" sub="pronto" className="size-20" /><Progress value={progressPct(checklist)} className="h-2" /></div>
          {!checklist.length ? <Muted>Nenhum item. Use um modelo na aba Checklist.</Muted> : !openTasks.length ? <Muted>Tudo concluído!</Muted> : (
            <ul className="mt-3 space-y-1.5 text-sm">
              {openTasks.slice(0, 6).map((c) => (
                <li key={c.id} className="flex justify-between gap-2">
                  <span>{c.title}</span>
                  {c.due_date && <span className={cn("shrink-0 text-xs", c.due_date < today ? "text-destructive" : "text-muted-foreground")}>{formatDate(c.due_date)}</span>}
                </li>
              ))}
              {openTasks.length > 6 && <li className="text-xs text-muted-foreground">+{openTasks.length - 6} itens</li>}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Gasto por categoria">
          {!byCat.length ? <Muted>Os gráficos aparecem quando você lançar gastos (botão “+ Gasto”).</Muted> : (
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={byCat} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {byCat.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...tip} />
                </PieChart>
              </ResponsiveContainer>
              <div className="-mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs">
                {byCat.map((c, i) => <span key={c.name} className="flex items-center gap-1"><span className="size-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{c.name}</span>)}
              </div>
            </div>
          )}
        </Card>
        <Card title="Evolução dos gastos por dia">
          {!expenses.length ? <Muted>Sem gastos lançados ainda.</Muted> : (
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={perDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="d" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} width={50} />
                  <Tooltip {...tip} />
                  <Bar dataKey="dia" name="No dia" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {expenses.length > 0 && (
            <div className="mt-4 h-40">
              <ResponsiveContainer>
                <LineChart data={perDay}>
                  <XAxis dataKey="d" hide />
                  <YAxis hide />
                  <Tooltip {...tip} />
                  <Line type="monotone" dataKey="acumulado" name="Acumulado" stroke="var(--primary)" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-center text-xs text-muted-foreground">Acumulado</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "success" | "destructive" }) {
  return (
    <div className="min-w-0 rounded-2xl border bg-card p-5 shadow-card">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-2 whitespace-nowrap font-display text-2xl font-semibold leading-tight lg:text-xl xl:text-2xl", tone === "destructive" && "text-destructive", tone === "success" && "text-success")}>{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
function Card({ title, icon: Icon, children }: { title: string; icon?: typeof AlertTriangle; children: React.ReactNode }) {
  return <section className="rounded-2xl border bg-card p-5 shadow-card"><h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">{Icon && <Icon className="size-5 text-primary" />}{title}</h2>{children}</section>;
}
const Muted = ({ children }: { children: React.ReactNode }) => <p className="mt-2 text-sm text-muted-foreground">{children}</p>;
