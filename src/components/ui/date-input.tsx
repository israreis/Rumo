import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, X } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

/** Seletor de data: um toque no dia já grava e fecha, sem botão de confirmar. */
export function DateInput({ value, onValueChange, id, min, max, defaultMonth, placeholder = "dd/mm/aaaa", className, compact, clearable = true, disabled, ...rest }: Props) {
  const [open, setOpen] = React.useState(false);
  const selected = parse(value);
  const lo = parse(min), hi = parse(max);
  const year = new Date().getFullYear();
  const ctxMonth = React.useContext(DateDefaultMonth);
  const month = selected ?? parse(defaultMonth) ?? parse(ctxMonth) ?? hi;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn("relative min-w-0", compact ? "inline-flex" : "@container w-full", className)}>
        <PopoverTrigger asChild>
          <button
            type="button"
            id={id}
            disabled={disabled}
            aria-label={rest["aria-label"]}
            className={cn(
              "flex w-full min-w-0 items-center gap-1.5 text-left transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              compact
                ? "h-7 rounded-md px-1.5 text-xs hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring"
                  : "h-9 rounded-md border border-input bg-transparent px-2.5 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring @[11rem]:text-base md:!text-sm",
              clearable && selected && !compact && "pr-8",
            )}
          >
            <CalendarDays className={cn("shrink-0 text-muted-foreground", compact ? "size-3.5" : "hidden size-4 @[9.5rem]:block")} />
            <span className={cn("truncate tabular-nums", !selected && "text-muted-foreground")}>
              {selected ? format(selected, compact ? "dd/MM/yy" : "dd/MM/yyyy") : compact ? "Prazo" : placeholder}
            </span>
          </button>
        </PopoverTrigger>
        {clearable && selected && !compact && !disabled && (
          <button type="button" aria-label="Limpar data" onClick={() => onValueChange("")}
            className="absolute inset-y-0 right-0.5 my-auto grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <PopoverContent className="w-auto p-0" align="start">
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
            if (d) onValueChange(iso(d));
            setOpen(false);
          }}
          autoFocus
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
