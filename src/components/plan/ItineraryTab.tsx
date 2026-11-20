import { Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, closestCorners, useDroppable, useSensor, useSensors,
  type DragEndEvent, type DragOverEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlertTriangle, BedDouble, CalendarRange, GripVertical, Heart, LogOut, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import { EVENT_CATEGORIES, planQuery, TRANSPORT_TYPES, updateMany, type Activity, type ItineraryEvent, type Lodging, type Transport } from "@/lib/plan-api";
import { conflictingIds, dayTimezone, destinationForDay, nightsWithoutLodging, tripDays } from "@/lib/itinerary";
import { formatMoney, toDate } from "@/lib/trip-utils";
import { zonedDate, zonedTime } from "@/lib/tz";
import type { Trip } from "@/lib/trips-api";
import { AreaF, EditDialog, MoneyF, Pill, SelectF, TextF, withFx, type Form } from "./common";
import { ActivityDialog, geocodeIfChanged } from "./ActivitiesTab";
import { ACTIVITY_ICON, EVENT_ICON, TRANSPORT_ICON } from "./icons";
import { Stamp } from "@/components/Stamp";
import { tripStamps } from "@/lib/stamps";
import { useTripWeather, weatherLabel } from "@/lib/weather";
import type { MapPoint } from "./DayMap";

const DayMap = lazy(() => import("./DayMap"));
const WISH = "wish";

type Fixed = { key: string; time: string | null; endTime: string | null; title: string; sub?: string | undefined; icon: any; tone: string };

export function ItineraryTab({ trip }: { trip: Trip }) {
  const qc = useQueryClient();
  const { data: transports = [] } = useQuery(planQuery<Transport>("transports", trip.id));
  const { data: lodgings = [] } = useQuery(planQuery<Lodging>("lodgings", trip.id));
  const { data: activities = [] } = useQuery(planQuery<Activity>("activities", trip.id));
  const { data: events = [] } = useQuery(planQuery<ItineraryEvent>("itinerary_events", trip.id));
  const days: string[] = useMemo(() => tripDays(trip.start_date, trip.end_date), [trip.start_date, trip.end_date]);
  const weather = useTripWeather(trip.trip_destinations, days);
  const dests = trip.trip_destinations;

  const actById: Record<string, any> = useMemo(() => Object.fromEntries(activities.map((a) => [`ac:${a.id}`, a])), [activities]);
  const evById: Record<string, any> = useMemo(() => Object.fromEntries(events.map((e) => [`ev:${e.id}`, e])), [events]);

  // Container -> ordered draggable ids
  const buildItems = () => {
    const out: Record<string, string[]> = { [WISH]: [] };
    days.forEach((d) => (out[d] = []));
    const rows = [
      ...activities.map((a) => ({ id: `ac:${a.id}`, c: a.date ?? WISH, pos: a.position, t: a.time ?? "" })),
      ...events.map((e) => ({ id: `ev:${e.id}`, c: e.day, pos: e.position, t: e.start_time ?? "" })),
    ].sort((a, b) => a.pos - b.pos || a.t.localeCompare(b.t));
    rows.forEach((r) => (out[r.c] ?? (out[r.c] = [])).push(r.id));
    return out;
  };
  const [items, setItems] = useState<Record<string, string[]>>(buildItems);
  const get = (k: string) => items[k] ?? [];
  const dragging = useRef(false);
  const startC = useRef<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  useEffect(() => { if (!dragging.current) setItems(buildItems()); }, [activities, events, days]);

  const fixedByDay = useMemo(() => {
    const m: Record<string, Fixed[]> = {};
    const push = (d: string, f: Fixed) => (m[d] ??= []).push(f);
    for (const t of transports) {
      const label = `${TRANSPORT_TYPES[t.type]} ${t.origin ?? ""} → ${t.destination ?? ""}`;
      const icon = TRANSPORT_ICON[t.type];
      if (t.departure_at) {
        const d = zonedDate(t.departure_at, t.departure_tz || "UTC");
        const sameDay = t.arrival_at && zonedDate(t.arrival_at, t.arrival_tz || "UTC") === d;
        push(d, { key: `tr:${t.id}`, time: zonedTime(t.departure_at, t.departure_tz || "UTC"), endTime: sameDay ? zonedTime(t.arrival_at!, t.arrival_tz || "UTC") : null,
          title: label, sub: [t.company, t.code].filter(Boolean).join(" "), icon, tone: "primary" });
      }
      if (t.arrival_at && t.departure_at && zonedDate(t.arrival_at, t.arrival_tz || "UTC") !== zonedDate(t.departure_at, t.departure_tz || "UTC"))
        push(zonedDate(t.arrival_at, t.arrival_tz || "UTC"), { key: `ta:${t.id}`, time: zonedTime(t.arrival_at, t.arrival_tz || "UTC"), endTime: null, title: `Chegada em ${t.destination ?? ""}`, sub: [t.company, t.code].filter(Boolean).join(" "), icon, tone: "primary" });
    }
    for (const l of lodgings) {
      if (l.check_in_date) push(l.check_in_date, { key: `ci:${l.id}`, time: l.check_in_time?.slice(0, 5) ?? null, endTime: null, title: `Check-in · ${l.name}`, sub: l.address ?? undefined, icon: BedDouble, tone: "success" });
      if (l.check_out_date) push(l.check_out_date, { key: `co:${l.id}`, time: l.check_out_time?.slice(0, 5) ?? null, endTime: null, title: `Check-out · ${l.name}`, icon: LogOut, tone: "success" });
    }
    return m;
  }, [transports, lodgings]);

  // Day of entry into each country already lived gets the country stamp in the day header (virtual passport).
  const todayIso = format(new Date(), "yyyy-MM-dd");
  const stampByDay = useMemo(() => new Map(tripStamps(trip, todayIso).filter((s) => s.kind === "country" && s.earned && s.date).map((s) => [s.date!, s])), [trip, todayIso]);
  const gaps = useMemo(() => new Set(nightsWithoutLodging(trip.start_date, trip.end_date, lodgings, transports)), [trip, lodgings, transports]);
  const [selected, setSelected] = useState<string | null>(null);
  const selDay = selected ?? days[0];
  const [editEv, setEditEv] = useState<Form | null>(null);
  const [editAc, setEditAc] = useState<Form | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const findC = (id: string) => (id in items ? id : Object.keys(items).find((k) => get(k).includes(id)));

  function onStart(e: DragStartEvent) { dragging.current = true; setActiveId(String(e.active.id)); startC.current = findC(String(e.active.id)) ?? null; }
  function onOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const a = String(active.id), o = String(over.id);
    const from = findC(a), to = findC(o);
    if (!from || !to || from === to) return;
    if (to === WISH && a.startsWith("ev:")) return;
    setItems((p) => {
      const toItems = (p[to] ?? []).filter((x) => x !== a);
      const idx = o in p ? toItems.length : toItems.indexOf(o);
      toItems.splice(idx < 0 ? toItems.length : idx, 0, a);
      return { ...p, [from]: (p[from] ?? []).filter((x) => x !== a), [to]: toItems };
    });
  }
  async function onEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    const a = String(active.id);
    const c = findC(a);
    let next = items;
    if (c && over) {
      const o = String(over.id);
      if (findC(o) === c && !(o in items)) {
        const oi = get(c).indexOf(a), ni = get(c).indexOf(o);
        if (oi !== ni) next = { ...items, [c]: arrayMove(get(c), oi, ni) };
      }
    }
    setItems(next);
    const touched = new Set([c, startC.current].filter(Boolean) as string[]);
    const acts: any[] = [], evs: any[] = [];
    touched.forEach((cont) => (next[cont] ?? []).forEach((id, i) => {
      if (id.startsWith("ac:")) acts.push({ id: id.slice(3), position: i, date: cont === WISH ? null : cont });
      else evs.push({ id: id.slice(3), position: i, day: cont });
    }));
    await Promise.all([updateMany("activities", acts), updateMany("itinerary_events", evs)]);
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["plan", "activities", trip.id] }),
      qc.invalidateQueries({ queryKey: ["plan", "itinerary_events", trip.id] }),
    ]);
    dragging.current = false;
  }

  const mapPoints = useMemo<MapPoint[]>(() => {
    if (!selDay) return [];
    const pts: MapPoint[] = [];
    lodgings.filter((l) => l.lat != null && l.check_in_date && l.check_out_date && l.check_in_date <= selDay && selDay <= l.check_out_date)
      .forEach((l) => pts.push({ lat: l.lat!, lng: l.lng!, label: l.name, kind: "lodging" }));
    (items[selDay] ?? []).forEach((id) => {
      const r: any = actById[id] ?? evById[id];
      if (r?.lat != null) pts.push({ lat: r.lat, lng: r.lng, label: r.name ?? r.title, kind: id.startsWith("ac:") ? "activity" : "event" });
    });
    return pts;
  }, [selDay, lodgings, items, actById, evById]);

  if (!days.length)
    return <EmptyState icon={CalendarRange} title="Defina as datas da viagem" text="O roteiro é gerado a partir das datas de ida e volta. Edite a viagem para adicioná-las." />;

  const renderDraggable = (id: string, conflicts: Set<string>, tz: string) => {
    const a = actById[id], e = evById[id];
    if (!a && !e) return null;
    return <SortableItem key={id} id={id} conflict={conflicts.has(id)} onClick={() => (a ? setEditAc(a) : setEditEv(e))}
      icon={a ? ACTIVITY_ICON[a.category] : EVENT_ICON[e.category]}
      time={a ? a.time?.slice(0, 5) ?? null : e.start_time?.slice(0, 5) ?? null}
      endTime={e?.end_time?.slice(0, 5) ?? null}
      title={a ? a.name : e.title}
      sub={(a ? a.location : e.location) ?? undefined}
      cost={a ? (a.unit_price != null ? formatMoney((a.unit_price ?? 0) * a.quantity, a.currency) : null) : e.cost != null ? formatMoney(e.cost, trip.currency) : null}
      notes={a ? undefined : e.notes ?? undefined}
      badge={a ? "Atividade" : EVENT_CATEGORIES[e.category]} tz={tz} />;
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onStart} onDragOver={onOver} onDragEnd={onEnd}
      onDragCancel={() => { dragging.current = false; setActiveId(null); setItems(buildItems()); }}>
      {/* Título fora da grade: no PC o mapa começa na mesma altura do Dia 1. */}
      <h2 className="mb-4 text-xl sm:text-2xl font-semibold">Roteiro dia a dia</h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          {days.map((day, i) => {
            const dest = destinationForDay(day, dests);
            const tz = dayTimezone(day, dests);
            const fixed = (fixedByDay[day] ?? []).sort((x, y) => (x.time ?? "").localeCompare(y.time ?? ""));
            const dragIds = items[day] ?? [];
            const slots = [
              ...dragIds.map((id) => ({ id, start: actById[id]?.time?.slice(0, 5) ?? evById[id]?.start_time?.slice(0, 5) ?? null, end: evById[id]?.end_time?.slice(0, 5) ?? null })),
              ...fixed.filter((f) => f.key.startsWith("tr:")).map((f) => ({ id: f.key, start: f.time, end: f.endTime })),
            ];
            const conflicts = conflictingIds(slots);
            const isLast = i === days.length - 1;
            return (
              <section key={day} onClick={() => setSelected(day)}
                className={cn("rounded-2xl border bg-card p-4 shadow-card transition-colors sm:p-5", selDay === day && "border-primary ring-1 ring-primary")}>
                <header className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">Dia {i + 1}</span>
                  <h3 className="text-lg font-semibold capitalize">{format(toDate(day)!, "EEE, dd/MM", { locale: ptBR })}</h3>
                  {dest && <span className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-3.5" />{dest.city}</span>}
                  {weather.get(day) && (() => { const w = weather.get(day)!; const { icon: WIcon, label } = weatherLabel(w.code); return (
                    <span title={`${label}${w.rain != null ? ` · chuva ${w.rain}%` : ""}`} className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">
                      <WIcon className="size-3.5 text-primary" aria-label={label} />{w.max}° <span className="text-muted-foreground">{w.min}°</span>
                    </span>
                  ); })()}
                  <div className="ml-auto flex items-center gap-1">
                    {stampByDay.get(day) && (() => { const s = stampByDay.get(day)!; return (
                      <Link to="/passaporte" aria-label={`Carimbo de ${s.main} no passaporte`} className="-my-4" onClick={(e) => e.stopPropagation()}>
                        <Stamp top={s.top} main={s.main} bottom={s.bottom} tone={s.tone} shape={s.shape} tilt={s.tilt} className="size-16" />
                      </Link>
                    ); })()}
                    {conflicts.size > 0 && <Pill tone="destructive"><AlertTriangle className="size-3" /> Conflito de horário</Pill>}
                    {!isLast && gaps.has(day) && <Pill tone="warning"><BedDouble className="size-3" /> Sem hospedagem</Pill>}
                  </div>
                </header>
                <div className="space-y-2">
                  <DayList id={day}>
                    <SortableContext items={dragIds} strategy={verticalListSortingStrategy}>
                      {interleave(fixed, dragIds, (id) => actById[id]?.time?.slice(0, 5) ?? evById[id]?.start_time?.slice(0, 5) ?? null).map((it) =>
                        it.kind === "fixed"
                          ? <FixedItem key={it.f.key} f={it.f} conflict={conflicts.has(it.f.key)} />
                          : renderDraggable(it.id, conflicts, tz))}
                    </SortableContext>
                  </DayList>
                  {!fixed.length && !dragIds.length && <p className="px-1 text-sm text-muted-foreground">Dia livre. Adicione um evento ou arraste algo da lista de desejos.</p>}
                </div>
                <Button variant="ghost" size="sm" className="mt-2" onClick={(e) => { e.stopPropagation(); setEditEv({ day, category: "activity" }); }}><Plus /> Evento</Button>
              </section>
            );
          })}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="font-semibold">Mapa · {selDay && format(toDate(selDay)!, "dd/MM")}</span>
              <span className="text-muted-foreground">{mapPoints.length} {mapPoints.length === 1 ? "ponto" : "pontos"}</span>
            </div>
            <div className="h-64 lg:h-72">
              {mapPoints.length ? (
                <Suspense fallback={<div className="h-full animate-pulse bg-muted" />}><DayMap points={mapPoints} /></Suspense>
              ) : (
                <div className="grid h-full place-items-center bg-muted/40 px-6 text-center text-sm text-muted-foreground">
                  Nenhum lugar com endereço neste dia. Preencha o local dos eventos, atividades ou hospedagens para vê-los no mapa.
                </div>
              )}
            </div>
          </div>
          <div className="rounded-2xl bg-secondary/60 p-4">
            <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground"><Heart className="size-4 text-caramelo" /> Lista de desejos</h3>
            <p className="mb-3 text-xs text-muted-foreground">Arraste para um dia do roteiro.</p>
            <DayList id={WISH}>
              <SortableContext items={items[WISH] ?? []} strategy={verticalListSortingStrategy}>
                {(items[WISH] ?? []).map((id) => renderDraggable(id, new Set(), ""))}
              </SortableContext>
              {!(items[WISH] ?? []).length && <p className="text-sm text-muted-foreground">Vazia. Atividades sem data aparecem aqui.</p>}
            </DayList>
          </div>
        </aside>
      </div>
      <DragOverlay>{activeId && <div className="rounded-xl border bg-card px-3 py-2 text-sm font-medium shadow-lift">{actById[activeId]?.name ?? evById[activeId]?.title}</div>}</DragOverlay>

      {editAc && <ActivityDialog trip={trip} row={editAc} onClose={() => setEditAc(null)} />}
      {editEv && (
        <EditDialog table="itinerary_events" tripId={trip.id} open onOpenChange={(o) => !o && setEditEv(null)} title={editEv.id ? "Editar evento" : "Novo evento"} initial={editEv}
          prepare={async (f) => withFx({ ...(await geocodeIfChanged(f, editEv)), currency: undefined }, trip.currency, f.cost ?? null).then(({ currency: _c, ...r }) => r)}>
          {(f, set) => (
            <>
              <TextF f={f} set={set} k="title" label="Título" className="sm:col-span-2" />
              <SelectF f={f} set={set} k="category" label="Categoria" options={EVENT_CATEGORIES} />
              <TextF f={f} set={set} k="day" label="Dia" type="date" />
              <TextF f={f} set={set} k="start_time" label="Início" type="time" />
              <TextF f={f} set={set} k="end_time" label="Fim" type="time" />
              <TextF f={f} set={set} k="location" label="Local" className="sm:col-span-2" />
              <MoneyF f={f} set={set} k="cost" label="Custo" currency={trip.currency} />
              <AreaF f={f} set={set} k="notes" label="Observações" className="sm:col-span-2" />
            </>
          )}
        </EditDialog>
      )}
    </DndContext>
  );
}

