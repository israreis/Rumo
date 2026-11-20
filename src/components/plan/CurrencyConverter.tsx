import { ArrowDownUp, CreditCard, Repeat } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MoneyInput } from "@/components/ui/money-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { currencyLabel } from "@/lib/countries";
import { CURRENCIES, formatDate, formatMoney } from "@/lib/trip-utils";
import type { Trip } from "@/lib/trips-api";
import { cn } from "@/lib/utils";

type Rate = { rate: number; date: string };
const KEY = "rumo:cotacoes";

/** Cotações já buscadas ficam no aparelho: na loja, sem internet, o conversor usa a última. */
function savedRates(): Record<string, Rate> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "{}"); } catch { return {}; }
}
function saveRate(pair: string, r: Rate) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...savedRates(), [pair]: r })); } catch { /* sem armazenamento */ }
}

/** Cotação do dia (Banco Central Europeu, via Frankfurter: gratuita, sem chave). */
function useRate(from: string, to: string) {
  const pair = `${from}>${to}`;
  const [state, setState] = useState<{ r: Rate | null; loading: boolean; offline: boolean }>(() => ({
    r: from === to ? { rate: 1, date: "" } : savedRates()[pair] ?? null, loading: from !== to, offline: false,
  }));
  useEffect(() => {
    if (from === to) return setState({ r: { rate: 1, date: "" }, loading: false, offline: false });
    let alive = true;
    const cached = savedRates()[pair] ?? null;
    setState({ r: cached, loading: true, offline: false });
    fetch(`https://api.frankfurter.dev/v1/latest?base=${from}&symbols=${to}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((j) => {
        const rate = j?.rates?.[to];
        if (typeof rate !== "number") throw new Error();
        const r = { rate, date: String(j.date ?? "") };
        saveRate(pair, r);
        if (alive) setState({ r, loading: false, offline: false });
      })
      .catch(() => { if (alive) setState({ r: cached, loading: false, offline: true }); });
    return () => { alive = false; };
  }, [from, to, pair]);
  return state;
}

/** Moeda local do destino de hoje (ou do primeiro destino em outra moeda). */
function defaultCurrency(trip: Trip) {
  const today = new Date().toISOString().slice(0, 10);
  const dests = trip.trip_destinations.filter((d) => d.currency && d.currency !== trip.currency);
  const now = dests.find((d) => d.arrival_date && d.departure_date && d.arrival_date <= today && today <= d.departure_date);
  return now?.currency ?? dests[0]?.currency ?? (trip.currency === "USD" ? "EUR" : "USD");
}

/**
 * Conversor rápido: valor em moeda estrangeira → moeda da viagem. Duas abas: "No cartão"
 * (cotação + IOF + spread da viagem, quanto vem na fatura) e "Só cotação" (dinheiro, Wise, noção de preço).
 */
export function CurrencyConverter({ trip, className }: { trip: Trip; className?: string }) {
  const [mode, setMode] = useState<"card" | "plain">("card");
  const [foreign, setForeign] = useState(() => defaultCurrency(trip));
  const [reverse, setReverse] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const home = trip.currency;
  const fees = (Number(trip.iof_pct) || 0) + (Number(trip.card_spread_pct) || 0);
  const pct = mode === "card" ? fees : 0;

  const { r, loading, offline } = useRate(foreign, home);
  const from = reverse ? home : foreign;
  const to = reverse ? foreign : home;

  const result = useMemo(() => {
    if (!r || amount == null) return null;
    const factor = r.rate * (1 + pct / 100); // 1 estrangeira → moeda da viagem, já com taxas
    return reverse ? amount / factor : amount * factor;
  }, [r, amount, pct, reverse]);

  const options = useMemo(() => {
    const own = trip.trip_destinations.map((d) => d.currency).filter((c): c is string => !!c && c !== home);
    return [...new Set([...own, ...CURRENCIES.filter((c) => c !== home)])];
  }, [trip.trip_destinations, home]);

  return (
    <section className={cn("rounded-2xl border bg-card p-5 shadow-card", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><Repeat className="size-5 text-primary" /> Conversor</h2>
        <Tabs value={mode} onValueChange={(v) => setMode(v as "card" | "plain")}>
          <TabsList className="h-9">
            <TabsTrigger value="card" className="gap-1.5 text-xs sm:text-sm"><CreditCard className="size-3.5" /> No cartão</TabsTrigger>
            <TabsTrigger value="plain" className="text-xs sm:text-sm">Só cotação</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {mode === "card"
          ? fees > 0 ? `Cotação + IOF e spread da viagem (${fees.toLocaleString("pt-BR")}%): quanto vem na fatura.` : "Cotação + taxas do cartão (IOF e spread estão zerados nesta viagem)."
          : "Só a cotação do dia, sem taxas: para dinheiro, Wise ou ter noção do preço."}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-end">
        <div className="space-y-1.5">
          <div className="flex gap-2">
            {reverse ? (
              <span className="flex h-9 shrink-0 items-center rounded-md border bg-muted/40 px-3 text-sm font-medium">{home}</span>
            ) : (
              <Select value={foreign} onValueChange={setForeign}>
                <SelectTrigger aria-label="Moeda do preço" className="w-24 shrink-0"><SelectValue /></SelectTrigger>
                <SelectContent>{options.map((c) => <SelectItem key={c} value={c}>{currencyLabel(c)}</SelectItem>)}</SelectContent>
              </Select>
            )}
            <div className="min-w-0 flex-1">
              <MoneyInput aria-label="Valor" currency={from} value={amount} onValueChange={setAmount} className="h-9 text-lg font-semibold md:text-lg" />
            </div>
          </div>
        </div>

        <button type="button" onClick={() => setReverse((v) => !v)} aria-label="Inverter a conversão"
          className="mx-auto grid size-9 place-items-center rounded-full border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:mb-0">
          <ArrowDownUp className="size-4 sm:rotate-90" />
        </button>

        <div className="flex h-9 items-center gap-2 rounded-md bg-primary/10 px-3">
          {reverse ? (
            <Select value={foreign} onValueChange={setForeign}>
              <SelectTrigger aria-label="Moeda de destino" className="h-7 w-24 shrink-0 border-0 bg-transparent px-1 shadow-none"><SelectValue /></SelectTrigger>
              <SelectContent>{options.map((c) => <SelectItem key={c} value={c}>{currencyLabel(c)}</SelectItem>)}</SelectContent>
            </Select>
          ) : (
            <span className="text-sm font-medium text-muted-foreground">{home}</span>
          )}
          <span className="ml-auto truncate font-display text-xl font-semibold tabular-nums text-primary" aria-live="polite">
            {result != null ? formatMoney(result, to) : loading && !r ? "…" : "—"}
          </span>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {r
          ? <>1 {foreign} = {formatMoney(r.rate * (1 + pct / 100), home)}{pct ? ` com taxas (cotação ${formatMoney(r.rate, home)})` : ""}{r.date ? ` · cotação de ${formatDate(r.date)}` : ""}{offline ? " · sem internet, usando a última cotação salva" : ""}</>
          : offline ? "Sem internet e sem cotação salva para essa moeda." : "Buscando a cotação…"}
      </p>
    </section>
  );
}
