import { useEffect, useState } from "react";

/**
 * Arquivos da viagem (documentos, passagens, reservas) guardados no aparelho, para abrir
 * na imigração mesmo sem internet. Ficam num cache próprio ("rumo-docs"), que não é limpo
 * a cada versão nova do app nem por limite de tamanho; só ao sair da conta.
 * O service worker (public/sw.js) responde a esses endereços a partir deste cache.
 */
export const DOCS_CACHE = "rumo-docs";
const isFileUrl = (u: string) => /\/storage\/v1\/object\/(sign|public)\//.test(u);

let persistAsked = false;
/** Pede ao navegador para não apagar os dados do app quando faltar espaço. */
async function askPersistence() {
  if (persistAsked) return;
  persistAsked = true;
  try { if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist(); } catch { /* sem suporte */ }
}

/** Baixa para o aparelho os arquivos que ainda não estão lá. Devolve os que estão salvos. */
export async function saveFilesOffline(urls: (string | null | undefined)[]): Promise<Set<string>> {
  const saved = new Set<string>();
  if (typeof caches === "undefined") return saved;
  const list = [...new Set(urls.filter((u): u is string => !!u && isFileUrl(u)))];
  if (!list.length) return saved;
  askPersistence();
  const cache = await caches.open(DOCS_CACHE);
  await Promise.all(list.map(async (u) => {
    try {
      if (await cache.match(u)) { saved.add(u); return; }
      if (!navigator.onLine) return;
      const r = await fetch(u, { mode: "cors", credentials: "omit" });
      if (r.ok) { await cache.put(u, r); saved.add(u); }
    } catch { /* tenta de novo na próxima abertura */ }
  }));
  return saved;
}

/** Mantém os arquivos da lista salvos no aparelho e diz quais já estão. */
export function useOfflineFiles(urls: (string | null | undefined)[]) {
  const key = [...new Set(urls.filter(Boolean))].sort().join("|");
  const [saved, setSaved] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!key) return;
    let alive = true;
    const run = () => saveFilesOffline(key.split("|")).then((s) => { if (alive) setSaved(s); });
    run();
    window.addEventListener("online", run);
    return () => { alive = false; window.removeEventListener("online", run); };
  }, [key]);
  return saved;
}

/** Endereço local (blob) do arquivo: vem do aparelho se estiver salvo, senão da internet. */
export async function localFileUrl(url: string): Promise<{ src: string; type: string }> {
  let res: Response | undefined;
  if (typeof caches !== "undefined") res = (await (await caches.open(DOCS_CACHE)).match(url)) ?? (await caches.match(url));
  if (!res) {
    res = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!res.ok) throw new Error("download");
    if (typeof caches !== "undefined" && isFileUrl(url)) {
      const copy = res.clone();
      caches.open(DOCS_CACHE).then((c) => c.put(url, copy)).catch(() => undefined);
    }
  }
  const blob = await res.blob();
  return { src: URL.createObjectURL(blob), type: blob.type };
}
