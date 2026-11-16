/**
 * Expenses entered without internet wait here (localStorage) and are sent when the
 * connection comes back. Each entry carries what is needed to price it later:
 * the trip currency and the card fees in force when it was typed.
 */
export type PendingExpense = {
  id: string;
  tripId: string;
  tripCurrency: string;
  iofPct: number;
  spreadPct: number;
  row: Record<string, unknown>;
  createdAt: number;
};

const KEY = "rumo:pending-expenses";
const listeners = new Set<() => void>();

function safeRead(): PendingExpense[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as PendingExpense[]) : [];
  } catch {
    return [];
  }
}

function write(items: PendingExpense[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* storage full or blocked: nothing else we can do offline */
  }
  listeners.forEach((l) => l());
}

export function pendingExpenses(tripId?: string): PendingExpense[] {
  const all = safeRead();
  return tripId ? all.filter((p) => p.tripId === tripId) : all;
}

export function enqueueExpense(entry: Omit<PendingExpense, "id" | "createdAt">) {
  const item: PendingExpense = { ...entry, id: crypto.randomUUID(), createdAt: Date.now() };
  write([...safeRead(), item]);
  return item;
}

export function removePending(id: string) {
  write(safeRead().filter((p) => p.id !== id));
}

export function subscribePending(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === KEY && listener();
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

/** Fetch failures that mean "no connection" rather than a real server error. */
export function isNetworkError(err: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  const msg = String((err as { message?: unknown } | null)?.message ?? err ?? "");
  return /failed to fetch|networkerror|load failed|network request failed|fetch failed/i.test(msg);
}
