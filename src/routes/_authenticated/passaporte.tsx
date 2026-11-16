import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PassportMark, Splash } from "@/components/Logo";
import { Stamp } from "@/components/Stamp";
import { collection, markStampsSeen, seenStamps, type StampItem } from "@/lib/stamps";
import { listTrips } from "@/lib/trips-api";

export const Route = createFileRoute("/_authenticated/passaporte")({
  head: () => ({ meta: [{ title: "Meu passaporte — Rumo" }, { name: "description", content: "Sua coleção de carimbos de viagem." }] }),
  component: Passport,
});

function Passport() {
  const { data: trips, isLoading } = useQuery({ queryKey: ["trips"], queryFn: listTrips });
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

  const byTrip = groupByTrip(col.earned);

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-center gap-5">
        <PassportMark className="size-16 self-start sm:size-24 sm:self-center" title="Passaporte Rumo" />
        <div className="min-w-0 flex-1">
          <p className="font-hand text-2xl text-primary">Carimbe cada chegada</p>
          <h1 className="text-3xl sm:text-4xl">Meu passaporte</h1>
          <p className="mt-1 max-w-lg text-sm text-muted-foreground">
            Os passaportes quase não são mais carimbados, então o Rumo guarda esse ritual: cada cidade vira um carimbo no dia em que você chega, e cada viagem concluída ganha o seu.
          </p>
        </div>
        <dl className="grid w-full grid-cols-3 gap-3 text-center sm:w-auto">
          <Count n={col.earned.length} label="carimbos" />
          <Count n={col.cities} label="cidades" />
          <Count n={col.countries} label={col.countries === 1 ? "país" : "países"} />
        </dl>
      </header>

      {col.earned.length === 0 ? (
        <div className="flex flex-col items-center rounded-[14px] border border-dashed bg-card/50 px-6 py-12 text-center">
          <Stamp top="Rumo" main="Em branco" bottom="Primeira página" tone="oliva" shape="dashed" pending className="size-32" />
          <h2 className="mt-4 text-2xl">Nenhum carimbo ainda</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">O primeiro aparece no dia em que você chegar ao primeiro destino de uma viagem.</p>
          <Button asChild className="mt-6"><Link to="/trips">Ver minhas viagens</Link></Button>
        </div>
      ) : (
        byTrip.map(([tripId, items]) => (
          <section key={tripId} className="rounded-[22px] border bg-papel p-5 shadow-card sm:p-7">
            <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-dashed pb-3">
              <h2 className="text-2xl">{items[0]!.tripName}</h2>
              <Link to="/trips/$tripId" params={{ tripId }} className="text-sm font-semibold text-primary hover:underline">Abrir viagem</Link>
            </div>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((s) => (
                <li key={s.key} className="flex justify-center">
                  <Stamp top={s.top} main={s.main} bottom={s.bottom} tone={s.tone} shape={s.shape} tilt={s.tilt}
                    fresh={fresh.size > 0 && !fresh.has(s.key)} className="size-32 sm:size-36" />
                </li>
              ))}
            </ul>
          </section>
        ))
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

function groupByTrip(items: StampItem[]): [string, StampItem[]][] {
  const m = new Map<string, StampItem[]>();
  for (const s of items) (m.get(s.tripId) ?? m.set(s.tripId, []).get(s.tripId)!).push(s);
  // Inside a trip, stamps read in travel order.
  return [...m.entries()].map(([k, v]) => [k, v.sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""))]);
}
