import { ArrowDownUp, Check, ChevronDown, CreditCard } from "lucide-react";
import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { currencyLabel } from "@/lib/countries";
import { formatDate } from "@/lib/trip-utils";
import type { Trip } from "@/lib/trips-api";
import { cn } from "@/lib/utils";

/** Moedas com cotação no Frankfurter (Banco Central Europeu) e o país da bandeira. */
const FLAGS: Record<string, string> = {
  BRL: "br", USD: "us", EUR: "eu", GBP: "gb", ISK: "is", CHF: "ch", CAD: "ca", AUD: "au", NZD: "nz", JPY: "jp",
  CNY: "cn", MXN: "mx", ZAR: "za", SEK: "se", NOK: "no", DKK: "dk", CZK: "cz", HUF: "hu", PLN: "pl", RON: "ro",
  BGN: "bg", TRY: "tr", THB: "th", SGD: "sg", HKD: "hk", INR: "in", KRW: "kr", ILS: "il", IDR: "id", MYR: "my", PHP: "ph",
};
export const CONVERTER_CURRENCIES = Object.keys(FLAGS);
/** IOF padrão de compras no cartão em moeda estrangeira, usado fora de uma viagem. */
const DEFAULT_IOF = 3.5;

type Rate = { rate: number; date: string };
const RATES_KEY = "rumo:cotacoes";
const PAIR_KEY = "rumo:conversor";

function saved<T>(key: string, fallback: T): T {
  try { return (JSON.parse(localStorage.getItem(key) ?? "null") as T | null) ?? fallback; } catch { return fallback; }
}
function save(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* sem armazenamento */ }
}

