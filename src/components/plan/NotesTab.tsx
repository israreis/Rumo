import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import type { Database } from "@/integrations/supabase/types";
import { destinationForDay, tripDays } from "@/lib/itinerary";
import { planQuery } from "@/lib/plan-api";
import { toDate } from "@/lib/trip-utils";
import type { Trip } from "@/lib/trips-api";
import { AreaF, EditDialog, SelectF, TextF, useEditor } from "./common";
import { RichText } from "./RichText";

export type Note = Database["public"]["Tables"]["trip_notes"]["Row"];
const dayLabel = (d: string) => format(toDate(d)!, "EEE, dd/MM", { locale: ptBR });

export function NotesTab({ trip }: { trip: Trip }) {
  const { data: notes = [] } = useQuery(planQuery<Note>("trip_notes", trip.id));
  const ed = useEditor();
  const days = tripDays(trip.start_date, trip.end_date);
  const dayOpts: Record<string, string> = { none: "Viagem toda" };
  days.forEach((d, i) => (dayOpts[d] = `Dia ${i + 1} · ${dayLabel(d)}${destinationForDay(d, trip.trip_destinations) ? ` · ${destinationForDay(d, trip.trip_destinations)!.city}` : ""}`));
  const groups = [{ key: "none", label: "Viagem toda" }, ...days.map((d) => ({ key: d, label: dayOpts[d]! }))]
    .map((g) => ({ ...g, notes: notes.filter((n) => (n.day ?? "none") === g.key) })).filter((g) => g.notes.length);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl sm:text-2xl font-semibold">Notas</h2>
        <Button onClick={() => ed.open({ day: "none", title: "", content: "" })}><Plus /> Nota</Button>
      </div>
      {!notes.length && <EmptyState icon={StickyNote} title="Nenhuma nota ainda" text="Guarde frases úteis no idioma local, dicas de amigos ou a senha do Wi-Fi da hospedagem — da viagem toda ou de um dia específico." />}
      {groups.map((g) => (
        <section key={g.key}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.label}</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {g.notes.map((n) => (
              <article key={n.id} onClick={() => ed.open({ ...n, day: n.day ?? "none" })} className="cursor-pointer rounded-2xl border bg-card p-4 shadow-card hover:bg-muted/40">
                {n.title && <h4 className="mb-1.5 font-semibold">{n.title}</h4>}
                <RichText text={n.content} />
              </article>
            ))}
          </div>
        </section>
      ))}
      {ed.editing && (
        <EditDialog table="trip_notes" tripId={trip.id} open onOpenChange={ed.close} title={ed.editing.id ? "Editar nota" : "Nova nota"} initial={ed.editing}
          prepare={(f) => ({ ...f, day: f.day === "none" ? null : f.day, title: f.title ?? "" })}>
          {(f, set) => <>
            <TextF f={f} set={set} k="title" label="Título" placeholder="Ex.: Wi-Fi do apartamento" />
            <SelectF f={f} set={set} k="day" label="Para quando" options={dayOpts} />
            <AreaF f={f} set={set} k="content" label="Texto  (**negrito**, *itálico*, - lista, # título)" className="sm:col-span-2" rows={10} />
          </>}
        </EditDialog>
      )}
    </div>
  );
}
