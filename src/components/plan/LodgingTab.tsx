import { useQuery } from "@tanstack/react-query";
import { differenceInCalendarDays } from "date-fns";
import { AlertTriangle, BedDouble, CalendarClock, MapPin, Phone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { geocode, LODGING_TYPES, planQuery, type Lodging, type Transport } from "@/lib/plan-api";
import { nightsWithoutLodging } from "@/lib/itinerary";
import { formatDate, formatMoney, toDate } from "@/lib/trip-utils";
import type { Trip } from "@/lib/trips-api";
import { AreaF, AttachmentF, AttachmentLink, CurrencyF, EditDialog, MoneyF, FxF, Money, PAY_STATUS, PaymentFields, Pill, SelectF, TextF, useEditor, withFx, type Form } from "./common";

export function nightsOf(l: { check_in_date: string | null; check_out_date: string | null }) {
  const a = toDate(l.check_in_date), b = toDate(l.check_out_date);
  return a && b ? Math.max(0, differenceInCalendarDays(b, a)) : 0;
}
export function lodgingTotal(l: Pick<Lodging, "nightly_rate" | "total" | "tourist_tax" | "cleaning_fee" | "check_in_date" | "check_out_date">) {
  const base = l.total ?? (l.nightly_rate ?? 0) * nightsOf(l);
  return base + (l.tourist_tax ?? 0) + (l.cleaning_fee ?? 0);
}

export function LodgingTab({ trip }: { trip: Trip }) {
  const { data = [] } = useQuery(planQuery<Lodging>("lodgings", trip.id));
  const ed = useEditor();
  const { data: transports = [] } = useQuery(planQuery<Transport>("transports", trip.id));
  const gaps = nightsWithoutLodging(trip.start_date, trip.end_date, data, transports);
  const openNew = () => ed.open({ type: "hotel", currency: trip.currency, check_in_time: "15:00", check_out_time: "11:00" });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-semibold">Hospedagem</h2>
        <Button onClick={openNew}><Plus /> Adicionar</Button>
      </div>
      {gaps.length > 0 && data.length > 0 && (
        <div className="mb-4 flex gap-2 rounded-xl border border-warning/50 bg-warning/10 p-3 text-sm">
          <AlertTriangle className="size-4 shrink-0 text-warning" />
          <span>{gaps.length} {gaps.length === 1 ? "noite" : "noites"} sem hospedagem: {gaps.map(formatDate).join(", ")}</span>
        </div>
      )}
      {!data.length ? (
        <EmptyState icon={BedDouble} title="Nenhuma hospedagem" text="Cadastre hotéis e apartamentos com check-in, check-out e política de cancelamento." action={<Button onClick={openNew}><Plus /> Adicionar hospedagem</Button>} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data.map((l) => {
            const n = nightsOf(l);
            const freeCancel = l.free_cancel_until && l.free_cancel_until >= new Date().toISOString().slice(0, 10);
            return (
              <button key={l.id} onClick={() => ed.open(l)} className="rounded-2xl border bg-card p-5 text-left shadow-card transition-shadow hover:shadow-lift">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Pill tone="primary">{LODGING_TYPES[l.type]}</Pill>
                    <h3 className="mt-2 text-lg font-semibold">{l.name}</h3>
                    {l.address && <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-3.5" />{l.address}</p>}
                  </div>
                  <div className="text-right"><p className="font-display text-2xl font-semibold">{n}</p><p className="text-xs text-muted-foreground">{n === 1 ? "noite" : "noites"}</p></div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-muted/60 p-3 text-sm">
                  <div><p className="text-xs text-muted-foreground">Check-in</p><p className="font-medium">{formatDate(l.check_in_date)} {l.check_in_time?.slice(0, 5)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Check-out</p><p className="font-medium">{formatDate(l.check_out_date)} {l.check_out_time?.slice(0, 5)}</p></div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {l.nightly_rate != null && <span>{formatMoney(l.nightly_rate, l.currency)}/noite</span>}
                  <span className="font-semibold text-foreground">Total <Money amount={lodgingTotal(l)} currency={l.currency} converted={l.converted_amount} trip={trip.currency} /></span><span>{PAY_STATUS[l.payment_status]}</span>
                  {l.booking_code && <span>Reserva <strong className="text-foreground">{l.booking_code}</strong></span>}
                  {l.contact && <span className="inline-flex items-center gap-1"><Phone className="size-3" />{l.contact}</span>}
                  <AttachmentLink url={l.attachment_url} />
                </div>
                {l.free_cancel_until && (
                  <p className="mt-2 flex items-center gap-1 text-xs"><CalendarClock className="size-3.5" />
                    <span className={freeCancel ? "text-success" : "text-muted-foreground"}>Cancelamento grátis até {formatDate(l.free_cancel_until)}</span>
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}
      {ed.editing && (
        <EditDialog table="lodgings" tripId={trip.id} open onOpenChange={(o) => !o && ed.close()} title={ed.editing.id ? "Editar hospedagem" : "Nova hospedagem"} initial={ed.editing}
          prepare={async (f: Form) => {
            const orig = ed.editing!;
            let r = f;
            if (f.address && (f.lat == null || f.address !== orig.address)) {
              const g = await geocode(f.address);
              r = { ...f, lat: g?.lat ?? null, lng: g?.lng ?? null };
            }
            return withFx(r, trip.currency, lodgingTotal(r));
          }}>
          {(f, set) => {
            const n = nightsOf(f as any);
            return (
              <>
                <TextF f={f} set={set} k="name" label="Nome" />
                <SelectF f={f} set={set} k="type" label="Tipo" options={LODGING_TYPES} />
                <TextF f={f} set={set} k="address" label="Endereço" className="sm:col-span-2" />
                <TextF f={f} set={set} k="check_in_date" label="Check-in" type="date" />
                <TextF f={f} set={set} k="check_in_time" label="Horário do check-in" type="time" />
                <TextF f={f} set={set} k="check_out_date" label="Check-out" type="date" />
                <TextF f={f} set={set} k="check_out_time" label="Horário do check-out" type="time" />
                <MoneyF f={f} set={set} k="nightly_rate" label="Valor por noite" />
                <MoneyF f={f} set={set} k="total" label={`Total (${n} ${n === 1 ? "noite" : "noites"}) — vazio = calcular`} placeholder={f.nightly_rate ? (f.nightly_rate * n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0,00"} />
                <MoneyF f={f} set={set} k="tourist_tax" label="Taxa turística" />
                <MoneyF f={f} set={set} k="cleaning_fee" label="Taxa de limpeza" />
                <CurrencyF f={f} set={set} />
                <FxF f={f} set={set} trip={trip.currency} />
                <SelectF f={f} set={set} k="payment_status" label="Pagamento" options={PAY_STATUS} />
                <PaymentFields f={f} set={set} />
                <TextF f={f} set={set} k="free_cancel_until" label="Cancelamento grátis até" type="date" />
                <AreaF f={f} set={set} k="cancellation_policy" label="Política de cancelamento" className="sm:col-span-2" />
                <TextF f={f} set={set} k="booking_code" label="Código de reserva" />
                <TextF f={f} set={set} k="contact" label="Telefone / contato" />
                <AttachmentF f={f} set={set} label="Comprovante" />
                <p className="text-sm text-muted-foreground sm:col-span-2">Total com taxas: <strong className="text-foreground">{formatMoney(lodgingTotal(f as any), f.currency)}</strong></p>
              </>
            );
          }}
        </EditDialog>
      )}
    </div>
  );
}
