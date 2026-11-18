import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** Mês em que os calendários abrem quando o campo está vazio (ex.: o início da viagem). */
export const DateDefaultMonth = React.createContext<string | null | undefined>(undefined);

/** "YYYY-MM-DD" → Date local (sem fuso). */
function parse(s?: string | null): Date | undefined {
  if (!s) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : undefined;
}
const iso = (d: Date) => format(d, "yyyy-MM-dd");

type Props = {
  value: string | null | undefined;
  onValueChange: (v: string) => void;
  id?: string | undefined;
  min?: string | undefined;
  max?: string | undefined;
  /** Mês exibido quando o campo está vazio (ex.: a data de ida, para a de volta). */
  defaultMonth?: string | null | undefined;
  placeholder?: string | undefined;
  className?: string | undefined;
  compact?: boolean | undefined;
  clearable?: boolean | undefined;
  disabled?: boolean | undefined;
  "aria-label"?: string | undefined;
};

/** Dígitos digitados → "dd/mm/aaaa" progressivo. */
function mask(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}
/** "dd/mm/aaaa" → "YYYY-MM-DD", ou null se a data não existir. */
function fromText(t: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(t);
  if (!m) return null;
  const dt = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  if (dt.getFullYear() !== Number(m[3]) || dt.getMonth() !== Number(m[2]) - 1 || dt.getDate() !== Number(m[1])) return null;
  return iso(dt);
}
const show = (v?: string | null) => { const d = parse(v); return d ? format(d, "dd/MM/yyyy") : ""; };

/**
 * Campo de data: dá para digitar (dd/mm/aaaa, só números) ou tocar no ícone e escolher no
 * calendário, que grava e fecha num toque, sem botão de confirmar.
 */
export function DateInput({ value, onValueChange, id, min, max, defaultMonth, placeholder = "dd/mm/aaaa", className, compact, disabled, ...rest }: Props) {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState(() => show(value));
  const focused = React.useRef(false);
  const selected = parse(value);
  const lo = parse(min), hi = parse(max);
  const year = new Date().getFullYear();
  const ctxMonth = React.useContext(DateDefaultMonth);
  const month = selected ?? parse(defaultMonth) ?? parse(ctxMonth) ?? hi;
  const label = rest["aria-label"];

  // Valor mudou por fora (calendário, outro campo): atualiza o texto se não estiver digitando
  React.useEffect(() => { if (!focused.current) setText(show(value)); }, [value]);

  const inRange = (v: string) => (!min || v >= min) && (!max || v <= max);

  function type(raw: string) {
    const t = mask(raw);
    setText(t);
    if (t === "") return onValueChange("");
    const v = fromText(t);
    if (v && inRange(v) && v !== value) onValueChange(v);
  }

  function blur() {
    focused.current = false;
    if (text === "") return;
    const v = fromText(text);
    // Data incompleta, inexistente ou fora do intervalo: volta para a última válida
    if (!v || !inRange(v)) setText(show(value));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className={cn("relative min-w-0", compact ? "inline-flex w-[6.75rem]" : "w-full", className)}>
          <PopoverTrigger asChild>
            <button type="button" disabled={disabled} aria-label={label ? `${label}: abrir calendário` : "Abrir calendário"}
              className={cn("absolute inset-y-0 left-0 my-auto grid place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none",
                compact ? "w-6" : "w-9")}>
              <CalendarDays className={compact ? "size-3.5" : "size-4"} />
            </button>
          </PopoverTrigger>
          <input
            id={id}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            aria-label={label}
            disabled={disabled}
            placeholder={compact ? "Prazo" : placeholder}
            value={text}
            onFocus={() => { focused.current = true; }}
            onBlur={blur}
            onChange={(e) => type(e.target.value)}
            className={cn(
              "flex w-full min-w-0 bg-transparent tabular-nums transition-colors placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              compact
                ? "h-7 rounded-md pl-6 pr-1 text-xs hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring"
                : "h-9 rounded-md border border-input pl-9 pr-2 text-base shadow-sm focus-visible:ring-1 focus-visible:ring-ring md:text-sm",
            )}
          />
        </div>
      </PopoverAnchor>
      <PopoverContent className="w-auto p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
        <Calendar
          mode="single"
          locale={ptBR}
          captionLayout="dropdown"
          startMonth={lo ?? new Date(year - 80, 0)}
          endMonth={hi ?? new Date(year + 15, 11)}
          {...(selected ? { selected } : {})}
          {...(month ? { defaultMonth: month } : {})}
          disabled={[...(lo ? [{ before: lo }] : []), ...(hi ? [{ after: hi }] : [])]}
          onSelect={(d) => {
            if (d) { onValueChange(iso(d)); setText(format(d, "dd/MM/yyyy")); }
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

/**
 * Data + hora ("YYYY-MM-DDTHH:mm"). A data usa o mesmo calendário (um toque grava);
 * a hora é um campo à parte. Ao escolher só a data, a hora começa em 00:00 e pode ser ajustada.
 */
export function DateTimeInput({ value, onValueChange, label, defaultMonth, min }: {
  value: string | null | undefined;
  onValueChange: (v: string | null) => void;
  label?: string | undefined;
  defaultMonth?: string | null | undefined;
  min?: string | undefined;
}) {
  const date = value?.slice(0, 10) ?? "";
  const time = value?.slice(11, 16) ?? "";
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_6.5rem] gap-2">
      <DateInput value={date} min={min} defaultMonth={defaultMonth} aria-label={label ? `${label}: data` : undefined}
        onValueChange={(d) => onValueChange(d ? `${d}T${time || "00:00"}` : null)} />
      <input type="time" aria-label={label ? `${label}: hora` : undefined} value={time} disabled={!date}
        onChange={(e) => onValueChange(date ? `${date}T${e.target.value || "00:00"}` : null)}
        className="flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 text-base shadow-sm tabular-nums focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />
    </div>
  );
}
