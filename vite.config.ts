import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

// Build: TanStack Start (SSR) + Nitro. Nitro detects the host on deploy (Vercel, Netlify,
// Cloudflare…); locally `npm run build && npm run preview` runs a Node server.
export default defineConfig({
  server: { port: 3000 },
  resolve: {
    dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-query"],
  },
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    // src/server.ts wraps the SSR handler with a friendly error page.
    tanstackStart({ server: { entry: "server" } }),
    nitro(),
    viteReact(),
  ],
});
