import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { PageBackdrop } from "@/components/PageBackdrop";

export const CONTATO = "israreis.dev@gmail.com";
export const ATUALIZADO = "20 de novembro de 2026";

/** Página pública de texto (Política de Privacidade, Termos de Uso), sem login. */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <PageBackdrop />
      <header className="mx-auto flex max-w-3xl items-center px-5 py-6"><Logo /></header>
      <main className="mx-auto max-w-3xl px-5 pb-20">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Última atualização: {ATUALIZADO}</p>
        <article className="mt-8 space-y-4 leading-relaxed text-foreground/90 [&_a]:font-medium [&_a]:text-primary [&_a]:underline-offset-2 hover:[&_a]:underline [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:my-1 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          {children}
        </article>
        <nav className="mt-12 flex flex-wrap gap-x-6 gap-y-2 border-t pt-6 text-sm text-muted-foreground">
          <Link to="/auth" className="hover:text-primary">Entrar</Link>
          <Link to="/privacidade" className="hover:text-primary">Política de Privacidade</Link>
          <Link to="/termos" className="hover:text-primary">Termos de Uso</Link>
          <a href={`mailto:${CONTATO}`} className="hover:text-primary">{CONTATO}</a>
        </nav>
      </main>
    </div>
  );
}
