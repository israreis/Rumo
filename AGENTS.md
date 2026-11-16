# Rumo — regras do projeto

App pessoal de planejamento de viagens (PWA). TanStack Start + React 19 + Tailwind v4 + shadcn/ui, dados no Supabase (Postgres + Auth + Storage) acessados direto do navegador sob RLS.

## Banco de dados
- O schema vive em `supabase/migrations/` (ordem pelo prefixo de data). Toda mudança de schema é uma **nova** migração; nunca edite uma já aplicada. `supabase/setup.sql` é a concatenação de todas, para colar no SQL Editor — regenere com `npm run db:setup-sql`.
- Depois de mudar o schema, atualize `src/integrations/supabase/types.ts` (`npx supabase gen types typescript --project-id <id>` ou à mão).

## Regras de domínio
- Acesso à viagem é decidido por `trip_members` (owner/editor/viewer) via helpers security-definer `can_view_trip`/`can_edit_trip`/`is_trip_owner`; tabelas filhas checam esses helpers, nunca `owner_id` direto — compartilhar é só uma mudança de dados.
- Convites: `trip_invites` (só o dono vê/gerencia). `accept_trip_invite(token)` exige que o e-mail logado seja o convidado; `accept_pending_invites()` roda ao abrir o app. Membros de outros usuários são lidos por `get_trip_members`.
- Link público: `trips.public_token`; `get_public_trip(token)` (liberado para `anon`) devolve só roteiro, sem valores, códigos, documentos ou notas.
- O papel do usuário na viagem chega à UI por `TripAccessProvider` (`src/components/plan/access.tsx`); `EditDialog` vira somente leitura para `viewer`.
- Dados de viagem são lidos/gravados no browser (`src/lib/trips-api.ts`, `src/lib/plan-api.ts`); páginas logadas ficam em `src/routes/_authenticated/` (ssr: false).
- Imagens vão para o bucket privado `media` em `{userId}/...` e são guardadas como signed URLs de longa duração.
- Novos usuários ganham a viagem de exemplo (Lisboa e Porto) pelo trigger `handle_new_user`, não pelo app.
- Status da viagem é derivado das datas em `computeStatus`, a menos que `status_override` esteja definido.
- Instantes de transporte são UTC + fuso IANA de cada ponta; a UI converte com `src/lib/tz.ts`.
- O roteiro é derivado no cliente (`src/lib/itinerary.ts` e `src/lib/agenda.ts`): transportes/check-ins são itens automáticos só leitura; só atividades e `itinerary_events` são arrastáveis e persistem `position` + data.
- Lugares são geocodificados ao salvar via OpenStreetMap Nominatim; o mapa Leaflet é lazy.
- Todo valor guarda moeda original, `fx_rate` (Frankfurter, buscada uma vez e congelada) e `converted_amount` na moeda da viagem via `withFx`; taxas do cartão (IOF+spread) congeladas em `expenses.fees_pct`.
- Linhas de orçamento vêm de `useBudget`; regras puras de dinheiro em `src/lib/budget.ts`. Alertas e regras de documentos/checklist em `src/lib/trip-extras.ts`.
- Gastos lançados sem internet vão para a fila local `src/lib/offline-queue.ts` e sincronizam ao voltar a conexão.

## Identidade visual
- Tokens em `src/styles.css` seguem o design system "Rumo — Identidade visual": linho/papel/areia, tinta, couro (primária), oliva, latão, caramelo, mar, marinho. Fontes: Fraunces (títulos), DM Sans (UI), Caveat (manuscrito, com moderação), IBM Plex Mono (códigos e valores).
- Latão e caramelo no tema claro só em ícones, linhas e texto ≥24px (contraste 3:1).
- Logo: `src/components/Logo.tsx` (`LogoMark` com `animated` para splash/carregamento).

## Commits
- Commits saem em nome do autor do repositório, sem co-autoria ou atribuição a ferramentas.
