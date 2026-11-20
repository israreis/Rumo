import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { themeInitScript } from "../lib/theme";
import { Toaster } from "@/components/ui/sonner";
import { LogoMark } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { clearPersistedQueryCache, persistQueryCache } from "@/lib/query-persist";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <LogoMark className="mx-auto size-16" />
        <p className="mt-6 font-hand text-3xl text-primary">Saímos da rota…</p>
        <h1 className="mt-1 text-3xl">Página não encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">Esta página não existe ou foi movida.</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-couro-hover"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

const CHUNK_ERROR = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError/i;

/**
 * Recarrega a página para pegar a versão nova do app. Evita laço: no máximo uma vez a cada 30s
 * (antes era uma vez por sessão, e um segundo deploy na mesma sessão mostrava o erro).
 */
function reloadForNewVersion() {
  try {
    const last = Number(sessionStorage.getItem("rumo:chunk-reload") || 0);
    if (Date.now() - last < 30_000) return false;
    sessionStorage.setItem("rumo:chunk-reload", String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

// O Vite avisa quando um pedaço do app pré-carregado não existe mais (deploy novo): recarrega antes de quebrar.
if (typeof window !== "undefined") {
  window.addEventListener("vite:preloadError", (e) => {
    if (reloadForNewVersion()) e.preventDefault();
  });
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);

  // Depois de um deploy novo, uma aba antiga pode pedir um pedaço do app que já não existe:
  // recarrega uma vez sozinha em vez de mostrar o erro.
  useEffect(() => {
    if (!CHUNK_ERROR.test(message)) return;
    reloadForNewVersion();
  }, [message]);
  const isChunk = CHUNK_ERROR.test(message);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <LogoMark className="mx-auto size-16" />
        <h1 className="mt-6 text-3xl">Esta página não carregou</h1>
        <p className="mt-2 text-sm text-muted-foreground">Algo deu errado. Tente de novo ou volte ao início.</p>
        <details className="mx-auto mt-4 max-w-sm text-left text-xs text-muted-foreground">
          <summary className="cursor-pointer text-center">Detalhes técnicos</summary>
          <pre className="mt-2 whitespace-pre-wrap break-words rounded-md border bg-card p-2 font-num">{message}</pre>
        </details>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              // Versão nova publicada: só recarregar a página resolve.
              if (isChunk) { window.location.reload(); return; }
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-couro-hover"
          >
            Tentar de novo
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
}

const FONTS =
  "https://fonts.googleapis.com/css2?family=Caveat:wght@500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Fraunces:opsz,wght@9..144,500;9..144,600&family=IBM+Plex+Mono:wght@400;500&display=swap";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    // Each content route sets its own title/description. Never add og:image here: every page
    // without its own would inherit the root's preview image.
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Rumo Trip — planeje suas viagens" },
      { name: "description", content: "Roteiro, passagens, hospedagem, orçamento e gastos das suas viagens em um só lugar." },
      { name: "application-name", content: "Rumo Trip" },
      { name: "theme-color", content: "#f3eee4" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Rumo Trip" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "format-detection", content: "telephone=no" },
      { property: "og:site_name", content: "Rumo Trip" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: FONTS },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <HeadContent />
      </head>
      <body className="bg-papel-textura">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

/** Installs the service worker in production builds (offline + installable app). */
function useServiceWorker() {
  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
    const register = () => navigator.serviceWorker.register("/sw.js").catch((e) => console.warn("SW", e));
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  useServiceWorker();

  // App carregou bem: libera a recarga automática para um próximo erro de deploy.
  useEffect(() => {
    const t = setTimeout(() => {
      try { sessionStorage.removeItem("rumo:chunk-reload"); } catch { /* sem storage */ }
    }, 10_000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const stop = persistQueryCache(queryClient);
    // O Supabase repete SIGNED_IN ao voltar para o app; só recarrega tudo se a conta mudou.
    let current: string | null | undefined;
    supabase.auth.getSession().then(({ data }) => { current ??= data.session?.user.id ?? null; });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      const id = session?.user.id ?? null;
      if (event === "SIGNED_OUT") {
        current = null;
        clearPersistedQueryCache();
        router.invalidate();
        return;
      }
      if (event === "USER_UPDATED") { router.invalidate(); return; }
      if (event !== "SIGNED_IN" || id === current) return;
      if (current) { queryClient.clear(); clearPersistedQueryCache(); }
      current = id;
      router.invalidate();
      queryClient.invalidateQueries();
    });
    return () => { stop(); data.subscription.unsubscribe(); };
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}
