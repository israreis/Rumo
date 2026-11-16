import { Splash } from "@/components/Logo";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TripForm } from "@/components/trips/TripForm";
import { saveTrip } from "@/lib/trips-api";
import { profileQuery } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated/trips/new")({
  head: () => ({
    meta: [
      { title: "Nova viagem — Rumo Trip" },
      { name: "description", content: "Comece a planejar uma nova viagem." },
      { property: "og:title", content: "Nova viagem — Rumo Trip" },
      { property: "og:description", content: "Comece a planejar uma nova viagem." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewTrip,
});

function NewTrip() {
  const { user } = Route.useRouteContext();
  const { data: profile, isLoading } = useQuery(profileQuery(user.id));
  const navigate = useNavigate();
  const qc = useQueryClient();
  if (isLoading) return <Splash />;
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-3xl font-semibold">Nova viagem</h1>
      <TripForm
        submitLabel="Criar viagem"
        initial={{
          name: "", start_date: null, end_date: null, travelers_count: 1,
          currency: profile?.default_currency ?? "BRL", budget: null, cover_url: null, status_override: null, iof_pct: 3.5, card_spread_pct: 0,
          destinations: [{ city: "", country: "", arrival_date: null, departure_date: null }],
          travelers: [{ name: profile?.full_name ?? "", email: user.email ?? "" }],
        }}
        onSubmit={async (v) => {
          const id = await saveTrip(v);
          await qc.invalidateQueries({ queryKey: ["trips"] });
          navigate({ to: "/trips/$tripId", params: { tripId: id } });
        }}
      />
    </div>
  );
}
