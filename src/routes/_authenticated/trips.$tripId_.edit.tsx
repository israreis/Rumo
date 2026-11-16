import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TripForm } from "@/components/trips/TripForm";
import { getTrip, saveTrip } from "@/lib/trips-api";

export const Route = createFileRoute("/_authenticated/trips/$tripId_/edit")({
  head: () => ({
    meta: [
      { title: "Editar viagem — Rota" },
      { name: "description", content: "Atualize destinos, datas, viajantes e orçamento." },
      { property: "og:title", content: "Editar viagem — Rota" },
      { property: "og:description", content: "Atualize destinos, datas, viajantes e orçamento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EditTrip,
});

function EditTrip() {
  const { tripId } = Route.useParams();
  const { data: trip, isLoading } = useQuery({ queryKey: ["trips", tripId], queryFn: () => getTrip(tripId) });
  const navigate = useNavigate();
  const qc = useQueryClient();
  if (isLoading) return null;
  if (!trip) return <p className="text-muted-foreground">Viagem não encontrada.</p>;
  const { id: _id, owner_id: _o, trip_destinations, trip_travelers, ...rest } = trip;
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-3xl font-semibold">Editar viagem</h1>
      <TripForm
        submitLabel="Salvar alterações"
        initial={{ ...rest, destinations: trip_destinations, travelers: trip_travelers }}
        onSubmit={async (v) => {
          await saveTrip(v, tripId);
          await qc.invalidateQueries({ queryKey: ["trips"] });
          navigate({ to: "/trips/$tripId", params: { tripId } });
        }}
      />
    </div>
  );
}
