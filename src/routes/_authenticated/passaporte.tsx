import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PassportMark, Splash } from "@/components/Logo";
import { Stamp } from "@/components/Stamp";
import { collection, markStampsSeen, seenStamps } from "@/lib/stamps";
import { profileQuery } from "@/lib/profile";
import { PassportBook } from "@/components/PassportBook";
import { listTrips } from "@/lib/trips-api";

export const Route = createFileRoute("/_authenticated/passaporte")({
  head: () => ({ meta: [{ title: "Meu passaporte — Rumo" }, { name: "description", content: "Sua coleção de carimbos de viagem." }] }),
  component: Passport,
});

function Passport() {
  const { user } = Route.useRouteContext();
  const { data: trips, isLoading } = useQuery({ queryKey: ["trips"], queryFn: listTrips });
  const { data: profile } = useQuery(profileQuery(user.id));
  const today = format(new Date(), "yyyy-MM-dd");
  const col = useMemo(() => collection(trips ?? [], today), [trips, today]);
  // Stamps earned since the last visit land with the stamping animation, once.
  const [fresh] = useState(() => (typeof window === "undefined" ? new Set<string>() : seenStamps()));
  const newOnes = col.earned.filter((s) => !fresh.has(s.key));

  useEffect(() => {
    if (!trips) return;
    if (newOnes.length && fresh.size) toast.success(newOnes.length === 1 ? "Novo carimbo no passaporte!" : `${newOnes.length} carimbos novos no passaporte!`);
    markStampsSeen(col.earned.map((s) => s.key));
  }, [trips]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) return <Splash label="Abrindo o passaporte…" />;

  // No livreto, os carimbos seguem a ordem das viagens: cidades na ordem de chegada e o "concluída" no fim.
  const chrono = [...col.earned].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "") || (a.kind === "trip" ? 1 : 0) - (b.kind === "trip" ? 1 : 0));

  return (
    <div className="space-y-10">
      <header className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center">
        <div className="flex items-center gap-4 sm:gap-6">
          <PassportMark className="size-16 shrink-0 sm:size-24" title="Passaporte Rumo" />
          <div className="min-w-0">
            <p className="font-hand text-xl text-primary sm:text-2xl">Carimbe cada chegada</p>
            <h1 className="text-3xl sm:text-4xl">Meu passaporte</h1>
          </div>
        </div>
        <dl className="order-last grid grid-cols-3 gap-3 text-center lg:order-none lg:row-span-2">
          <Count n={col.earned.length} label="carimbos" />
          <Count n={col.cities} label="cidades" />
          <Count n={col.countries} label={col.countries === 1 ? "país" : "países"} />
        </dl>
        <p className="max-w-2xl text-sm text-muted-foreground lg:-mt-2">
          Os passaportes quase não são mais carimbados, então o Rumo guarda esse ritual: cada país ganha um carimbo no dia em que você entra nele, como na imigração do aeroporto, e cada viagem concluída ganha o seu.
        </p>
      </header>

      {col.earned.length === 0 ? (
        <div className="flex flex-col items-center rounded-[14px] border border-dashed bg-card/50 px-6 py-12 text-center">
          <Stamp top="Rumo" main="Em branco" bottom="Primeira página" tone="oliva" shape="rect" pending className="size-32" />
          <h2 className="mt-4 text-2xl">Nenhum carimbo ainda</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">O primeiro aparece no dia em que você chegar ao primeiro destino de uma viagem.</p>
          <Button asChild className="mt-6"><Link to="/trips">Ver minhas viagens</Link></Button>
        </div>
      ) : (
        <PassportBook
          stamps={chrono}
          seen={fresh}
          holder={{ name: profile?.full_name ?? null, avatar: profile?.avatar_url ?? null }}
          counts={{ stamps: col.earned.length, cities: col.cities, countries: col.countries }}
        />
      )}

      {col.pending.length > 0 && (
        <section>
          <h2 className="text-2xl">Para carimbar</h2>
          <p className="mt-1 text-sm text-muted-foreground">Próximas chegadas das suas viagens.</p>
          <ul className="mt-5 grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {col.pending.slice(0, 12).map((s) => (
              <li key={s.key} className="flex flex-col items-center gap-1 text-center">
                <Stamp top={s.top} main={s.main} bottom={s.bottom} tone={s.tone} shape={s.shape} tilt={s.tilt} pending className="size-24" />
                <span className="text-[11px] text-muted-foreground">{s.tripName}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Count({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-2 shadow-card">
      <dt className="sr-only">{label}</dt>
      <dd className="font-num text-2xl font-medium">{n}</dd>
      <dd className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</dd>
    </div>
  );
}