/**
 * One timeline per day: automatic items (flights, check-ins) slot in by time between the
 * user's own items, which keep their manual order. Untimed own items never pull a fixed one forward.
 */
function interleave(fixed: Fixed[], ids: string[], timeOf: (id: string) => string | null) {
  const out: ({ kind: "fixed"; f: Fixed } | { kind: "drag"; id: string })[] = [];
  let i = 0;
  for (const id of ids) {
    const t = timeOf(id);
    if (t) while (i < fixed.length && (fixed[i]!.time ?? "") <= t) out.push({ kind: "fixed", f: fixed[i++]! });
    out.push({ kind: "drag", id });
  }
  while (i < fixed.length) out.push({ kind: "fixed", f: fixed[i++]! });
  return out;
}

function DayList({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return <div ref={setNodeRef} className={cn("min-h-2 space-y-2 rounded-xl transition-colors", isOver && "bg-primary/5 outline-dashed outline-1 outline-primary/40")}>{children}</div>;
}

function Row({ icon: Icon, time, endTime, title, sub, notes, cost, badge, conflict, tone, handle }: any) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-12 shrink-0 pt-1 text-right font-mono text-xs text-muted-foreground">{time ?? "—"}{endTime && <><br />{endTime}</>}</span>
      <span className={cn("grid size-8 shrink-0 place-items-center rounded-full", tone === "primary" ? "bg-primary/10 text-primary" : tone === "success" ? "bg-success/15 text-success" : "bg-oliva/15 text-oliva")}>
        {Icon && <Icon className="size-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-3 break-words font-medium leading-snug">{title}</p>
        <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          {badge && <span>{badge}</span>}{sub && <span className="truncate">{sub}</span>}{cost && <span className="font-medium text-foreground">{cost}</span>}
          {conflict && <span className="font-semibold text-destructive">Conflito</span>}
        </p>
        {notes && <p className="mt-1 line-clamp-5 whitespace-pre-line break-words text-xs text-muted-foreground">{notes}</p>}
      </div>
      {handle}
    </div>
  );
}

function FixedItem({ f, conflict }: { f: Fixed; conflict: boolean }) {
  return (
    <div className={cn("rounded-xl border border-dashed bg-muted/40 px-3 py-2", conflict && "border-destructive")}>
      <Row icon={f.icon} time={f.time} endTime={f.endTime} title={f.title} sub={f.sub} tone={f.tone} conflict={conflict} />
    </div>
  );
}

function SortableItem({ id, onClick, conflict, ...p }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} {...attributes} {...listeners}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cn("cursor-grab touch-manipulation rounded-xl border bg-background px-3 py-2 hover:border-primary/50", isDragging && "opacity-40", conflict && "border-destructive")}>
      <Row {...p} conflict={conflict} tone="accent" handle={<GripVertical className="mt-1 size-4 shrink-0 text-muted-foreground" />} />
    </div>
  );
}
