import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Printer } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { LogoMark, Splash, Wordmark } from "@/components/Logo";
import { Stamp } from "@/components/Stamp";
import { tripStamps } from "@/lib/stamps";
import { buildAgenda, type AgendaKind } from "@/lib/agenda";
import { planQuery, TRANSPORT_TYPES, type Activity, type ItineraryEvent, type Lodging, type PlanTable, type Transport } from "@/lib/plan-api";
import { CONTACT_KINDS, DOC_KINDS } from "@/lib/trip-extras";
import { formatDate, toDate } from "@/lib/trip-utils";
import { getTrip } from "@/lib/trips-api";
import { formatZoned } from "@/lib/tz";
import type { Database } from "@/integrations/supabase/types";

type Contact = Database["public"]["Tables"]["emergency_contacts"]["Row"];
type Doc = Database["public"]["Tables"]["traveler_documents"]["Row"];

export const Route = createFileRoute("/_authenticated/trips/$tripId_/imprimir")({
  head: () => ({ meta: [{ title: "Roteiro para imprimir — Rumo Trip" }, { name: "robots", content: "noindex" }] }),
  component: PrintTrip,
});

const KIND_LABEL: Record<AgendaKind, string> = {
  transport: "Transporte", arrival: "Chegada", checkin: "Check-in", checkout: "Check-out", activity: "Atividade", event: "Programa",
};

