// Concatenates supabase/migrations/*.sql into supabase/setup.sql, ready to paste in the
// Supabase SQL Editor of a brand-new project. Run: npm run db:setup-sql
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = "supabase/migrations";
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
const parts = files.map((f) => `-- ============================================================\n-- ${f}\n-- ============================================================\n${readFileSync(join(dir, f), "utf8").trim()}\n`);
const header = `-- Rumo Trip — schema completo do banco (gerado por scripts/build-setup-sql.mjs; não edite à mão).\n-- Cole tudo no SQL Editor de um projeto Supabase NOVO e clique em Run.\n\n`;
writeFileSync("supabase/setup.sql", header + parts.join("\n"));
console.log(`supabase/setup.sql ← ${files.length} migrações`);
