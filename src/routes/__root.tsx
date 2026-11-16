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

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <LogoMark className="mx-auto size-16" />
        <h1 className="mt-6 text-3xl">Esta página não carregou</h1>
        <p className="mt-2 text-sm text-muted-foreground">Algo deu errado. Tente de novo ou volte ao início.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
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
      { title: "Rumo — planeje suas viagens" },
      { name: "description", content: "Roteiro, passagens, hospedagem, orçamento e gastos das suas viagens em um só lugar." },
      { name: "application-name", content: "Rumo" },
      { name: "theme-color", content: "#f3eee4" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Rumo" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "format-detection", content: "telephone=no" },
      { property: "og:site_name", content: "Rumo" },
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
      <body>
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

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}
