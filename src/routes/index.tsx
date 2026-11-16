import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rota — seu planejador pessoal de viagens" },
      { name: "description", content: "Organize destinos, datas, orçamento e companheiros de viagem em um só lugar." },
      { property: "og:title", content: "Rota — seu planejador pessoal de viagens" },
      { property: "og:description", content: "Organize destinos, datas, orçamento e companheiros de viagem em um só lugar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Logo />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button asChild variant="ghost"><Link to="/auth">Entrar</Link></Button>
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-6 md:grid-cols-2 md:pt-16">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-accent">Planejamento de viagens</p>
          <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
            Cada viagem começa com um bom plano.
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted-foreground">
            Destinos, datas, orçamento e quem vai com você — tudo organizado, do primeiro rascunho ao último dia.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link to="/trips">Começar a planejar <ArrowRight /></Link></Button>
          </div>
          <ul className="mt-10 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            <li className="flex items-center gap-2"><MapPin className="size-4 text-primary" /> Vários destinos</li>
            <li className="flex items-center gap-2"><CalendarDays className="size-4 text-primary" /> Contagem regressiva</li>
            <li className="flex items-center gap-2"><Users className="size-4 text-primary" /> Viajantes</li>
          </ul>
        </div>
        <div className="relative overflow-hidden rounded-3xl shadow-lift">
          <img src="/images/lisboa.jpg" alt="Bonde amarelo em rua de Lisboa ao pôr do sol" width={1600} height={912} className="aspect-[4/3] w-full object-cover" />
        </div>
      </main>
    </div>
  );
}
