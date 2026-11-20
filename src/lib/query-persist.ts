import { dehydrate, hydrate, type QueryClient } from "@tanstack/react-query";

/**
 * Guarda o cache do react-query no aparelho (localStorage). Ao abrir o PWA, as telas
 * aparecem na hora com os últimos dados e se atualizam em segundo plano.
 */
const KEY = "rumo:query-cache";
const VERSION = 1;
const MAX_AGE = 7 * 24 * 3600_000;
const MAX_BYTES = 2_500_000;

export function restoreQueryCache(qc: QueryClient) {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const saved = JSON.parse(raw) as { v: number; at: number; state: unknown };
    if (saved.v !== VERSION || Date.now() - saved.at > MAX_AGE) { localStorage.removeItem(KEY); return; }
    hydrate(qc, saved.state as never);
  } catch {
    try { localStorage.removeItem(KEY); } catch { /* sem storage */ }
  }
}

export function clearPersistedQueryCache() {
  try { localStorage.removeItem(KEY); } catch { /* sem storage */ }
}

function save(qc: QueryClient) {
  try {
    const state = dehydrate(qc, {
      shouldDehydrateQuery: (q) => q.state.status === "success" && q.meta?.persist !== false,
    });
    const raw = JSON.stringify({ v: VERSION, at: Date.now(), state });
    if (raw.length > MAX_BYTES) return;
    localStorage.setItem(KEY, raw);
  } catch { /* cheio ou indisponível: segue sem cache */ }
}

/** Salva (com folga) sempre que o cache muda, e na hora quando o app vai para o fundo. */
export function persistQueryCache(qc: QueryClient) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const schedule = () => {
    if (timer) return;
    timer = setTimeout(() => { timer = null; save(qc); }, 1500);
  };
  const unsub = qc.getQueryCache().subscribe((e) => { if (e.type === "updated" || e.type === "removed") schedule(); });
  const onHide = () => { if (document.visibilityState === "hidden") save(qc); };
  document.addEventListener("visibilitychange", onHide);
  return () => { unsub(); document.removeEventListener("visibilitychange", onHide); if (timer) clearTimeout(timer); };
}
