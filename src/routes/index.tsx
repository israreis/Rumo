import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarRange, Compass, Receipt, Ticket, Users, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo, LogoMark } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rumo — seu diário de bordo para planejar viagens" },
      { name: "description", content: "Roteiro dia a dia, passagens, hospedagem, orçamento multimoeda e gastos da viagem, em um app que funciona até sem internet." },
      { property: "og:title", content: "Rumo — seu diário de bordo para planejar viagens" },
      { property: "og:description", content: "Roteiro, passagens, hospedagem, orçamento e gastos em um só lugar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const FEATURES = [
  { icon: CalendarRange, title: "Roteiro dia a dia", text: "Arraste passeios entre os dias, com mapa e fuso de cada cidade." },
  { icon: Ticket, title: "Passagens e reservas", text: "Voos, trens e hotéis com localizador, anexos e prazos de cancelamento." },
  { icon: Receipt, title: "Orçamento e gastos", text: "Várias moedas, IOF do cartão e divisão de contas entre viajantes." },
  { icon: Users, title: "Planeje junto", text: "Convide quem vai com você e mande o roteiro para a família." },
  { icon: WifiOff, title: "Funciona offline", text: "Instale no celular e consulte tudo no avião ou sem chip." },
  { icon: Compass, title: "Tudo à mão", text: "Documentos, checklist e notas da viagem no mesmo lugar." },
];

function Index() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 pb-4 pt-[max(1.75rem,env(safe-area-inset-top))]">
        <Logo />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button asChild variant="ghost"><Link to="/auth">Entrar</Link></Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-20">
        <section className="grid items-center gap-10 pt-8 md:grid-cols-[1.1fr_1fr] md:pt-16">
          <div>
            <p className="font-hand text-3xl text-primary">Dia 1: chegamos!</p>
            <h1 className="mt-2 text-5xl leading-[1.02] md:text-7xl">Enquadre o caminho antes de partir.</h1>
            <p className="mt-6 max-w-md text-lg text-muted-foreground">
              Rumo é o seu diário de bordo: roteiro, passagens, hospedagem, orçamento e gastos da viagem, do primeiro rascunho ao último dia.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg"><Link to="/trips">Começar a planejar <ArrowRight /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link to="/auth">Já tenho conta</Link></Button>
            </div>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-[22px] shadow-lift">
              <img src="/images/lisboa.jpg" alt="Bonde amarelo em rua de Lisboa ao pôr do sol" width={1600} height={912} className="aspect-[4/3] w-full object-cover" />
              <div className="absolute inset-0 bg-cover-fade" />
              <div className="absolute bottom-4 left-5 text-on-photo">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] opacity-90">Lisboa e Porto</p>
                <p className="font-display text-2xl">10 dias · 2 viajantes</p>
              </div>
            </div>
            <div className="absolute -right-3 -top-6 rotate-6 rounded-full bg-papel p-2 shadow-lift sm:-right-6">
              <LogoMark animated className="size-20 sm:size-24" title="Bússola do Rumo" />
            </div>
          </div>
        </section>

        <section className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-[14px] border bg-card p-5 shadow-card">
              <span className="grid size-10 place-items-center rounded-full bg-salvia text-oliva"><f.icon className="size-5" strokeWidth={1.5} /></span>
              <h2 className="mt-4 text-xl">{f.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Rumo · planeje, viva e lembre cada viagem
      </footer>
    </div>
  );
}