/** Cotação do dia; a última fica no aparelho para funcionar sem internet (ex.: dentro de uma loja). */
function useRate(from: string, to: string) {
  const pair = `${from}>${to}`;
  const cachedOf = (): Rate | null => (from === to ? { rate: 1, date: "" } : saved<Record<string, Rate>>(RATES_KEY, {})[pair] ?? null);
  const [state, setState] = useState<{ r: Rate | null; loading: boolean; offline: boolean }>(() => ({ r: cachedOf(), loading: from !== to, offline: false }));
  useEffect(() => {
    if (from === to) { setState({ r: { rate: 1, date: "" }, loading: false, offline: false }); return; }
    let alive = true;
    const cached = cachedOf();
    setState({ r: cached, loading: true, offline: false });
    fetch(`https://api.frankfurter.dev/v1/latest?base=${from}&symbols=${to}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("http"))))
      .then((j) => {
        const rate = j?.rates?.[to];
        if (typeof rate !== "number") throw new Error("sem cotação");
        const r = { rate, date: String(j.date ?? "") };
        save(RATES_KEY, { ...saved<Record<string, Rate>>(RATES_KEY, {}), [pair]: r });
        if (alive) setState({ r, loading: false, offline: false });
      })
      .catch(() => { if (alive) setState({ r: cached, loading: false, offline: true }); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pair]);
  return state;
}

/** Moeda local do destino de hoje (ou do primeiro destino em outra moeda). */
function tripForeign(trip: Trip): string | null {
  const today = new Date().toISOString().slice(0, 10);
  const dests = trip.trip_destinations.filter((d) => d.currency && d.currency !== trip.currency && FLAGS[d.currency]);
  const now = dests.find((d) => d.arrival_date && d.departure_date && d.arrival_date <= today && today <= d.departure_date);
  return now?.currency ?? dests[0]?.currency ?? null;
}

/** Bandeira redonda da moeda (circle-flags, domínio público via jsDelivr). */
export function Flag({ code, className }: { code: string; className?: string }) {
  const cc = FLAGS[code];
  if (!cc) return <span className={cn("grid size-7 shrink-0 place-items-center rounded-full bg-muted text-[9px] font-bold", className)}>{code}</span>;
  return (
    <img src={`https://cdn.jsdelivr.net/gh/HatScripts/circle-flags@gh-pages/flags/${cc}.svg`} alt="" width={28} height={28} loading="lazy"
      className={cn("size-7 shrink-0 rounded-full shadow-sm ring-1 ring-border", className)} />
  );
}

function CurrencyPicker({ value, onChange, label }: { value: string; onChange: (c: string) => void; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-label={`${label}: ${currencyLabel(value)}`}
          className="flex shrink-0 items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-muted">
          <Flag code={value} />
          <span className="font-display text-xl font-semibold text-primary">{value}</span>
          <ChevronDown className="size-4 text-primary" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="max-h-72 w-64 overflow-y-auto p-1">
        {CONVERTER_CURRENCIES.map((c) => (
          <button key={c} type="button" onClick={() => { onChange(c); setOpen(false); }}
            className={cn("flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted", c === value && "bg-muted")}>
            <Flag code={c} className="size-6" />
            <span className="font-semibold">{c}</span>
            <span className="min-w-0 truncate text-muted-foreground">{currencyLabel(c).split(" · ")[1] ?? ""}</span>
            {c === value && <Check className="ml-auto size-4 shrink-0 text-primary" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

const fmt = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** Dígitos entram pela direita, como nos campos de dinheiro do app (1 → 0,01). */
const parseCents = (s: string) => { const d = s.replace(/\D/g, "").replace(/^0+/, "").slice(0, 13); return d ? Number(d) / 100 : null; };

/**
 * Conversor no estilo de app de câmbio: duas linhas (valor + bandeira e código da moeda) e o botão de
 * inverter entre elas. Abas: "No cartão" (cotação + IOF e spread) e "Só cotação" (dinheiro, Wise).
 * Dentro de uma viagem usa a moeda do destino e as taxas dela; fora (barra de navegação), IOF padrão
 * e o último par usado.
 */
export function CurrencyConverter({ trip, className, bare }: { trip?: Trip | undefined; className?: string | undefined; bare?: boolean | undefined }) {
  const home = trip?.currency ?? "BRL";
  const fees = trip ? (Number(trip.iof_pct) || 0) + (Number(trip.card_spread_pct) || 0) : DEFAULT_IOF;
  const [last] = useState(() => saved<{ from?: string; to?: string; mode?: "card" | "plain" }>(PAIR_KEY, {}));

  const [mode, setMode] = useState<"card" | "plain">(last.mode ?? "card");
  const [top, setTop] = useState(() => (trip && tripForeign(trip)) || (last.from && FLAGS[last.from] ? last.from : "USD"));
  const [bottom, setBottom] = useState(() => (trip ? home : last.to && FLAGS[last.to] ? last.to : "BRL"));
  // Valor digitado e em qual linha; a outra linha é calculada.
  const [amount, setAmount] = useState<number | null>(null);
  const [side, setSide] = useState<"top" | "bottom">("top");

  useEffect(() => { if (!trip) save(PAIR_KEY, { from: top, to: bottom, mode }); }, [trip, top, bottom, mode]);

  const { r, loading, offline } = useRate(top, bottom);
  // No cartão as taxas incidem sobre o que sai do seu bolso (moeda da viagem)
  const pct = mode === "card" ? fees : 0;
  const homeOnBottom = bottom === home || top !== home;
  const factor = r ? (homeOnBottom ? r.rate * (1 + pct / 100) : r.rate / (1 + pct / 100)) : null;

  const topValue = side === "top" ? amount : amount != null && factor ? amount / factor : null;
  const bottomValue = side === "bottom" ? amount : amount != null && factor ? amount * factor : null;

  function swap() {
    setTop(bottom);
    setBottom(top);
    setSide((s) => (s === "top" ? "bottom" : "top"));
  }

  const row = (which: "top" | "bottom") => {
    const code = which === "top" ? top : bottom;
    const value = which === "top" ? topValue : bottomValue;
    return (
      <div className="flex items-center gap-3 rounded-2xl border bg-background/70 px-4 py-3 transition-shadow focus-within:ring-2 focus-within:ring-ring">
        <input
          inputMode="numeric"
          autoComplete="off"
          aria-label={`Valor em ${code}`}
          placeholder="0,00"
          value={value == null ? "" : fmt(value)}
          onChange={(e) => { setSide(which); setAmount(parseCents(e.target.value)); }}
          onFocus={(e) => { const el = e.currentTarget; requestAnimationFrame(() => el.setSelectionRange(el.value.length, el.value.length)); }}
          size={1}
          className="w-0 min-w-0 flex-1 bg-transparent font-display text-3xl font-semibold tabular-nums outline-none placeholder:text-muted-foreground/40"
        />
        <CurrencyPicker label={which === "top" ? "Moeda de origem" : "Moeda de destino"} value={code}
          onChange={(c) => (which === "top" ? setTop(c) : setBottom(c))} />
      </div>
    );
  };

  return (
    <section className={cn("min-w-0", !bare && "rounded-2xl border bg-card p-5 shadow-card", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-display text-lg font-semibold tabular-nums">
          {factor ? `1 ${top} = ${factor.toLocaleString("pt-BR", { maximumFractionDigits: 4 })} ${bottom}` : loading ? "Buscando cotação…" : `1 ${top} = — ${bottom}`}
        </p>
        <div role="tablist" aria-label="Tipo de conversão" className="inline-flex rounded-full bg-muted p-1 text-xs font-semibold sm:text-sm">
          {([["card", "No cartão"], ["plain", "Só cotação"]] as const).map(([k, l]) => (
            <button key={k} role="tab" type="button" aria-selected={mode === k} onClick={() => setMode(k)}
              className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors",
                mode === k ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {k === "card" && <CreditCard className="size-3.5" />}{l}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-4 space-y-2">
        {row("top")}
        <button type="button" onClick={swap} aria-label="Inverter moedas"
          className={cn("absolute left-1/2 top-1/2 z-10 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 bg-muted text-primary transition-transform hover:scale-105 active:scale-95", bare ? "border-background" : "border-card")}>
          <ArrowDownUp className="size-4" />
        </button>
        {row("bottom")}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {mode === "card"
          ? `Com ${fees.toLocaleString("pt-BR")}% de ${trip ? "IOF e spread da viagem" : "IOF"} sobre a cotação: o que vem na fatura.`
          : "Só a cotação, sem taxas: para dinheiro, Wise ou ter noção do preço."}
        {r?.date ? ` Cotação de ${formatDate(r.date)}.` : ""}
        {offline ? (r ? " Sem internet: usando a última cotação salva." : " Sem internet e sem cotação salva para essas moedas.") : ""}
      </p>
    </section>
  );
}
