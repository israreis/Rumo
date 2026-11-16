import { useQueryClient } from "@tanstack/react-query";
import { CloudOff, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { feesFor } from "@/lib/fx";
import { isNetworkError, pendingExpenses, removePending, subscribePending, type PendingExpense } from "@/lib/offline-queue";
import { saveRow } from "@/lib/plan-api";
import { cn } from "@/lib/utils";
import { withFx } from "@/components/plan/common";

const EMPTY: PendingExpense[] = [];
let snapshot: PendingExpense[] = EMPTY;
let snapshotKey = "";

function getSnapshot(): PendingExpense[] {
  const next = pendingExpenses();
  const key = next.map((p) => p.id).join(",");
  if (key !== snapshotKey) {
    snapshotKey = key;
    snapshot = next.length ? next : EMPTY;
  }
  return snapshot;
}

/** Pending offline expenses, optionally for one trip; re-renders when the queue changes. */
export function usePendingExpenses(tripId?: string) {
  const all = useSyncExternalStore(subscribePending, getSnapshot, () => EMPTY);
  return tripId ? all.filter((p) => p.tripId === tripId) : all;
}

export function useOnline() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("online", cb);
      window.addEventListener("offline", cb);
      return () => {
        window.removeEventListener("online", cb);
        window.removeEventListener("offline", cb);
      };
    },
    () => navigator.onLine,
    () => true,
  );
}

async function sendOne(p: PendingExpense) {
  const f = p.row as Record<string, any>;
  const fees = feesFor(String(f["currency"] ?? p.tripCurrency), p.tripCurrency, String(f["payment_method"] ?? "credit"), p.iofPct, p.spreadPct);
  const priced = await withFx(f, p.tripCurrency, Number(f["amount"]), fees);
  const { created_at: _c, ...rest } = priced as Record<string, any>;
  await saveRow("expenses", { ...rest, fees_pct: fees, trip_id: p.tripId });
}

/** Sends queued expenses when the connection returns. Mount once in the signed-in layout. */
export function useOfflineSync() {
  const qc = useQueryClient();
  const busy = useRef(false);
  const [syncing, setSyncing] = useState(false);

  const flush = useCallback(async () => {
    if (busy.current || !navigator.onLine) return;
    const queue = pendingExpenses();
    if (!queue.length) return;
    busy.current = true;
    setSyncing(true);
    let sent = 0;
    for (const p of queue) {
      try {
        await sendOne(p);
        removePending(p.id);
        sent++;
        qc.invalidateQueries({ queryKey: ["plan", "expenses", p.tripId] });
      } catch (err) {
        if (isNetworkError(err)) break; // still offline: try again later
        console.error(err);
        toast.error(`Um gasto offline não pôde ser enviado: ${String((err as Error)?.message ?? err)}`);
        removePending(p.id);
      }
    }
    busy.current = false;
    setSyncing(false);
    if (sent) toast.success(sent === 1 ? "1 gasto offline sincronizado" : `${sent} gastos offline sincronizados`);
  }, [qc]);

  useEffect(() => {
    flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, [flush]);

  return { flush, syncing };
}

/** Small header chip: offline state and how many expenses are waiting to sync. */
export function OfflineIndicator({ className }: { className?: string }) {
  const online = useOnline();
  const pending = usePendingExpenses();
  const { flush, syncing } = useOfflineSync();
  if (online && !pending.length) return null;
  return (
    <button
      type="button"
      onClick={() => flush()}
      disabled={!online || syncing}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        online ? "border-warning/40 bg-warning/10 text-warning" : "border-border bg-muted text-muted-foreground",
        className,
      )}
      title={online ? "Enviar gastos pendentes agora" : "Sem conexão: o que você lançar fica salvo no aparelho"}
    >
      {online ? <RefreshCw className={cn("size-3.5", syncing && "animate-spin")} /> : <CloudOff className="size-3.5" />}
      {online ? `${pending.length} pendente${pending.length > 1 ? "s" : ""}` : pending.length ? `Offline · ${pending.length}` : "Offline"}
    </button>
  );
}
