import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Clock, ExternalLink, Plane, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { planQuery, PAYMENT_STATUS, TRANSPORT_TYPES, type Transport } from "@/lib/plan-api";
import { allTimezones, BROWSER_TZ, durationLabel, formatZoned, utcToZoned, zonedToUtc } from "@/lib/tz";
import type { Trip } from "@/lib/trips-api";
import { AttachmentF, AttachmentLink, CurrencyF, EditDialog, Field, FxF, Money, PaymentFields, Pill, SelectF, TextF, useEditor, withFx, type Form } from "./common";
import { TRANSPORT_ICON } from "./icons";
import { Input } from "@/components/ui/input";

const PAY_TONE = { pending: "warning", deposit: "primary", paid: "success" } as const;

export function TransportTab({ trip }: { trip: Trip }) {
  const { data = [] } = useQuery(planQuery<Transport>("transports", trip.id));
  const ed = useEditor();
  const defTz = trip.trip_destinations[0]?.timezone || BROWSER_TZ;
  const openRow = (t?: Transport) =>
    ed.open(t ? {
      ...t,
      dep_local: t.departure_at ? utcToZoned(t.departure_at, t.departure_tz || BROWSER_TZ) : "",
      arr_local: t.arrival_at ? utcToZoned(t.arrival_at, t.arrival_tz || BROWSER_TZ) : "",
    } : { type: "flight", currency: trip.currency, payment_status: "pending", departure_tz: BROWSER_TZ, arrival_tz: defTz });

  return (
    <div>
      <datalist id="tz-list">{allTimezones().map((z) => <option key={z} value={z} />)}</datalist>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-semibold">Transporte</h2>
        <Button onClick={() => openRow()}><Plus /> Adicionar trecho</Button>
      </div>
      {!data.length ? (
        <EmptyState icon={Plane} title="Nenhum trecho cadastrado" text="Adicione voos, trens, ônibus ou carro alugado. A duração é calculada considerando os fusos horários."
          action={<Button onClick={() => openRow()}><Plus /> Adicionar trecho</Button>} />
      ) : (
        <div className="space-y-3">
          {data.map((t) => {
            const Icon = TRANSPORT_ICON[t.type] ?? Plane;
            const dur = durationLabel(t.departure_at, t.arrival_at);
            return (
              <button key={t.id} onClick={() => openRow(t)} className="group relative grid w-full overflow-hidden rounded-[14px] bg-card text-left shadow-card transition-shadow hover:shadow-lift grid-cols-1 sm:grid-cols-[minmax(0,1fr)_11rem]">
                {/* Ticket body */}
                <div className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary"><Icon className="size-4" strokeWidth={1.5} /></span>
                    <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{TRANSPORT_TYPES[t.type]}{t.company && ` · ${t.company}`}</span>
                    <span className="ml-auto sm:hidden"><Pill tone={PAY_TONE[t.payment_status as keyof typeof PAY_TONE] ?? "muted"}>{PAYMENT_STATUS[t.payment_status]}</Pill></span>
                  </div>
                  <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className="min-w-0"><p className="truncate font-display text-xl">{t.origin || "—"}</p><p className="font-num text-xs text-muted-foreground">{formatZoned(t.departure_at, t.departure_tz)}</p></div>
                    <div className="flex w-16 flex-col items-center text-xs text-muted-foreground sm:w-28">
                      <div className="relative w-full border-t-[1.5px] border-dashed border-latao"><ArrowRight className="absolute -top-2 left-1/2 size-4 -translate-x-1/2 bg-card px-0.5 text-latao" /></div>
                      {dur && <span className="mt-2 flex items-center gap-1 font-num"><Clock className="size-3" />{dur}</span>}
                    </div>
                    <div className="min-w-0 text-right"><p className="truncate font-display text-xl">{t.destination || "—"}</p><p className="font-num text-xs text-muted-foreground">{formatZoned(t.arrival_at, t.arrival_tz)}</p></div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {t.code && <span>Voo/trecho <strong className="font-num text-foreground">{t.code}</strong></span>}
                    {t.seat && <span>Assento <strong className="font-num text-foreground">{t.seat}</strong></span>}
                    {t.class && <span>{t.class}</span>}
                    {t.baggage && <span>Bagagem: {t.baggage}</span>}
                    {t.booking_url && <a href={t.booking_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-primary hover:underline"><ExternalLink className="size-3" /> Reserva</a>}
                    <AttachmentLink url={t.attachment_url} />
                  </div>
                </div>
                {/* Stub, separated by the perforation */}
                <div className="relative flex flex-row items-center justify-between gap-3 border-t-[1.5px] border-dashed border-border px-4 py-3 sm:flex-col sm:items-start sm:justify-between sm:border-l-[1.5px] sm:border-t-0 sm:p-5">
                  <span aria-hidden className="absolute -left-2.5 -top-2.5 size-5 rounded-full bg-background sm:-left-2.5 sm:-top-2.5" />
                  <span aria-hidden className="absolute -right-2.5 -top-2.5 size-5 rounded-full bg-background sm:-bottom-2.5 sm:-left-2.5 sm:right-auto sm:top-auto" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Localizador</p>
                    <p className="font-num text-base font-medium tracking-wider">{t.locator || "—"}</p>
                  </div>
                  <span className="hidden sm:block"><Pill tone={PAY_TONE[t.payment_status as keyof typeof PAY_TONE] ?? "muted"}>{PAYMENT_STATUS[t.payment_status]}</Pill></span>
                  <div className="text-right sm:text-left">
                    {t.price != null && <Money className="block text-base font-medium text-foreground" amount={t.price} currency={t.currency} converted={t.converted_amount} trip={trip.currency} />}
                    {t.installments > 1 && <span className="text-xs text-muted-foreground">{t.installments}× no cartão</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
      {ed.editing && (
        <EditDialog table="transports" tripId={trip.id} open onOpenChange={(o) => !o && ed.close()} title={ed.editing.id ? "Editar trecho" : "Novo trecho"} initial={ed.editing}
          prepare={(f: Form) => {
            const { dep_local, arr_local, ...r } = f;
            return withFx({
              ...r,
              departure_at: dep_local ? zonedToUtc(dep_local, r.departure_tz || BROWSER_TZ) : null,
              arrival_at: arr_local ? zonedToUtc(arr_local, r.arrival_tz || BROWSER_TZ) : null,
            }, trip.currency, r.price ?? null);
          }}>
          {(f, set) => (
            <>
              <SelectF f={f} set={set} k="type" label="Tipo" options={TRANSPORT_TYPES} />
              <TextF f={f} set={set} k="company" label="Companhia" />
              <TextF f={f} set={set} k="origin" label="Origem" />
              <TextF f={f} set={set} k="destination" label="Destino" />
              <Field label="Partida (hora local)"><Input type="datetime-local" value={f.dep_local ?? ""} onChange={(e) => set("dep_local", e.target.value)} /></Field>
              <TextF f={f} set={set} k="departure_tz" label="Fuso da partida" list="tz-list" />
              <Field label="Chegada (hora local)"><Input type="datetime-local" value={f.arr_local ?? ""} onChange={(e) => set("arr_local", e.target.value)} /></Field>
              <TextF f={f} set={set} k="arrival_tz" label="Fuso da chegada" list="tz-list" />
              {f.dep_local && f.arr_local && (
                <p className="text-sm text-muted-foreground sm:col-span-2">
                  Duração: <strong className="text-foreground">{durationLabel(zonedToUtc(f.dep_local, f.departure_tz || BROWSER_TZ), zonedToUtc(f.arr_local, f.arrival_tz || BROWSER_TZ)) ?? "chegada antes da partida"}</strong>
                </p>
              )}
              <TextF f={f} set={set} k="code" label="Nº do voo / trecho" />
              <TextF f={f} set={set} k="locator" label="Localizador" />
              <TextF f={f} set={set} k="seat" label="Assento" />
              <TextF f={f} set={set} k="class" label="Classe" />
              <TextF f={f} set={set} k="baggage" label="Bagagem incluída" className="sm:col-span-2" />
              <TextF f={f} set={set} k="price" label="Valor" type="number" />
              <CurrencyF f={f} set={set} />
              <FxF f={f} set={set} trip={trip.currency} />
              <SelectF f={f} set={set} k="payment_status" label="Pagamento" options={PAYMENT_STATUS} />
              <PaymentFields f={f} set={set} />
              <TextF f={f} set={set} k="booking_url" label="Link da reserva" type="url" />
              <AttachmentF f={f} set={set} label="Bilhete / cartão de embarque" />
            </>
          )}
        </EditDialog>
      )}
    </div>
  );
}
