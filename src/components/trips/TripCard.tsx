import { Link } from "@tanstack/react-router";
import { CalendarDays, MapPin } from "lucide-react";
import { computeStatus, daysUntil, formatDate } from "@/lib/trip-utils";
import type { Trip } from "@/lib/trips-api";
import { StatusBadge } from "./StatusBadge";
import { TripActions } from "./TripActions";
import { TripCover } from "./TripCover";

export function TripCard({ trip }: { trip: Trip }) {
  const status = computeStatus(trip.start_date, trip.end_date, trip.status_override);
  const days = daysUntil(trip.start_date);
  const places = trip.trip_destinations.map((d) => d.city).join(" · ");
  return (
    <article className="group relative overflow-hidden rounded-2xl border bg-card shadow-card transition-shadow hover:shadow-lift">
      <Link to="/trips/$tripId" params={{ tripId: trip.id }} className="block">
        <div className="relative aspect-[16/10]">
          <TripCover url={trip.cover_url} className="transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-cover-fade" />
          <StatusBadge status={status} className="absolute left-3 top-3" />
          {days != null && status !== "completed" && (
            <div className="absolute bottom-3 right-3 rounded-xl bg-background/90 px-3 py-1.5 text-center backdrop-blur">
              <div className="font-display text-xl font-semibold leading-none text-foreground">{days}</div>
              <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{days === 1 ? "dia" : "dias"}</div>
            </div>
          )}
          <h3 className="absolute bottom-3 left-4 right-24 font-display text-2xl font-medium text-on-photo">{trip.name}</h3>
        </div>
        <div className="space-y-1.5 p-4 pr-12 text-sm text-muted-foreground">
          <p className="flex items-center gap-2 truncate"><MapPin className="size-4 shrink-0 text-primary" /> {places || "Sem destinos"}</p>
          <p className="flex items-center gap-2"><CalendarDays className="size-4 shrink-0 text-primary" /> {formatDate(trip.start_date)} – {formatDate(trip.end_date)}</p>
        </div>
      </Link>
      <div className="absolute bottom-3 right-2"><TripActions trip={trip} /></div>
    </article>
  );
}
