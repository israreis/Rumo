import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle, ExternalLink, Heart, MapPin, Plus, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { ACTIVITY_CATEGORIES, geocode, planQuery, PRIORITIES, type Activity } from "@/lib/plan-api";
import { formatDate, formatMoney } from "@/lib/trip-utils";
import type { Trip } from "@/lib/trips-api";
import { Switch } from "@/components/ui/switch";
import { AttachmentF, AttachmentLink, CurrencyF, EditDialog, MoneyF, Field, FxF, Money, PaymentFields, Pill, SelectF, TextF, useEditor, withFx, type Form } from "./common";
import { ACTIVITY_ICON } from "./icons";

export const activityTotal = (a: Pick<Activity, "unit_price" | "quantity">) => (a.unit_price ?? 0) * (a.quantity ?? 1);

export async function geocodeIfChanged(f: Form, orig: Form, key = "location") {
  if (f[key] && (f.lat == null || f[key] !== orig[key])) {
    const g = await geocode(f[key]);
    return { ...f, lat: g?.lat ?? null, lng: g?.lng ?? null };
  }
  return f;
}

export function ActivityDialog({ trip, row, onClose }: { trip: Trip; row: Form; onClose: () => void }) {
  return (
    <EditDialog table="activities" tripId={trip.id} open onOpenChange={(o) => !o && onClose()} title={row.id ? "Editar atividade" : "Nova atividade"} initial={row}
      prepare={async (f) => { const r = await geocodeIfChanged(f, row); return withFx(r, trip.currency, r.unit_price == null ? null : activityTotal(r)); }}>
      {(f, set) => (
        <>
          <TextF f={f} set={set} k="name" label="Nome" className="sm:col-span-2" />
          <SelectF f={f} set={set} k="category" label="Categoria" options={ACTIVITY_CATEGORIES} />
          <SelectF f={f} set={set} k="priority" label="Prioridade" options={PRIORITIES} />
          <TextF f={f} set={set} k="date" label="Data (vazio = lista de desejos)" type="date" />
          <TextF f={f} set={set} k="time" label="Horário" type="time" />
          <TextF f={f} set={set} k="location" label="Local / endereço" className="sm:col-span-2" />
          <MoneyF f={f} set={set} k="unit_price" label="Valor unitário" />
          <TextF f={f} set={set} k="quantity" label="Quantidade" type="number" />
          <CurrencyF f={f} set={set} />
          <Field label="Total"><p className="flex h-9 items-center font-semibold">{formatMoney(activityTotal(f as any), f.currency)}</p></Field>
          <FxF f={f} set={set} trip={trip.currency} />
          <PaymentFields f={f} set={set} />
          <Field label="Comprado"><div className="flex h-9 items-center gap-2"><Switch checked={!!f.purchased} onCheckedChange={(v) => set("purchased", v)} /> {f.purchased ? "Sim" : "Não"}</div></Field>
          <TextF f={f} set={set} k="purchase_url" label="Link de compra" type="url" />
          <AttachmentF f={f} set={set} label="Ingresso / QR code" />
        </>
      )}
    </EditDialog>
  );
}

function ActivityCard({ a, onClick, trip }: { a: Activity; onClick: () => void; trip: string }) {
  const Icon = ACTIVITY_ICON[a.category] ?? Ticket;
  return (
    <button onClick={onClick} className="flex w-full gap-3 rounded-2xl border bg-card p-4 text-left shadow-card transition-shadow hover:shadow-lift">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-oliva/15 text-oliva"><Icon className="size-4" /></span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">{a.name}</h3>
          <Pill tone={a.priority === "must" ? "accent" : "muted"}>{PRIORITIES[a.priority]}</Pill>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{ACTIVITY_CATEGORIES[a.category]}{a.date && ` · ${formatDate(a.date)}`}{a.time && ` ${a.time.slice(0, 5)}`}</p>
        {a.location && <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground"><MapPin className="size-3" />{a.location}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="inline-flex items-center gap-1">{a.purchased ? <CheckCircle2 className="size-3.5 text-success" /> : <Circle className="size-3.5 text-muted-foreground" />}{a.purchased ? "Comprado" : "Não comprado"}</span>
          {a.unit_price != null && <span className="font-medium"><Money amount={activityTotal(a)} currency={a.currency} converted={a.converted_amount} trip={trip} /> {a.quantity > 1 && <span className="text-muted-foreground">({a.quantity}×)</span>}</span>}
          {a.purchase_url && <a href={a.purchase_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-primary hover:underline"><ExternalLink className="size-3" /> Comprar</a>}
          <AttachmentLink url={a.attachment_url} />
        </div>
      </div>
    </button>
  );
}

export function ActivitiesTab({ trip }: { trip: Trip }) {
  const { data = [] } = useQuery(planQuery<Activity>("activities", trip.id));
  const ed = useEditor();
  const dated = data.filter((a) => a.date).sort((a, b) => (a.date! + (a.time ?? "")).localeCompare(b.date! + (b.time ?? "")));
  const wish = data.filter((a) => !a.date);
  const openNew = (date?: string) => ed.open({ category: "attraction", priority: "must", quantity: trip.travelers_count, currency: trip.currency, purchased: false, date: date ?? null });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-semibold">Atividades e ingressos</h2>
        <Button onClick={() => openNew()}><Plus /> Adicionar</Button>
      </div>
      {!data.length ? (
        <EmptyState icon={Ticket} title="Nenhuma atividade" text="Adicione atrações, passeios, museus, shows e restaurantes. Sem data, eles vão para a lista de desejos." action={<Button onClick={() => openNew()}><Plus /> Adicionar atividade</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Agendadas</h3>
            {dated.length ? <div className="space-y-3">{dated.map((a) => <ActivityCard key={a.id} a={a} trip={trip.currency} onClick={() => ed.open(a)} />)}</div>
              : <p className="text-sm text-muted-foreground">Nada agendado. Dê uma data a um item da lista de desejos.</p>}
          </section>
          <section className="rounded-2xl bg-secondary/60 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground"><Heart className="size-4 text-caramelo" /> Lista de desejos</h3>
            {wish.length ? <div className="space-y-3">{wish.map((a) => <ActivityCard key={a.id} a={a} trip={trip.currency} onClick={() => ed.open(a)} />)}</div>
              : <p className="text-sm text-muted-foreground">Ideias sem data aparecem aqui.</p>}
          </section>
        </div>
      )}
      {ed.editing && <ActivityDialog trip={trip} row={ed.editing} onClose={ed.close} />}
    </div>
  );
}
