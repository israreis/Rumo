# Rumo

Seu diário de bordo para planejar, viver e lembrar cada viagem. É um app web instalável (PWA) para uso pessoal, com:

- roteiro dia a dia, com mapa e fuso de cada cidade
- passagens, hospedagem, atividades e ingressos
- orçamento em várias moedas, com IOF e spread do cartão
- gastos da viagem, com divisão de contas entre os viajantes
- documentos, checklist e notas
- compartilhamento com companheiros de viagem e link público só leitura do roteiro
- exportação em PDF, CSV (Excel) e calendário (.ics)
- uso offline, inclusive para lançar gastos sem internet

**Stack:** TanStack Start (React 19, SSR), Tailwind CSS v4, shadcn/ui e Supabase (Postgres, Auth e Storage).

---

## 1. Rodar no seu computador

Você precisa do **Node.js 22 ou mais recente** ([nodejs.org](https://nodejs.org)).

```bash
npm install
cp .env.example .env      # no Windows: copy .env.example .env
# edite o .env com os dados do seu projeto Supabase (passo 2)
npm run dev
```

Depois abra <http://localhost:3000>.

| Comando | Para quê |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` e `npm run preview` | build de produção local (o modo offline/PWA só funciona aqui) |
| `npm test` | testes unitários (Vitest) |
| `npm run typecheck` | checagem de tipos |
| `npm run db:setup-sql` | regera `supabase/setup.sql` a partir das migrações |

## 2. Criar o banco no Supabase (uma vez)

1. Crie uma conta gratuita em [supabase.com](https://supabase.com) e um **novo projeto** (região sugerida: São Paulo).
2. Abra **SQL Editor → New query**, cole todo o conteúdo de [`supabase/setup.sql`](supabase/setup.sql) e clique em **Run**. Isso cria as tabelas, as regras de segurança (RLS), o bucket de arquivos e a viagem de exemplo que todo usuário novo recebe.
3. Em **Project Settings → API**, copie a **Project URL** e a **Publishable key** (ou a `anon` key) para o seu `.env`:
   ```
   VITE_SUPABASE_URL="https://xxxx.supabase.co"
   VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
   ```
4. Em **Authentication → URL Configuration**:
   - **Site URL:** `http://localhost:3000` enquanto desenvolve. Depois troque pelo endereço publicado.
   - **Redirect URLs:** adicione `http://localhost:3000/**` e, quando publicar, `https://seu-dominio/**`.

### Login com Google (opcional)

1. No [Google Cloud Console](https://console.cloud.google.com/apis/credentials), crie um **ID do cliente OAuth** do tipo *Aplicativo da Web*.
2. Em *URIs de redirecionamento autorizados*, cole a callback que o Supabase mostra em **Authentication → Providers → Google** (algo como `https://xxxx.supabase.co/auth/v1/callback`).
3. Volte ao Supabase, ative o provedor **Google** e cole o *Client ID* e o *Client Secret*.

Sem isso, o login por e-mail e senha continua funcionando normalmente.

## 3. Publicar (deixar online)

O build usa o **Nitro**, que detecta a hospedagem sozinho. O caminho mais simples é a **Vercel**:

1. Em [vercel.com](https://vercel.com), importe o repositório do GitHub.
2. Em *Environment Variables*, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. Faça o deploy e adicione o domínio gerado no Supabase, em **Site URL** e **Redirect URLs**.

Netlify e Cloudflare também funcionam. Em um servidor próprio, basta `npm run build` seguido de `node .output/server/index.mjs`.

## 4. Instalar no celular

Abra o endereço publicado:

- **iPhone (Safari):** Compartilhar → *Adicionar à Tela de Início*.
- **Android (Chrome):** menu ⋮ → *Instalar app*, ou aceite o convite que aparece na tela.

O Rumo passa a abrir em tela cheia, com ícone próprio. Uma viagem aberta com internet fica disponível depois sem conexão. Gastos lançados offline aparecem como "pendentes" e são enviados quando a internet volta.

---

## Estrutura

```
src/
  routes/            páginas (roteamento por arquivo do TanStack Router)
    _authenticated/  área logada: viagens, viagem, edição, impressão/PDF, perfil
    convite.$token   aceitar convite de viagem
    r.$token         roteiro público somente leitura
  components/
    plan/            abas da viagem (roteiro, transporte, orçamento, gastos…)
    trips/           cartões, formulário, compartilhar, exportar
    Logo.tsx         símbolo lente + bússola (estático e animado)
  lib/               regras puras (orçamento, câmbio, fusos, agenda, exportações, fila offline)
  integrations/supabase/  cliente e tipos do banco
supabase/
  migrations/        schema versionado (fonte da verdade)
  setup.sql          todas as migrações juntas, para colar no SQL Editor
public/
  sw.js              service worker (offline)
  manifest.webmanifest, icons/, brand/   PWA e identidade visual
```

As regras de negócio e as convenções do projeto estão em [`AGENTS.md`](AGENTS.md).

### Identidade visual

O app usa a paleta linho, couro, oliva, latão, mar e marinho, com as fontes Fraunces, DM Sans, Caveat e IBM Plex Mono. Os tokens ficam em `src/styles.css`, e os arquivos de logo em `public/brand/`.
