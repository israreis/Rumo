export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Algo deu errado — Rumo</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #f3eee4; color: #2a211a; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      h1 { font: 600 1.5rem/1.2 Georgia, serif; margin: 0 0 0.5rem; }
      p { color: #6b5d4f; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.6rem 1.1rem; border-radius: 8px; font: inherit; font-weight: 600; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #8a4f2a; color: #fbf8f2; }
      .secondary { background: transparent; color: #2a211a; border-color: #6b5d4f; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Esta página não carregou</h1>
      <p>Algo deu errado do nosso lado. Tente recarregar ou volte ao início.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Tentar de novo</button>
        <a class="secondary" href="/">Ir para o início</a>
      </div>
    </div>
  </body>
</html>`;
}
