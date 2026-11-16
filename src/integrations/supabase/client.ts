import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Browser Supabase client. URL and publishable (anon) key come from `.env`
 * (see `.env.example`); both are public by design — data is protected by RLS.
 */
function createSupabaseClient() {
  // Accept the project URL with or without the "/rest/v1/" suffix the dashboard also shows.
  const url = (import.meta.env["VITE_SUPABASE_URL"] as string | undefined)?.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
  const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined;

  if (!url || !key) {
    const missing = [!url && "VITE_SUPABASE_URL", !key && "VITE_SUPABASE_PUBLISHABLE_KEY"].filter(Boolean);
    const message = `Variáveis do Supabase ausentes: ${missing.join(", ")}. Copie .env.example para .env e preencha.`;
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }

  return createClient<Database>(url, key, {
    auth: {
      storage: typeof window === "undefined" ? undefined : window.localStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

// Lazily created so SSR of public pages never touches browser storage.
// Import: import { supabase } from "@/integrations/supabase/client";
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
