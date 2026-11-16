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
      { title: "Minhas viagens — Rumo" },
      { name: "description", content: "Todas as suas viagens planejadas, em andamento e concluídas." },
      { property: "og:title", content: "Minhas viagens — Rumo" },
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
