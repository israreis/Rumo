# Rumo Trip — Identidade visual

**Seu diário de bordo para planejar, viver e lembrar cada viagem.**

Este documento é a referência da marca Rumo Trip. Os valores daqui são os mesmos de `src/styles.css`, que é a fonte usada pelo app. Se um valor mudar, mude nos dois lugares.

> O nome do app é escrito **Rumo Trip**, com R e T maiúsculos.

---

## 1. Conceito

A identidade vem de uma mesa de viajante fotografada de cima: câmera analógica em capa de couro, mapa antigo, passaporte, caderno de linho com anotações à mão, ferragens de latão e luz natural.

O símbolo junta duas ideias:

- **Fotografia:** uma lente de câmera, com corpo em marrom-metal (`#3d3026`) e anel serrilhado, aro externo e anel de foco em latão, íris de diafragma e reflexo no vidro. O aro externo de latão garante que a borda apareça também sobre fundos escuros; o símbolo é o mesmo nos temas claro e escuro.
- **Viagem:** dentro da lente há uma bússola, com mostrador graduado e ponteiro norte em couro.

A frase que guia tudo é **"enquadrar o caminho"**. O app deve parecer um objeto de viagem bem cuidado, e não um painel corporativo.

---

## 2. Logo

Os arquivos estão em [`public/brand/`](../public/brand), e no código o logo é o componente [`src/components/Logo.tsx`](../src/components/Logo.tsx) (`LogoMark`, `Wordmark`, `Logo`, `PassportMark` e `Splash`).

**No app, o símbolo é sempre o animado:** cabeçalho, login, página inicial, telas de carregamento, 404, favicon e página offline. Só o PDF impresso usa a versão estática (`<LogoMark animated={false} />`).

| Versão | Arquivo | Uso |
| --- | --- | --- |
| Lente + bússola (principal) | `rumo-simbolo-lente.svg` | Cabeçalho, login e materiais em geral |
| Lente + bússola animada | `rumo-simbolo-lente-animado.svg` · `<LogoMark animated />` | Splash, carregamento e estados de espera. O ponteiro oscila e assenta no norte num ciclo de 5 s. |
| Passaporte | `rumo-simbolo-passaporte.svg` · `<PassportMark />` | Versão afetiva: tela Meu passaporte, área de Documentos, convites, e-mails e redes |
| Monocromática escura | `rumo-simbolo-lente-mono.svg` | Carimbos, marca d'água em PDF, favicon pequeno, impressão em uma cor |
| Monocromática clara | `rumo-simbolo-lente-mono-claro.svg` | A mesma, sobre fundos escuros ou couro |
| Ícone do app | `rumo-icone-app.svg` · `public/icons/*.png` | PWA, ícone na tela inicial, favicon de 48 px ou mais |

**Wordmark:** "Rumo Trip", com R maiúsculo, em Fraunces 600 (`<Wordmark />`), cor `tinta` (ou `linho` sobre fundo escuro), tracking −0,02em. Na assinatura horizontal, o símbolo vem à esquerda, com altura de cerca de 1,3× a das minúsculas.

**Animação:** só o ponteiro se move. Ele gira em torno do centro do viewBox (100,100) pelos ângulos 0 → 34° → −22° → 14° → −7° → 3° → 0 e fica parado no último terço do ciclo, com a curva `cubic-bezier(.4,0,.2,1)`. Com `prefers-reduced-motion`, a animação é desligada. No CSS, use a classe `.agulha`.

**Regras de uso:**

- Deixe uma área de respiro de ¼ do diâmetro do símbolo em todos os lados.
- O tamanho mínimo da versão colorida é 24 px. Abaixo disso, use a monocromática, que lê bem até 16 px.
- Não gire o símbolo, não troque as cores dos anéis e não aplique sombra nem contorno.
- Sobre fotos, coloque o símbolo numa área lisa de `linho` ou `tinta`.

---

## 3. Cores

A paleta vem das referências: o couro da capa da câmera, o linho do caderno, o latão das ferragens, o oliva da mochila, o azul do passaporte e o verde-água dos mapas.

### Tokens

