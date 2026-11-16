import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Luggage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Splash } from "@/components/Logo";
import { EmptyState } from "@/components/EmptyState";
import { TripCard } from "@/components/trips/TripCard";
import { listTrips } from "@/lib/trips-api";

export const Route = createFileRoute("/_authenticated/trips/")({
  head: () => ({
    meta: [
      { title: "Minhas viagens — Rumo Trip" },
      { name: "description", content: "Todas as suas viagens planejadas, em andamento e concluídas." },
      { property: "og:title", content: "Minhas viagens — Rumo Trip" },
      { property: "og:description", content: "Todas as suas viagens planejadas, em andamento e concluídas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ["trips"], queryFn: listTrips });
  return (
    <div>
      <PageBackdrop />
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="font-hand text-2xl text-primary">Para onde agora?</p>
          <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">Minhas viagens</h1>
        </div>
        <Button asChild><Link to="/trips/new"><Plus /> <span className="hidden sm:inline">Nova viagem</span></Link></Button>
      </div>
      {isLoading ? (
        <Splash label="Buscando suas viagens…" />
      ) : !data?.length ? (
        <EmptyState icon={Luggage} title="Nenhuma viagem ainda" text="Crie sua primeira viagem: dê um nome, adicione os destinos e as datas. O resto você completa aos poucos."
          action={<Button asChild><Link to="/trips/new"><Plus /> Criar viagem</Link></Button>} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data.map((t) => <TripCard key={t.id} trip={t} />)}</div>
      )}
    </div>
  );
}

/**
 * Fundo da tela inicial (teste): hachuras finas de papel-moeda, bem suaves, e uma rosa dos
 * ventos apagada no canto inferior direito. Fica atrás de tudo e não entra nos cartões.
 */
function PageBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0 opacity-100 dark:opacity-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(32deg, transparent 0 7px, color-mix(in oklab, var(--caramelo) 9%, transparent) 7px 8px)," +
            "linear-gradient(118deg, transparent 0 30%, color-mix(in oklab, var(--latao) 6%, transparent) 30% 46%, transparent 46% 70%, color-mix(in oklab, var(--latao) 5%, transparent) 70% 80%, transparent 80%)",
        }}
      />
      <svg viewBox="0 0 200 200" className="absolute -bottom-24 -right-24 size-[34rem] text-tinta opacity-[0.06] dark:opacity-[0.08]">
        <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="100" cy="100" r="88" fill="none" stroke="currentColor" strokeWidth="0.6" strokeDasharray="1.5 2.5" />
        <circle cx="100" cy="100" r="62" fill="none" stroke="currentColor" strokeWidth="0.5" />
        {Array.from({ length: 72 }, (_, i) => {
          const a = (i * Math.PI) / 36, r1 = 88, r2 = i % 6 === 0 ? 80 : 84;
          return <line key={i} x1={100 + Math.cos(a) * r1} y1={100 + Math.sin(a) * r1} x2={100 + Math.cos(a) * r2} y2={100 + Math.sin(a) * r2} stroke="currentColor" strokeWidth="0.5" />;
        })}
        <path d="M100 20 L108 100 L100 180 L92 100 Z M20 100 L100 92 L180 100 L100 108 Z" fill="currentColor" />
        <path d="M100 52 L104 100 L100 148 L96 100 Z M52 100 L100 96 L148 100 L100 104 Z" fill="currentColor" transform="rotate(45 100 100)" />
      </svg>
    </div>
  );
}
