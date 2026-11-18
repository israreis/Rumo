# Rumo Trip — regras do projeto

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
- Passaporte real do usuário: só os 4 últimos dígitos (`profiles.passport_last4`, nunca o número completo) e a validade (`passport_expiry`); situação (vencido, vencendo em < 6 meses, curto para a próxima viagem) em `src/lib/passport.ts`; exibidos mascarados com `maskPassport`.
- Gastos lançados sem internet vão para a fila local `src/lib/offline-queue.ts` e sincronizam ao voltar a conexão.

## Identidade visual
- Guia completo: `docs/identidade-visual.md` (mantenha em sincronia com `src/styles.css`).
- Tokens em `src/styles.css` seguem o design system "Rumo Trip — Identidade visual": linho/papel/areia, tinta, couro (primária), oliva, latão, caramelo, mar, marinho. Fontes: Fraunces (títulos), DM Sans (UI), Caveat (manuscrito, com moderação), IBM Plex Mono (códigos e valores).
- Latão e caramelo no tema claro só em ícones, linhas e texto ≥24px (contraste 3:1).
- Nome do app: **Rumo Trip** (R e T maiúsculos); use `<Wordmark />`.
- Logo: `src/components/Logo.tsx`. `LogoMark` é animado por padrão em todo o app (cabeçalho, login, carregamentos via `<Splash />`); só o PDF usa `animated={false}`. `PassportMark` em Passaporte, Documentos e convites.
- Carimbos: `src/components/Stamp.tsx` + regras puras em `src/lib/stamps.ts` (um por país por viagem, como na imigração: nome do país, cidade de entrada e data da primeira chegada; formato alterna redondo/retangular em ordem cronológica; tinta com falhas e respingos gerados por semente; só países, sem carimbo de viagem concluída; "Para carimbar" sem repetidos); coleção em `/passaporte`, exibida como livreto (`src/components/PassportBook.tsx`, sempre no tema claro via `.paper-light`, mesmo no modo escuro: página de identificação + páginas de vistos com 4 carimbos, folha que gira em 3D; fundo de cada página com gravuras de fauna e paisagens brasileiras em domínio público (`public/passport-art/`, créditos em `CREDITOS.md`; arara-azul, harpia, onça e arara-canindé primeiro), sobre hachuras laranja, e número da página perfurado, em `src/components/PassportArt.tsx`). Derivados das viagens; viagem encerrada carimba todos os seus países. Carimbos de viagens anteriores ao app são cadastrados à mão em `manual_stamps` (só o dono lê/altera) via `ManualStampsDialog` e entram na coleção por `manualStamp`.
- Fundo das telas do app: `PageBackdrop` (hachuras de papel-moeda bem suaves + rosa dos ventos apagada no canto), no layout logado, no link público e no convite; nunca dentro dos cartões.
- Mostrador (`src/components/Dial.tsx`) para progresso circular; botão secundário é a variante `oliva`.

