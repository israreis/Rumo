import { differenceInCalendarDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, ArrowRight, CloudOff, Receipt, Wallet } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/EmptyState";
import { BUDGET_CATEGORIES, PAYMENT_METHODS, balances, dailyAllowance, settle } from "@/lib/budget";
import { tripDays } from "@/lib/itinerary";
import { formatMoney, toDate } from "@/lib/trip-utils";
import type { Trip } from "@/lib/trips-api";
import { cn } from "@/lib/utils";
import { Money, Pill, useEditor } from "./common";
import { ExpenseDialog } from "./ExpenseDialog";
import { sum, useBudget, type Expense } from "./useBudget";
import { usePendingExpenses } from "@/components/OfflineSync";

export function ExpensesTab({ trip }: { trip: Trip }) {
  const { lines, expenses } = useBudget(trip);
  const ed = useEditor();
  const pending = usePendingExpenses(trip.id);
  const cur = trip.currency;
  const today = format(new Date(), "yyyy-MM-dd");
  const spent = (e: Expense[]) => sum(e.map((x) => Number(x.converted_amount)));

  // Daily allowance: budget minus prepaid (non-daily) plan and what was already spent, spread over remaining days
  const days = tripDays(trip.start_date, trip.end_date);
  const planned = sum(lines.map((l) => l.converted ?? 0));
  const goal = trip.budget ?? planned;
  const prepaid = sum(lines.filter((l) => !l.daily).map((l) => l.converted ?? 0));
  const before = spent(expenses.filter((e) => e.date < today));
  const todaySpent = spent(expenses.filter((e) => e.date === today));
  const s = toDate(trip.start_date), en = toDate(trip.end_date);
  const daysLeft = !s || !en ? 0 : today < trip.start_date! ? days.length : differenceInCalendarDays(en, new Date()) + 1;
  const allowance = Math.round(dailyAllowance(goal - prepaid - before, todaySpent, daysLeft) * 100) / 100; // em centavos, sem "-0,00"
  const notStarted = !!trip.start_date && today < trip.start_date;

  const cats = Object.keys(BUDGET_CATEGORIES).map((c) => {
    const p = sum(lines.filter((l) => l.category === c).map((l) => l.converted ?? 0));
    const r = spent(expenses.filter((e) => e.category === c)) + sum(lines.filter((l) => l.category === c && l.paid && !l.daily).map((l) => l.converted ?? 0));
    return { c, p, r };
  }).filter((x) => x.p || x.r);

  const ids = trip.trip_travelers.map((t) => t.id!);
  const name = Object.fromEntries(trip.trip_travelers.map((t) => [t.id!, t.name]));
  const bal = balances(expenses.map((e) => ({ ...e, converted_amount: Number(e.converted_amount), amount: Number(e.amount), splits: (e.splits as any) ?? [] })), ids);
  const transfers = settle(bal);
  const byDate = [...new Set(expenses.map((e) => e.date))].sort().reverse();

  return (
    <div className="space-y-6 pb-20">
      <h2 className="text-xl sm:text-2xl font-semibold">Gastos</h2>
      {pending.length > 0 && (
        <div className="rounded-xl border border-dashed border-warning/50 bg-warning/5 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-warning"><CloudOff className="size-4" /> {pending.length === 1 ? "1 gasto aguardando internet" : `${pending.length} gastos aguardando internet`}</p>
          <ul className="mt-2 space-y-1 text-sm">
            {pending.map((p) => (
              <li key={p.id} className="flex justify-between gap-3">
                <span className="truncate text-muted-foreground">{String(p.row["description"] || BUDGET_CATEGORIES[String(p.row["category"])] || "Gasto")}</span>
                <span className="font-num">{formatMoney(Number(p.row["amount"]), String(p.row["currency"] ?? cur))}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">Ficam salvos neste aparelho e entram na conta assim que a conexão voltar.</p>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-hero p-5 text-on-photo shadow-lift sm:col-span-2">
          <p className="flex items-center gap-2 text-sm opacity-90"><Wallet className="size-4" /> {notStarted ? "Por dia de viagem" : "Saldo de hoje"}</p>
          {daysLeft > 0 ? <>
            <p className="mt-2 font-display text-3xl font-semibold">{allowance > 0
                ? notStarted ? `Você poderá gastar ${formatMoney(allowance, cur)} por dia` : `Você ainda pode gastar ${formatMoney(allowance, cur)} hoje`
                : allowance === 0 ? "Orçamento todo reservado"
                : notStarted ? `O planejado passa ${formatMoney(-allowance, cur)} por dia do orçamento` : `Você passou ${formatMoney(-allowance, cur)} do limite de hoje`}</p>
            <p className="mt-1 text-sm opacity-80">Orçamento restante dividido por {daysLeft} {daysLeft === 1 ? "dia" : "dias"}, descontando o que já foi reservado.</p>
          </> : <p className="mt-2 font-display text-2xl">Viagem encerrada</p>}
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total gasto</p>
          <p className="mt-1 font-num text-2xl font-medium">{formatMoney(spent(expenses), cur)}</p>
          <p className="text-sm text-muted-foreground">Hoje: {formatMoney(todaySpent, cur)}</p>
        </div>
      </div>

      <section className="rounded-2xl border bg-card p-5 shadow-card">
        <h3 className="mb-4 font-semibold">Planejado × realizado</h3>
        {!cats.length ? <p className="text-sm text-muted-foreground">Sem dados ainda.</p> : (
          <div className="space-y-4">
            {cats.map(({ c, p, r }) => {
              const over = r > p;
              return (
                <div key={c}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium">{BUDGET_CATEGORIES[c]}</span>
                    <span className={cn("flex items-center gap-1", over && "font-semibold text-destructive")}>
                      {over && <AlertTriangle className="size-3.5" />}{formatMoney(r, cur)} <span className="text-muted-foreground">/ {formatMoney(p, cur)}</span>
                    </span>
                  </div>
                  <Progress value={p ? Math.min(100, (r / p) * 100) : 100} className={cn("h-2", over && "[&>div]:bg-destructive")} />
                  {over && <p className="mt-1 text-xs text-destructive">Ultrapassou o planejado em {formatMoney(r - p, cur)}</p>}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section>
          <h3 className="mb-3 font-semibold">Lançamentos</h3>
          {!expenses.length ? (
            <EmptyState icon={Receipt} title="Nenhum gasto lançado" text="Durante a viagem, toque em “+ Gasto” para registrar em segundos. Moeda e cotação já vêm preenchidas." />
          ) : byDate.map((d) => (
            <div key={d} className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{format(toDate(d)!, "EEE, dd/MM", { locale: ptBR })} · {formatMoney(spent(expenses.filter((e) => e.date === d)), cur)}</p>
              <div className="space-y-2">
                {expenses.filter((e) => e.date === d).map((e) => (
                  <button key={e.id} onClick={() => ed.open(e)} className="flex w-full items-center gap-3 rounded-xl border bg-card p-3 text-left shadow-card hover:border-primary/50">
                    {e.receipt_url ? <img src={e.receipt_url} alt="" className="size-10 rounded-md object-cover" /> : <span className="grid size-10 place-items-center rounded-md bg-secondary text-primary"><Receipt className="size-4" /></span>}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{e.description || BUDGET_CATEGORIES[e.category]}</p>
                      <p className="text-xs text-muted-foreground">{BUDGET_CATEGORIES[e.category]} · {PAYMENT_METHODS[e.payment_method]}{e.paid_by && name[e.paid_by] && ` · ${name[e.paid_by]}`}</p>
                    </div>
                    <div className="text-right text-sm">
                      <Money className="font-semibold" amount={Number(e.amount)} currency={e.currency} converted={Number(e.converted_amount)} trip={cur} />
                      {Number(e.fees_pct) > 0 && <p className="text-xs text-muted-foreground">+{Number(e.fees_pct)}% taxas</p>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>
        {ids.length > 1 && (
          <aside className="rounded-2xl bg-secondary/60 p-4 lg:self-start">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Acerto de contas</h3>
            <ul className="mb-4 space-y-1 text-sm">
              {ids.map((id) => (
                <li key={id} className="flex justify-between"><span>{name[id]}</span>
                  <span className={cn("font-medium", (bal[id] ?? 0) > 0.004 ? "text-success" : (bal[id] ?? 0) < -0.004 ? "text-destructive" : "text-muted-foreground")}>{formatMoney(bal[id] ?? 0, cur)}</span></li>
              ))}
            </ul>
            {!transfers.length ? <Pill tone="success">Tudo certo, ninguém deve nada</Pill> : (
              <div className="space-y-2">
                {transfers.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-xl bg-card p-3 text-sm shadow-card">
                    <span className="font-medium">{name[t.from]}</span><ArrowRight className="size-4 text-muted-foreground" /><span className="font-medium">{name[t.to]}</span>
                    <span className="ml-auto font-semibold">{formatMoney(t.amount, cur)}</span>
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}
      </div>
      {ed.editing && <ExpenseDialog trip={trip} row={ed.editing} onClose={ed.close} />}
    </div>
  );
}