| Token | Claro | Escuro | Uso |
| --- | --- | --- | --- |
| `linho` | `#f3eee4` | `#1c1814` | Fundo da página |
| `papel` | `#fbf8f2` | `#26211b` | Cartões, painéis, modais e campos |
| `areia` | `#e6dccb` | `#332c24` | Superfícies rebaixadas, chips neutros e trilhas de progresso |
| `borda` | `#d8cdb9` | `#3d352c` | Bordas e divisórias de 1 px |
| `tinta` | `#2a211a` | `#f1eadf` | Texto principal e títulos |
| `tinta-suave` | `#6b5d4f` | `#b8ac9c` | Texto secundário, legendas e placeholders |
| `couro` | `#8a4f2a` | `#d39468` | **Cor da marca:** botão primário, links, item ativo e ponteiro norte |
| `couro-hover` | `#6e3d1f` | `#e3ab83` | Hover e estado pressionado do couro; capa do passaporte |
| `sobre-couro` | `#fbf8f2` | `#1c1814` | Texto sobre couro e oliva |
| `oliva` | `#5f6446` | `#aeb28c` | Secundária: botões secundários, categorias e gráficos |
| `salvia` | `#d9dbc6` | `#3a3d2c` | Fundo suave de oliva: chips selecionados e dia atual |
| `latao` | `#a88449` | `#c9a66b` | Detalhes metálicos: anéis, ícones, carimbos e rota tracejada |
| `caramelo` | `#b9783f` | `#d69a62` | Acento quente: marcadores e destaques de gráfico |
| `mar` | `#3f6d66` | `#8fbab2` | Mapas, transporte e informação neutra |
| `marinho` | `#23324a` | `#9fb2cc` | Azul de passaporte: documentos e voos |
| `sucesso` | `#4a6b35` | `#9cc483` | Pago, confirmado, dentro do orçamento |
| `alerta` | `#94600f` | `#e0b25a` | Pendente, prazo chegando, perto do limite |
| `erro` | `#9e3426` | `#e88b7c` | Erro, orçamento estourado, conflito de horário, documento vencendo |

No Tailwind, as cores ficam disponíveis como `bg-couro`, `text-oliva`, `border-latao` etc. As variáveis do shadcn apontam para elas: `primary` = couro, `background` = linho, `card` = papel, `muted-foreground` = tinta-suave, `accent` = sálvia, `destructive` = erro.

### Proporção (60 / 30 / 10)

- **60%** neutro: `linho`, com `papel` nos cartões.
- **30%** estrutura e texto: `tinta`, `tinta-suave`, `areia` e `borda`.
- **10%** cor: `couro` para ação e marca; `oliva`, `latao`, `mar` e `marinho` como apoio. O `caramelo` aparece só em detalhes pequenos.

### Gráficos e categorias

A ordem das séries é `couro` → `oliva` → `mar` → `latao` → `marinho` → `caramelo` → `tinta-suave` (tokens `--chart-1` a `--chart-5`, mais os dois últimos).

### Acessibilidade

- Todo texto atinge pelo menos **4,5:1** nos dois temas.
- `latao` e `caramelo` no tema claro ficam em cerca de **3:1**. Use-os só em ícones, linhas, carimbos e texto de 24 px ou mais, nunca em texto corrido.
- Status nunca é indicado só pela cor: venha sempre acompanhado de ícone e texto.

### Tema escuro

É a mesa de madeira à noite. O couro clareia para manter o contraste, e o texto sobre botões de couro passa a ser escuro (`sobre-couro`).

---

## 4. Tipografia

Todas as fontes são Google Fonts e carregam em `src/routes/__root.tsx`.

| Família | Token / classe | Papel |
| --- | --- | --- |
| **Fraunces** (serifada) | `font-display`, `h1`–`h3` | Títulos, nomes de viagem e wordmark. Tem o calor de impresso antigo, de guia de viagem. |
| **DM Sans** | `font-sans` (padrão) | Interface e texto: limpa e legível no celular. |
| **Caveat** (manuscrita) | `font-hand` | Notas de diário e estados vazios ("Dia 1: chegamos!"). No máximo uma linha por tela. |
| **IBM Plex Mono** | `font-num` | Localizadores, nº de voo e horários, com algarismos tabulares. Lembra bilhete impresso. Valores em dinheiro não usam mono: destaques em Fraunces, o resto em DM Sans com `tabular-nums`. |

### Escala

| Estilo | Tamanho / entrelinha | Peso | Exemplo |
| --- | --- | --- | --- |
| display-xl | 56 / 60 | 500 | Lisboa e Porto |
| display-lg | 40 / 46 | 500 | Seu próximo rumo |
| título | 28 / 34 | 500 | Dia 3 · Sintra |
| subtítulo | 20 / 28 | 600 | Hospedagem |
| corpo | 16 / 24 | 400 | Check-in a partir das 15h |
| corpo-sm | 14 / 20 | 400 | Cancelamento grátis até 12/12 |
| rótulo | 14 / 20 | 600 | Salvar viagem |
| legenda | 12 / 16, caixa-alta, +0,08em | 600 | EMBARQUE |
| manuscrito | 24 / 28 (Caveat) | 500 | Dia 1: chegamos! |
| código | 14 / 20 (mono), +0,04em | 500 | LOC X7K2PQ · TP 1024 |
| valor | 24 / 30 (Fraunces) | 600 | € 1.284,50 |

No celular, os campos de formulário ficam em 16 px para o iOS não dar zoom.

---

## 5. Espaço, forma e sombra

- **Grade de 4 px:** 4, 8, 12, 16, 24, 32, 48 e 64. O padding dos cartões é 16 px no celular e 24 px no desktop.
- **Raios:** 4 px (tags e códigos), 8 px (botões e campos), 14 px (cartões, modais e tickets), 22 px (capas e heróis) e 999 px (chips, avatares e o botão flutuante).
- **Sombras:** `shadow-card` é baixa e quente, como papel apoiado na mesa. `shadow-lift` fica só para o botão "+ Gasto", menus e modais.

