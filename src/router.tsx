import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { restoreQueryCache } from "./lib/query-persist";

export const getRouter = () => {
  // One client per request: a module-level QueryClient leaks cached data between SSR requests.
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Dados de até 1 min não são buscados de novo a cada troca de tela; o cache vive 1 dia.
        staleTime: 60_000,
        gcTime: 24 * 3600_000,
      },
    },
  });
  // No aparelho: começa com o cache salvo da última vez (telas aparecem na hora).
  if (typeof window !== "undefined") restoreQueryCache(queryClient);

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Troca de tela suave (View Transitions API); navegadores sem suporte trocam direto.
    defaultViewTransition: true,
    // Lets Query own freshness; set caching defaults on the QueryClient, not the router.
    defaultPreloadStaleTime: 0,
    // Ao tocar/passar o mouse num link, já carrega o código e os dados da próxima tela.
    defaultPreload: "intent",
    defaultPreloadDelay: 30,
  });

  return router;
};
