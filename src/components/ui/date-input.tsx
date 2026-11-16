import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, X } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
  id?: string;
  min?: string;
  max?: string;
  /** Mês exibido quando o campo está vazio (ex.: a data de ida, para a de volta). */
  defaultMonth?: string | null;
  placeholder?: string;
  className?: string;
  compact?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  "aria-label"?: string;
};

/** Seletor de data: um toque no dia já grava e fecha, sem botão de confirmar. */
export function DateInput({ value, onValueChange, id, min, max, defaultMonth, placeholder = "dd/mm/aaaa", className, compact, clearable = true, disabled, ...rest }: Props) {
  const [open, setOpen] = React.useState(false);
  const selected = parse(value);
  const lo = parse(min), hi = parse(max);
  const year = new Date().getFullYear();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn("relative min-w-0", compact ? "inline-flex" : "w-full", className)}>
        <PopoverTrigger asChild>
          <button
            type="button"
            id={id}
            disabled={disabled}
            aria-label={rest["aria-label"]}
            className={cn(
              "flex w-full min-w-0 items-center gap-2 text-left transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              compact
                ? "h-7 rounded-md px-1.5 text-xs hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring"
                : "h-9 rounded-md border border-input bg-transparent px-3 text-base shadow-sm focus-visible:ring-1 focus-visible:ring-ring md:text-sm",
              clearable && selected && !compact && "pr-9",
            )}
          >
            <CalendarDays className={cn("shrink-0 text-muted-foreground", compact ? "size-3.5" : "size-4")} />
            <span className={cn("truncate font-num", !selected && "text-muted-foreground")}>
              {selected ? format(selected, compact ? "dd/MM/yy" : "dd/MM/yyyy") : compact ? "Prazo" : placeholder}
            </span>
          </button>
        </PopoverTrigger>
        {clearable && selected && !compact && !disabled && (
          <button type="button" aria-label="Limpar data" onClick={() => onValueChange("")}
            className="absolute inset-y-0 right-1 my-auto grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
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
          selected={selected}
          defaultMonth={selected ?? parse(defaultMonth) ?? hi ?? undefined}
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
