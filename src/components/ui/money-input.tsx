import * as React from "react";

import { cn } from "@/lib/utils";

const MAX_DIGITS = 13;
const fmt = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Símbolo da moeda (R$, €, US$…); cai para o código se a moeda for desconhecida. */
export function currencySymbol(currency?: string | null): string {
  if (!currency) return "";
  try {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).formatToParts(0).find((p) => p.type === "currency")?.value ?? currency;
  } catch {
    return currency;
  }
}

type Props = Omit<React.ComponentProps<"input">, "value" | "onChange" | "type" | "defaultValue"> & {
  value: number | string | null | undefined;
  onValueChange: (v: number | null) => void;
  currency?: string | null | undefined;
};

/**
 * Campo de valor com máscara de moeda: os dígitos entram pela direita (1 → 0,01; 150 → 1,50).
 * Vazio vira null.
 */
export const MoneyInput = React.forwardRef<HTMLInputElement, Props>(({ value, onValueChange, currency, className, placeholder = "0,00", ...props }, ref) => {
  const n = value === "" || value == null ? null : Number(value);
  const shown = n == null || Number.isNaN(n) ? "" : fmt.format(n);
  const symbol = currencySymbol(currency);

  function change(e: React.ChangeEvent<HTMLInputElement>) {
    let digits = e.target.value.replace(/\D/g, "").replace(/^0+/, "");
    const prev = shown.replace(/\D/g, "").replace(/^0+/, "");
    // Apagou só a vírgula ou o ponto: remove o último dígito
    if (digits === prev && e.target.value.length < shown.length) digits = digits.slice(0, -1);
    digits = digits.slice(0, MAX_DIGITS);
    onValueChange(digits === "" ? null : Number(digits) / 100);
  }

  return (
    <div className="relative min-w-0">
      {symbol && (
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[0.85em] text-muted-foreground">{symbol}</span>
      )}
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={shown}
        onChange={change}
        onFocus={(e) => { const el = e.currentTarget; requestAnimationFrame(() => el.setSelectionRange(el.value.length, el.value.length)); }}
        className={cn(
          "tabular-nums flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          symbol && (symbol.length > 2 ? "pl-12" : "pl-9"),
          className,
        )}
        {...props}
      />
    </div>
  );
});
MoneyInput.displayName = "MoneyInput";
