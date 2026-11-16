import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarClock, PiggyBank, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/EmptyState";
import { BUDGET_CATEGORIES, budgetItemAmount, installmentSchedule } from "@/lib/budget";
import { tripDays } from "@/lib/itinerary";
import { formatDate, formatMoney } from "@/lib/trip-utils";
import type { Trip } from "@/lib/trips-api";
import { cn } from "@/lib/utils";
import { CurrencyF, EditDialog, Field, FxF, Money, PaymentFields, Pill, SelectF, TextF, useEditor, withFx } from "./common";
import { sum, useBudget, type Line } from "./useBudget";

const KIND = { fixed: "Valor fixo", daily: "Estimativa diária" };

export function BudgetTab({ trip }: { trip: Trip }) {
  const { lines } = useBudget(trip);
  const ed = useEditor();
  const days = Math.max(1, tripDays(trip.start_date, trip.end_date).length);
  const people = Math.max(1, trip.travelers_count);
  const cur = trip.currency;
  const val = (l: Line) => l.converted ?? 0;
  const total = sum(lines.map(val));
  const paid = sum(lines.filter((l) => l.paid).map(val));
  const goal = trip.budget ?? 0;
  const byCat = Object.keys(BUDGET_CATEGORIES).map((c) => ({ c, v: sum(lines.filter((l) => l.category === c).map(val)), ls: lines.filter((l) => l.category === c) })).filter((x) => x.ls.length);

  // Due calendar: installments by month, otherwise due date for items still to pay
  const due: { month: string; label: string; amount: number; date?: string }[] = [];
  for (const l of lines) {
    if (l.installments > 1 && l.first_month) installmentSchedule(val(l), l.installments, l.first_month).forEach((p, i) => due.push({ month: p.month, amount: p.amount, label: `${l.label} (${i + 1}/${l.installments})` }));
    else if (!l.paid && l.due_date) due.push({ month: l.due_date.slice(0, 7), amount: val(l), label: l.label, date: l.due_date });
  }
  const months = [...new Set(due.map((d) => d.month))].sort();

  const openNew = () => ed.open({ category: "food", kind: "fixed", currency: cur, days, people, paid: false, installments: 1 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Orçamento</h2>
        <Button onClick={openNew}><Plus /> Item</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border bg-card p-4 shadow-card sm:col-span-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Planejado</p>
          <p className="mt-1 font-display text-3xl font-semibold">{formatMoney(total, cur)}</p>
          {goal > 0 && <>
            <Progress value={Math.min(100, (total / goal) * 100)} className={cn("mt-3", total > goal && "[&>div]:bg-destructive")} />
            <p className={cn("mt-2 text-sm", total > goal ? "text-destructive" : "text-muted-foreground")}>
              {total > goal ? `${formatMoney(total - goal, cur)} acima` : `${formatMoney(goal - total, cur)} livres`} do orçamento de {formatMoney(goal, cur)}
            </p>
          </>}
        </div>
        <Stat label="Por pessoa" value={formatMoney(total / people, cur)} />
        <Stat label="Por dia" value={formatMoney(total / days, cur)} />
        <Stat label="Já pago" value={formatMoney(paid, cur)} tone="success" />
        <Stat label="A pagar" value={formatMoney(total - paid, cur)} tone="warning" />
      </div>

      {!lines.length ? (
        <EmptyState icon={PiggyBank} title="Orçamento vazio" text="Transportes, hospedagens e atividades com valor entram aqui sozinhos. Adicione também estimativas como alimentação por dia." action={<Button onClick={openNew}><Plus /> Adicionar item</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            {byCat.map(({ c, v, ls }) => (
              <section key={c} className="rounded-2xl border bg-card p-4 shadow-card">
                <div className="mb-2 flex items-baseline justify-between">
                  <h3 className="font-semibold">{BUDGET_CATEGORIES[c]}</h3>
                  <span className="font-display text-lg font-semibold">{formatMoney(v, cur)}</span>
                </div>
                <Progress value={total ? (v / total) * 100 : 0} className="mb-3 h-1.5" />
                <ul className="divide-y">
                  {ls.map((l) => (
                    <li key={l.key}>
                      <button disabled={l.auto} onClick={() => ed.open(l.row)} className="flex w-full items-center gap-2 py-2 text-left text-sm enabled:hover:text-primary">
                        <span className="min-w-0 flex-1 truncate">{l.label}</span>
                        {l.auto && <Pill><Sparkles className="size-3" /> auto</Pill>}
                        {l.daily && <Pill tone="primary">diária</Pill>}
                        {l.installments > 1 && <Pill>{l.installments}×</Pill>}
                        <Pill tone={l.paid ? "success" : "warning"}>{l.paid ? "Pago" : "A pagar"}</Pill>
                        <Money className="shrink-0 text-right font-medium" amount={l.amount} currency={l.currency} converted={l.converted} trip={cur} />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <aside className="rounded-2xl bg-secondary/60 p-4 lg:sticky lg:top-20 lg:self-start">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground"><CalendarClock className="size-4" /> Vencimentos</h3>
            {!months.length ? <p className="text-sm text-muted-foreground">Informe vencimentos ou parcelas nos itens para ver o calendário.</p> : (
              <div className="space-y-4">
                {months.map((m) => {
                  const ds = due.filter((d) => d.month === m);
                  return (
                    <div key={m}>
                      <div className="flex justify-between text-sm font-semibold capitalize"><span>{format(parseISO(`${m}-01`), "MMMM yyyy", { locale: ptBR })}</span><span>{formatMoney(sum(ds.map((d) => d.amount)), cur)}</span></div>
                      <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                        {ds.map((d, i) => <li key={i} className="flex justify-between gap-2"><span className="truncate">{d.date && `${formatDate(d.date).slice(0, 5)} · `}{d.label}</span><span>{formatMoney(d.amount, cur)}</span></li>)}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </aside>
        </div>
      )}

      {ed.editing && (
        <EditDialog table={"budget_items" as any} tripId={trip.id} open onOpenChange={(o) => !o && ed.close()} title={ed.editing.id ? "Editar item" : "Novo item do orçamento"} initial={ed.editing}
          prepare={(f) => withFx(f, cur, budgetItemAmount({ ...f, amount: Number(f.amount) || 0 }))}>
          {(f, set) => (
            <>
              <TextF f={f} set={set} k="description" label="Descrição" className="sm:col-span-2" />
              <SelectF f={f} set={set} k="category" label="Categoria" options={BUDGET_CATEGORIES} />
              <SelectF f={f} set={set} k="kind" label="Tipo" options={KIND} />
              <TextF f={f} set={set} k="amount" label={f.kind === "daily" ? "Valor por dia por pessoa" : "Valor"} type="number" />
              <CurrencyF f={f} set={set} />
              {f.kind === "daily" && <>
                <TextF f={f} set={set} k="days" label="Nº de dias" type="number" />
                <TextF f={f} set={set} k="people" label="Nº de pessoas" type="number" />
              </>}
              <FxF f={f} set={set} trip={cur} />
              <Field label="Total"><p className="flex h-9 items-center font-semibold">{formatMoney(budgetItemAmount({ ...f, amount: Number(f.amount) || 0 }), f.currency)}</p></Field>
              <Field label="Já pago"><div className="flex h-9 items-center gap-2"><Switch checked={!!f.paid} onCheckedChange={(v) => set("paid", v)} /> {f.paid ? "Sim" : "Não"}</div></Field>
              <PaymentFields f={f} set={set} />
            </>
          )}
        </EditDialog>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "success" | "warning" }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-card">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-display text-xl font-semibold", tone === "success" && "text-success")}>{value}</p>
    </div>
  );
}
