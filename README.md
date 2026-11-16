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

**No ar:** <https://rumo-ashy.vercel.app>, com deploy automático pela Vercel a cada push na `main`.

**Stack:** TanStack Start (React 19, SSR), Tailwind CSS v4, shadcn/ui e Supabase (Postgres, Auth e Storage).

**Identidade visual:** veja [`docs/identidade-visual.md`](docs/identidade-visual.md).

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
   Use só o endereço do projeto. O painel também mostra a "URL da API REST" (`…/rest/v1/`); o app tolera esse sufixo, mas o certo é não usá-lo.
4. Em **Authentication → URL Configuration**:
   - **Site URL:** o endereço publicado (`https://rumo-ashy.vercel.app`). É para onde o Supabase manda depois do login com Google e nos e-mails de confirmação e de recuperação de senha. Se ficar `localhost`, o login pelo celular termina em "não é possível acessar esse site".
   - **Redirect URLs:** `https://rumo-ashy.vercel.app/**` e `http://localhost:3000/**`. Endereços fora dessa lista são ignorados, e o Supabase usa a Site URL no lugar.

### Login com Google (opcional)

1. No [Google Cloud Console](https://console.cloud.google.com), abra a **Google Auth Platform**:
   - **Branding:** nome do app ("Rumo") e e-mail de suporte.
   - **Público-alvo:** *Externo*. Enquanto o app estiver no modo **Testando**, só os e-mails listados em **Usuários de teste** conseguem entrar (até 100). Adicione o seu e o de quem você for convidar para as viagens.
   - **Clientes → Criar cliente → Aplicativo da Web**:
     - *Origens JavaScript autorizadas:* `http://localhost:3000` e `https://rumo-ashy.vercel.app`.
     - *URIs de redirecionamento autorizados:* a callback que o Supabase mostra em **Authentication → Sign In / Providers → Google**, algo como `https://xxxx.supabase.co/auth/v1/callback`.
2. Guarde o *Client ID* e o *Client Secret*. O Google só mostra o segredo na criação; se perder, gere outro em **Clientes → Adicionar chave secreta**.
3. No Supabase, em **Authentication → Sign In / Providers → Google**, ative o provedor, cole o Client ID e o Client Secret e salve. Deixe *Skip nonce checks* e *Allow users without an email* desligados.

Sem isso, o login por e-mail e senha continua funcionando normalmente.

| Sintoma | Causa |
| --- | --- |
| `redirect_uri_mismatch` no Google | A URI de redirecionamento no Google não é idêntica à callback do Supabase. |
| "Acesso bloqueado" ou "app não verificado" | O e-mail não está em **Usuários de teste**. |
| Depois do Google, cai em `localhost` ou em página que não abre | O domínio não está em **Redirect URLs**, ou a **Site URL** ainda é `localhost`. |
| `{"message":"No API key found in request"}` | `VITE_SUPABASE_URL` com `/rest/v1/` no final, em versões antigas do app. |

## 3. Publicar (deixar online)

O app está publicado na **Vercel** em <https://rumo-ashy.vercel.app>. Cada push na `main` gera um deploy novo sozinho.

Para recriar o projeto do zero:

1. Em [vercel.com](https://vercel.com), clique em **Add New → Project**, conecte o GitHub e importe `israreis/Rumo`.
2. Deixe o preset **TanStack Start** e os campos de build sem alteração. O Nitro gera o formato que a Vercel espera, e a pasta de saída indicada ali é ignorada.
3. Em *Environment Variables*, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` para **Production and Preview**. Não precisa da integração "Supabase" da Vercel: ela criaria outro banco.
4. Faça o deploy e cadastre o domínio gerado no Supabase (**Site URL** e **Redirect URLs**) e no Google (**Origens JavaScript autorizadas**).

As variáveis `VITE_*` entram no código no momento do build. Se mudar alguma na Vercel, faça um **Redeploy**.

Netlify e Cloudflare também funcionam. Em um servidor próprio, basta `npm run build` seguido de `node .output/server/index.mjs`.

## 4. Instalar no celular

Abra o endereço publicado:

- **iPhone (Safari):** Compartilhar → *Adicionar à Tela de Início*.
- **Android (Chrome):** menu ⋮ → *Instalar app*, ou aceite o convite que aparece na tela.

O Rumo passa a abrir em tela cheia, com ícone próprio. Uma viagem aberta com internet fica disponível depois sem conexão. Gastos lançados offline aparecem como "pendentes" e são enviados quando a internet volta.

O app guarda arquivos no aparelho para funcionar offline. Se, depois de um deploy, a tela parecer de uma versão antiga, recarregue com **Ctrl+Shift+R** no computador, ou feche e reabra o app no celular.

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
docs/
  identidade-visual.md   guia da marca
public/
  sw.js              service worker (offline)
  manifest.webmanifest, icons/, brand/   PWA e identidade visual
```

As regras de negócio e as convenções do projeto estão em [`AGENTS.md`](AGENTS.md).

### Identidade visual

O guia completo está em [`docs/identidade-visual.md`](docs/identidade-visual.md): conceito, logo e regras de uso, paleta clara e escura com contraste, tipografia, espaçamento, elementos gráficos, ícones, fotografia e voz. Os tokens ficam em `src/styles.css`, e os arquivos de logo em `public/brand/`.

### Moedas

São 30 moedas comuns em viagem (BRL, USD, EUR, GBP, ISK, CHF, CAD, JPY…), definidas em `src/lib/trip-utils.ts`. A cotação vem do Frankfurter (dados do BCE) e fica congelada no lançamento. ARS, CLP, COP, PEN e UYU não são cotadas pelo BCE, então a cotação delas é informada à mão.