function PrintTrip() {
  const { tripId } = Route.useParams();
  const { data: trip, isLoading } = useQuery({ queryKey: ["trips", tripId], queryFn: () => getTrip(tripId) });
  const q = <R,>(t: PlanTable) => planQuery<R>(t, tripId);
  const { data: transports = [], isLoading: l1 } = useQuery(q<Transport>("transports"));
  const { data: lodgings = [], isLoading: l2 } = useQuery(q<Lodging>("lodgings"));
  const { data: activities = [], isLoading: l3 } = useQuery(q<Activity>("activities"));
  const { data: events = [], isLoading: l4 } = useQuery(q<ItineraryEvent>("itinerary_events"));
  const { data: contacts = [] } = useQuery(q<Contact>("emergency_contacts"));
  const { data: docs = [] } = useQuery(q<Doc>("traveler_documents"));
  const ready = !isLoading && !l1 && !l2 && !l3 && !l4 && !!trip;

  const days = useMemo(
    () => (trip ? buildAgenda({ start: trip.start_date, end: trip.end_date, transports, lodgings, activities, events }) : []),
    [trip, transports, lodgings, activities, events],
  );

  useEffect(() => {
    if (!ready) return;
    document.documentElement.classList.add("printing");
    return () => document.documentElement.classList.remove("printing");
  }, [ready]);

  if (!ready || !trip) return <Splash label="Preparando o roteiro…" />;
  const travelerName = Object.fromEntries(trip.trip_travelers.map((t) => [t.id ?? "", t.name]));

  return (
    <div className="mx-auto max-w-3xl">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-card">
        <Link to="/trips/$tripId" params={{ tripId }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Voltar para a viagem
        </Link>
        <div className="flex items-center gap-3">
          <p className="hidden text-xs text-muted-foreground sm:block">No diálogo de impressão, escolha <strong>Salvar como PDF</strong>.</p>
          <Button onClick={() => window.print()}><Printer /> Imprimir / PDF</Button>
        </div>
      </div>

      <article className="rounded-xl bg-papel p-6 text-tinta shadow-card print:rounded-none print:bg-white print:p-0 print:shadow-none sm:p-10">
        <header className="flex items-start justify-between gap-6 border-b pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-tinta-suave">Roteiro de viagem</p>
            <h1 className="mt-1 text-4xl font-medium">{trip.name}</h1>
            <p className="mt-2 font-num text-sm text-tinta-suave">{formatDate(trip.start_date)} – {formatDate(trip.end_date)}</p>
            <p className="mt-1 text-sm">{trip.trip_destinations.map((d) => d.city).join(" · ")}</p>
          </div>
          <div className="flex items-center gap-2">
            <LogoMark animated={false} className="size-10" />
            <Wordmark className="text-2xl" />
          </div>
        </header>

        {transports.length > 0 && (
          <section className="print-avoid mt-8">
            <h2 className="text-xl font-medium">Transportes</h2>
            <ul className="mt-3 space-y-3">
              {transports.map((t) => (
                <li key={t.id} className="print-avoid rounded-lg border border-dashed p-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold">{TRANSPORT_TYPES[t.type]} · {t.origin} → {t.destination}</p>
                    {t.locator && <p className="font-num text-sm">Localizador <strong>{t.locator}</strong></p>}
                  </div>
                  <p className="mt-1 font-num text-sm text-tinta-suave">
                    {formatZoned(t.departure_at, t.departure_tz)} → {formatZoned(t.arrival_at, t.arrival_tz)}
                  </p>
                  <p className="mt-1 text-sm text-tinta-suave">{[t.company, t.code, t.seat && `Assento ${t.seat}`, t.baggage && `Bagagem: ${t.baggage}`].filter(Boolean).join(" · ")}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {lodgings.length > 0 && (
          <section className="print-avoid mt-8">
            <h2 className="text-xl font-medium">Hospedagens</h2>
            <ul className="mt-3 space-y-3">
              {lodgings.map((l) => (
                <li key={l.id} className="print-avoid rounded-lg border border-dashed p-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold">{l.name}</p>
                    {l.booking_code && <p className="font-num text-sm">Reserva <strong>{l.booking_code}</strong></p>}
                  </div>
                  <p className="mt-1 text-sm">{l.address}</p>
                  <p className="mt-1 font-num text-sm text-tinta-suave">
                    Check-in {formatDate(l.check_in_date)} {l.check_in_time?.slice(0, 5)} · Check-out {formatDate(l.check_out_date)} {l.check_out_time?.slice(0, 5)}
                  </p>
                  {l.contact && <p className="mt-1 text-sm text-tinta-suave">Contato: {l.contact}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-8">
          <h2 className="text-xl font-medium">Dia a dia</h2>
          <div className="mt-3 space-y-5">
            {days.map(({ day, items }, i) => {
              const d = toDate(day);
              return (
                <div key={day} className="print-avoid">
                  <h3 className="flex items-baseline gap-2 border-b pb-1 text-lg font-medium">
                    <span>Dia {i + 1}</span>
                    <span className="font-sans text-sm font-normal capitalize text-tinta-suave">{d ? format(d, "EEEE, dd 'de' MMMM", { locale: ptBR }) : day}</span>
                  </h3>
                  {items.length ? (
                    <ul className="mt-2 space-y-1.5">
                      {items.map((it) => (
                        <li key={it.key} className="grid grid-cols-[3.25rem_1fr] gap-3 text-sm">
                          <span className="font-num text-tinta-suave">{it.time ?? "—"}</span>
                          <span>
                            <span className="font-medium">{it.title}</span>
                            <span className="text-tinta-suave"> · {KIND_LABEL[it.kind]}</span>
                            {it.location && <span className="block text-tinta-suave">{it.location}</span>}
                            {it.code && <span className="block font-num text-xs">Reserva {it.code}</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 font-hand text-xl text-tinta-suave">Dia livre</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {(contacts.length > 0 || docs.length > 0) && (
          <section className="print-avoid mt-8">
            <h2 className="text-xl font-medium">Contatos e documentos</h2>
            <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2 print:grid-cols-2">
              {contacts.map((c) => (
                <li key={c.id} className="rounded-lg border p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-tinta-suave">{CONTACT_KINDS[c.kind] ?? c.kind}</p>
                  <p className="font-medium">{c.name}</p>
                  {c.phone && <p className="font-num">{c.phone}</p>}
                </li>
              ))}
              {docs.filter((d) => d.kind === "insurance").map((d) => (
                <li key={d.id} className="rounded-lg border p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-tinta-suave">{DOC_KINDS[d.kind] ?? d.kind}</p>
                  <p className="font-medium">{d.issuer}{d.traveler_id && travelerName[d.traveler_id] ? ` · ${travelerName[d.traveler_id]}` : ""}</p>
                  {d.number && <p className="font-num">Apólice {d.number}</p>}
                  {d.phone && <p className="font-num">Emergência {d.phone}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="print-avoid mt-8">
          <h2 className="text-xl font-medium">Carimbos da viagem</h2>
          <ul className="mt-3 flex flex-wrap gap-4">
            {tripStamps(trip, "9999-12-31").filter((s) => s.kind === "country").map((s) => (
              <li key={s.key}><Stamp top={s.top} main={s.main} bottom={s.bottom} tone={s.tone} shape={s.shape} tilt={s.tilt} className="size-24" /></li>
            ))}
          </ul>
        </section>

        <footer className="mt-10 border-t pt-4 text-xs text-tinta-suave">Gerado pelo Rumo Trip em {format(new Date(), "dd/MM/yyyy HH:mm")}.</footer>
      </article>
    </div>
  );
}