---

## 6. Elementos gráficos

- **Ticket:** cartão de transporte com picote, ou seja, uma linha tracejada e dois recortes semicirculares. O corpo traz origem e destino em Fraunces e horários em mono. O canhoto traz o localizador, o status e o valor. Veja `src/components/plan/TransportTab.tsx`.
- **Carimbo** (`src/components/Stamp.tsx`): selo de uma cor só (`couro`, `marinho` ou `oliva`), em dois formatos fixos por país: circular com texto em arco ou retangular com contorno duplo (`erro` e `alerta` só para o aviso de validade do passaporte). Fica girado entre −8° e 8°. Os carimbos ainda não ganhos aparecem tracejados e esmaecidos, e os novos entram com a animação `animate-carimbo`.
- **Passaporte de carimbos** (`/passaporte`, regras em `src/lib/stamps.ts`): os passaportes quase não são mais carimbados, então o Rumo Trip guarda esse ritual como a imigração de aeroporto. Cada país de uma viagem vira um carimbo com a cidade de entrada e a data da primeira chegada; só países, como num passaporte de verdade. O carimbo aparece:
  - no cabeçalho do dia de entrada no país, no Roteiro;
  - na seção "Carimbos da viagem" do PDF;
  - no livreto da tela Meu passaporte (página de identificação com os dados do passaporte real e páginas de vistos que viram em 3D).
- **Rota tracejada:** linha `latao` de 1,5 px (traço 4, espaço 4) ligando pontos do roteiro e trechos de transporte.
- **Mostrador** (`src/components/Dial.tsx`): o anel graduado da bússola usado como indicador circular de progresso. Os traços preenchidos ficam em couro, ou em erro quando o orçamento passa de 100%. Aparece no orçamento usado (Visão geral) e no progresso da checklist.
- **Textura de papel** (`bg-papel-textura`): ruído de 2–3% sobre o `linho` do fundo da página, nunca sobre cartões.
- **Fundo de papel-moeda** (`PageBackdrop`): hachuras finas em diagonal (caramelo a 9%) com duas faixas largas de latão, mais uma rosa dos ventos grande e apagada (6%) no canto inferior direito. Fixo atrás de todas as telas do app, nunca dentro dos cartões; mais fraco no tema escuro e fora da impressão.

## 7. Iconografia

Os ícones são do **Lucide** (já vem com o shadcn/ui), com traço de 1,5 px (aplicado globalmente em `svg.lucide`, em `src/styles.css`) e cantos arredondados, em 16, 20 ou 24 px. A cor padrão é `tinta-suave`; ativo usa `couro`, e decorativo grande usa `latao`.

| Módulo | Ícone |
| --- | --- |
| Visão geral | `Compass` / `LayoutDashboard` |
| Roteiro | `Route` / `Map` |
| Transporte | `Plane`, `TrainFront`, `Bus` |
| Hospedagem | `BedDouble` |
| Atividades | `Ticket` |
| Orçamento | `PiggyBank` / `Wallet` |
| Gastos | `Receipt` |
| Documentos | `FileText` / `BookUser` |
| Checklist | `CheckSquare` / `ListChecks` |
| Notas | `StickyNote` / `NotebookPen` |

## 8. Fotografia

Use flat lays e lugares com luz natural, tons quentes e dessaturados e grão leve, sem filtros saturados. Nas capas de viagem, aplique um véu de `tinta` a cerca de 80% na base (`bg-cover-fade`) para o título em `linho` ficar legível. Fotos de pessoas só se forem do próprio usuário.

## 9. Voz e tom

O app fala em português do Brasil, tratando o usuário por "você". O tom é de um companheiro de viagem organizado: claro, caloroso e sem exagero.

- **Botões:** curtos e no infinitivo, como "Salvar viagem" e "Adicionar gasto". As variantes são primário (`default`, couro), secundário (`oliva`), contorno (`outline`), fantasma (`ghost`) e o flutuante "+ Gasto".
- **Estados vazios:** convidam, sem dar ordens. Exemplo: *"Nenhum voo por aqui ainda. Que tal começar pela ida?"*
- **Alertas:** são diretos e dizem o que fazer. Exemplo: *"Seu passaporte vence em 4 meses. Renove antes de 10/03."*
- **Valores:** sempre com a moeda. Quando estrangeira, com o equivalente em BRL ao lado: `€ 120,00 · R$ 742,80`.

## 10. App instalado (PWA)

O manifest fica em [`public/manifest.webmanifest`](../public/manifest.webmanifest). Ele usa `theme_color` e `background_color` `#f3eee4` (linho), e a barra de status acompanha o tema escuro (`#1c1814`). Os ícones (192 px, 512 px, maskable e Apple touch) ficam em `public/icons/`, sempre com o símbolo sobre fundo couro.

---

### Referência visual interativa

A versão navegável deste guia, com tokens nos dois temas, prévias dos componentes (logo animado, botões, ticket e carimbos) e os logos para baixar, está em <https://israreis.github.io/Rumo/> (arquivo [`index.html`](index.html), nesta mesma pasta).
