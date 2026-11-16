import { createFileRoute, Link } from "@tanstack/react-router";
import { PageBackdrop } from "@/components/PageBackdrop";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BedDouble, CalendarDays, Clock, LogOut, MapPin, Plane, Sparkles, Ticket } from "lucide-react";
import { useMemo } from "react";
import { Logo, LogoMark, Splash } from "@/components/Logo";
import { TripCover } from "@/components/trips/TripCover";
import { supabase } from "@/integrations/supabase/client";
import {
  buildAgenda, type AgendaActivity, type AgendaEvent, type AgendaKind, type AgendaLodging, type AgendaTransport,
} from "@/lib/agenda";
import { formatDate, toDate } from "@/lib/trip-utils";

type PublicTrip = {
  trip: { id: string; name: string; start_date: string | null; end_date: string | null; cover_url: string | null };
  destinations: { city: string; country: string | null; arrival_date: string | null; departure_date: string | null }[];
  transports: AgendaTransport[];
  lodgings: AgendaLodging[];
  activities: AgendaActivity[];
  events: AgendaEvent[];
};

export const Route = createFileRoute("/r/$token")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Roteiro de viagem — Rumo Trip" },
      { name: "description", content: "Acompanhe o roteiro desta viagem, dia a dia." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PublicItinerary,
});

const ICON: Record<AgendaKind, typeof Plane> = {
  transport: Plane, arrival: MapPin, checkin: BedDouble, checkout: LogOut, activity: Ticket, event: Sparkles,
};

function PublicItinerary() {
  const { token } = Route.useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-trip", token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_trip", { _token: token });
      if (error) throw error;
      return (data ?? null) as PublicTrip | null;
    },
  });

  const days = useMemo(
    () =>
      data
        ? buildAgenda({
            start: data.trip.start_date, end: data.trip.end_date,
            transports: data.transports, lodgings: data.lodgings, activities: data.activities, events: data.events,
          })
        : [],
    [data],
  );

  if (isLoading) return <Splash label="Abrindo o roteiro…" />;
  if (isError || !data)
    return (
      <div className="grid min-h-dvh place-items-center px-4 text-center">
        <div className="max-w-sm">
          <LogoMark className="mx-auto size-16" />
          <h1 className="mt-6 text-3xl">Roteiro indisponível</h1>
          <p className="mt-2 text-sm text-muted-foreground">Este link foi desativado ou não existe. Peça um novo link a quem compartilhou.</p>
        </div>
      </div>
    );

  const { trip, destinations } = data;
  return (
    <div className="min-h-dvh">
      <PageBackdrop />
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 pb-4 pt-[max(1.75rem,env(safe-area-inset-top))]">
        <Logo />
        <span className="rounded-full border px-3 py-1 text-xs font-semibold text-muted-foreground">Somente leitura</span>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16">
        <div className="relative overflow-hidden rounded-[22px] shadow-lift">
          <div className="aspect-[16/9]"><TripCover url={trip.cover_url} /></div>
          <div className="absolute inset-0 bg-cover-fade" />
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
            <h1 className="text-4xl text-on-photo sm:text-5xl">{trip.name}</h1>
            <p className="mt-2 font-num text-sm text-on-photo/90">{formatDate(trip.start_date)} – {formatDate(trip.end_date)}</p>
          </div>
        </div>

        {destinations.length > 0 && (
          <ol className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            {destinations.map((d, i) => (
              <li key={`${d.city}-${i}`} className="flex items-center gap-2">
                {i > 0 && <span className="h-px w-6 border-t border-dashed border-latao" aria-hidden />}
                <MapPin className="size-4 text-primary" />
                <span className="font-medium">{d.city}</span>
                <span className="text-muted-foreground">{formatDate(d.arrival_date)}</span>
              </li>
            ))}
          </ol>
        )}

        <section className="mt-8 space-y-6">
          {days.map(({ day, items }, i) => {
            const d = toDate(day);
            return (
              <div key={day} className="rounded-[14px] border bg-card p-4 shadow-card sm:p-5">
                <div className="flex items-baseline gap-3">
                  <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">Dia {i + 1}</span>
                  <h2 className="text-lg capitalize">{d ? format(d, "EEEE, dd 'de' MMMM", { locale: ptBR }) : day}</h2>
                </div>
                {items.length ? (
                  <ul className="mt-3 space-y-2.5">
                    {items.map((it) => {
                      const Icon = ICON[it.kind];
                      return (
                        <li key={it.key} className="flex gap-3">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-salvia text-oliva"><Icon className="size-4" strokeWidth={1.5} /></span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{it.title}</p>
                            <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                              {it.time && <span className="inline-flex items-center gap-1 font-num"><Clock className="size-3" />{it.time}{it.endTime ? `–${it.endTime}` : ""}</span>}
                              {it.location && <span className="truncate">{it.location}</span>}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-2 font-hand text-xl text-muted-foreground">Dia livre</p>
                )}
              </div>
            );
          })}
          {!days.length && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="size-4" /> O roteiro ainda não tem datas.</p>
          )}
        </section>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Planejado com <Link to="/" className="font-semibold text-primary hover:underline">Rumo Trip</Link>
        </p>
      </main>
    </div>
  );
}
