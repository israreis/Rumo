const cache = new Map<string, number>();

/** Latest rate from Frankfurter (ECB data, free, no key). Returns null if unsupported. */
export async function fetchRate(from: string, to: string): Promise<number | null> {
  if (from === to) return 1;
  const key = `${from}>${to}`;
  if (cache.has(key)) return cache.get(key)!;
  try {
    const r = await fetch(`https://api.frankfurter.dev/v1/latest?base=${from}&symbols=${to}`);
    if (!r.ok) return null;
    const j = await r.json();
    const v = j?.rates?.[to];
    if (typeof v !== "number") return null;
    cache.set(key, v);
    return v;
  } catch {
    return null;
  }
}

export const CARD_METHODS = ["credit", "debit", "multi"];

/** Fees (IOF + spread) only apply to foreign-currency card payments. */
export function feesFor(currency: string, tripCurrency: string, method: string, iof: number, spread: number) {
  return currency !== tripCurrency && CARD_METHODS.includes(method) ? (iof || 0) + (spread || 0) : 0;
}

export function convert(amount: number, rate: number, feesPct = 0) {
  return Math.round(amount * rate * (1 + feesPct / 100) * 100) / 100;
}
