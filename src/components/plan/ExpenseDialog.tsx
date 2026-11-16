import { Camera } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { BUDGET_CATEGORIES, PAYMENT_METHODS } from "@/lib/budget";
import { convert, feesFor } from "@/lib/fx";
import { destinationForDay } from "@/lib/itinerary";
import { formatMoney } from "@/lib/trip-utils";
import { uploadImage, type Trip } from "@/lib/trips-api";
import { enqueueExpense } from "@/lib/offline-queue";
import { CurrencyF, EditDialog, Field, FxF, SelectF, TextF, withFx, type Form } from "./common";

const SPLIT = { equal: "Igual", amount: "Por valor", percent: "Por percentual" };

export function newExpense(trip: Trip): Form {
  const today = new Date().toISOString().slice(0, 10);
  const cur = destinationForDay(today, trip.trip_destinations)?.currency || trip.currency;
  return {
    currency: cur, category: "food", payment_method: "credit", date: today, split_mode: "equal",
    paid_by: trip.trip_travelers[0]?.id ?? null, splits: trip.trip_travelers.map((t) => ({ traveler_id: t.id, value: 0 })),
  };
}

export function ExpenseDialog({ trip, row, onClose }: { trip: Trip; row: Form; onClose: () => void }) {
  const fees = (f: Form) => feesFor(f.currency, trip.currency, f.payment_method, Number(trip.iof_pct), Number(trip.card_spread_pct));
  return (
    <EditDialog table="expenses" tripId={trip.id} open onOpenChange={(o) => !o && onClose()} title={row.id ? "Editar gasto" : "Novo gasto"} initial={row}
      onOfflineSave={(f) => {
        if (!f.amount) throw new Error("informe o valor");
        enqueueExpense({ tripId: trip.id, tripCurrency: trip.currency, iofPct: Number(trip.iof_pct), spreadPct: Number(trip.card_spread_pct), row: f });
      }}
      prepare={async (f) => {
        if (!f.amount) throw new Error("informe o valor");
        const fp = fees(f);
        const r = await withFx(f, trip.currency, Number(f.amount), fp);
        return { ...r, fees_pct: fp };
      }}>
      {(f, set) => <ExpenseFields trip={trip} f={f} set={set} fees={fees(f)} />}
    </EditDialog>
  );
}

function ExpenseFields({ trip, f, set, fees }: { trip: Trip; f: Form; set: (k: string, v: any) => void; fees: number }) {
  const [up, setUp] = useState(false);
  const splits: { traveler_id: string; value: number }[] = f.splits ?? [];
  const has = (id: string) => splits.some((s) => s.traveler_id === id);
  const toggle = (id: string, on: boolean) => set("splits", on ? [...splits, { traveler_id: id, value: 0 }] : splits.filter((s) => s.traveler_id !== id));
  const setVal = (id: string, v: number) => set("splits", splits.map((s) => (s.traveler_id === id ? { ...s, value: v } : s)));
  const preview = f.amount && (f.currency === trip.currency || f.fx_rate) ? convert(Number(f.amount), f.currency === trip.currency ? 1 : Number(f.fx_rate), fees) : null;
  const travelerMap = Object.fromEntries(trip.trip_travelers.map((t) => [t.id!, t.name]));
  const sumVals = splits.reduce((a, s) => a + (Number(s.value) || 0), 0);

  return (
    <>
      <Field label="Valor" className="sm:col-span-1">
        <Input autoFocus inputMode="decimal" type="number" step="0.01" className="font-num h-12 text-2xl font-semibold" value={f.amount ?? ""} onChange={(e) => set("amount", e.target.value === "" ? null : Number(e.target.value))} />
      </Field>
      <CurrencyF f={f} set={set} />
      <FxF f={f} set={set} trip={trip.currency} />
      {f.currency !== trip.currency && (
        <p className="text-sm text-muted-foreground sm:col-span-2">
          {preview != null ? <>≈ <strong className="text-foreground">{formatMoney(preview, trip.currency)}</strong></> : "Cotação buscada ao salvar"}
          {fees > 0 && ` · inclui ${fees.toLocaleString("pt-BR")}% de IOF + spread`}
        </p>
      )}
      <SelectF f={f} set={set} k="category" label="Categoria" options={BUDGET_CATEGORIES} />
      <SelectF f={f} set={set} k="payment_method" label="Forma de pagamento" options={PAYMENT_METHODS} />
      <TextF f={f} set={set} k="date" label="Data" type="date" />
      <TextF f={f} set={set} k="description" label="Descrição" />
      <Field label="Recibo" className="sm:col-span-2">
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" asChild>
            <label className="cursor-pointer"><Camera /> {up ? "Enviando…" : f.receipt_url ? "Trocar foto" : "Foto do recibo"}
              <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={async (e) => {
                const file = e.target.files?.[0]; if (!file) return;
                setUp(true);
                try { set("receipt_url", await uploadImage(file, "receipts")); } catch { toast.error("Falha ao enviar."); } finally { setUp(false); }
              }} />
            </label>
          </Button>
          {f.receipt_url && <img src={f.receipt_url} alt="Recibo" className="size-12 rounded-md object-cover" />}
        </div>
      </Field>
      {trip.trip_travelers.length > 1 && (
        <div className="space-y-3 rounded-xl border bg-muted/40 p-3 sm:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectF f={f} set={set} k="paid_by" label="Quem pagou" options={travelerMap} />
            <SelectF f={f} set={set} k="split_mode" label="Dividir" options={SPLIT} />
          </div>
          <div className="space-y-2">
            {trip.trip_travelers.map((t) => (
              <div key={t.id} className="flex items-center gap-3">
                <Checkbox id={`sp-${t.id}`} checked={has(t.id!)} onCheckedChange={(v) => toggle(t.id!, !!v)} />
                <label htmlFor={`sp-${t.id}`} className="flex-1 text-sm">{t.name}</label>
                {f.split_mode !== "equal" && has(t.id!) && (
                  <Input type="number" step="0.01" className="h-8 w-28" value={splits.find((s) => s.traveler_id === t.id)?.value ?? 0}
                    onChange={(e) => setVal(t.id!, Number(e.target.value) || 0)} />
                )}
              </div>
            ))}
            {f.split_mode === "percent" && Math.abs(sumVals - 100) > 0.01 && <p className="text-xs text-destructive">Os percentuais somam {sumVals}% (devem somar 100%).</p>}
            {f.split_mode === "amount" && f.amount && Math.abs(sumVals - Number(f.amount)) > 0.01 && <p className="text-xs text-destructive">Os valores somam {formatMoney(sumVals, f.currency)} de {formatMoney(Number(f.amount), f.currency)}.</p>}
          </div>
        </div>
      )}
    </>
  );
}
