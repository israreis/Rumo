import { useQueryClient } from "@tanstack/react-query";
import { Paperclip, Trash2, Upload } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CURRENCIES } from "@/lib/trip-utils";
import { deleteRow, saveRow, type PlanTable } from "@/lib/plan-api";
import { uploadImage } from "@/lib/trips-api";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Form = any;
export type Setter = (k: string, v: any) => void;

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string | undefined }) {
  return <div className={cn("space-y-1.5", className)}><Label className="text-xs text-muted-foreground">{label}</Label>{children}</div>;
}
export function TextF({ f, set, k, label, type = "text", className, placeholder, list }: { f: Form; set: Setter; k: string; label: string; type?: string; className?: string | undefined; placeholder?: string; list?: string }) {
  return (
    <Field label={label} className={className}>
      <Input type={type} list={list} placeholder={placeholder} value={f[k] ?? ""} step={type === "number" ? "0.01" : undefined}
        onChange={(e) => set(k, type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value)} />
    </Field>
  );
}
export function AreaF({ f, set, k, label, className, rows = 2 }: { f: Form; set: Setter; k: string; label: string; className?: string | undefined; rows?: number }) {
  return <Field label={label} className={className}><Textarea rows={rows} value={f[k] ?? ""} onChange={(e) => set(k, e.target.value)} /></Field>;
}
export function SelectF({ f, set, k, label, options, className }: { f: Form; set: Setter; k: string; label: string; options: Record<string, string>; className?: string | undefined }) {
  return (
    <Field label={label} className={className}>
      <Select value={f[k] ?? ""} onValueChange={(v) => set(k, v)}>
        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
        <SelectContent>{Object.entries(options).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
      </Select>
    </Field>
  );
}
export function CurrencyF({ f, set, className }: { f: Form; set: Setter; className?: string | undefined }) {
  return <SelectF f={f} set={set} k="currency" label="Moeda" className={className} options={Object.fromEntries(CURRENCIES.map((c) => [c, c]))} />;
}

export function AttachmentF({ f, set, k = "attachment_url", label = "Anexo" }: { f: Form; set: Setter; k?: string; label?: string }) {
  const [busy, setBusy] = useState(false);
  async function onFile(file?: File) {
    if (!file) return;
    setBusy(true);
    try { set(k, await uploadImage(file, "attachments")); } catch { toast.error("Falha ao enviar o arquivo."); } finally { setBusy(false); }
  }
  return (
    <Field label={label} className="sm:col-span-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" asChild>
          <label className="cursor-pointer"><Upload /> {busy ? "Enviando…" : f[k] ? "Trocar arquivo" : "Enviar arquivo"}
            <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
        </Button>
        {f[k] && <>
          <a href={f[k]} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline"><Paperclip className="size-3.5" /> Ver anexo</a>
          <Button type="button" variant="ghost" size="sm" onClick={() => set(k, null)}>Remover</Button>
        </>}
      </div>
    </Field>
  );
}

export function AttachmentLink({ url }: { url: string | null }) {
  if (!url) return null;
  return <a href={url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-xs text-primary hover:underline"><Paperclip className="size-3" /> Anexo</a>;
}

/** Dialog that edits one row of a plan table; `prepare` can enrich the row (e.g. geocode) before saving. */
export function EditDialog({ table, tripId, open, onOpenChange, title, initial, children, prepare }: {
  table: PlanTable; tripId: string; open: boolean; onOpenChange: (o: boolean) => void; title: string; initial: Form;
  children: (f: Form, set: Setter) => ReactNode; prepare?: (f: Form) => Promise<Form> | Form;
}) {
  const [f, setF] = useState<Form>(initial);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const set: Setter = (k, v) => setF((p: Form) => ({ ...p, [k]: v }));
  const done = () => { qc.invalidateQueries({ queryKey: ["plan", table, tripId] }); onOpenChange(false); };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const row = prepare ? await prepare(f) : f;
      const { created_at: _c, ...rest } = row;
      await saveRow(table, { ...rest, trip_id: tripId });
      toast.success("Salvo");
      done();
    } catch (err: any) {
      toast.error(err?.message ? `Não foi possível salvar: ${err.message}` : "Não foi possível salvar.");
    } finally { setSaving(false); }
  }
  async function remove() {
    if (!confirm("Excluir este item?")) return;
    await deleteRow(table, f.id);
    toast.success("Excluído");
    done();
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle className="font-display text-2xl">{title}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">{children(f, set)}</div>
          <DialogFooter className="gap-2 sm:justify-between">
            {f.id ? <Button type="button" variant="ghost" className="text-destructive" onClick={remove}><Trash2 /> Excluir</Button> : <span />}
            <Button type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Small hook to manage which row (or a new one) is open in the edit dialog. */
export function useEditor() {
  const [editing, setEditing] = useState<Form | null>(null);
  return { editing, open: (row: Form) => setEditing(row), close: () => setEditing(null) };
}

export function Pill({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "primary" | "accent" | "success" | "warning" | "destructive" }) {
  const tones = {
    muted: "bg-muted text-muted-foreground", primary: "bg-primary/10 text-primary", accent: "bg-accent/15 text-accent",
    success: "bg-success/15 text-success", warning: "bg-warning/20 text-foreground", destructive: "bg-destructive/15 text-destructive",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", tones[tone])}>{children}</span>;
}

/* ---------- Money & exchange ---------- */
import { useEffect as _useEffect, useRef as _useRef } from "react";
import { convert, fetchRate } from "@/lib/fx";
import { formatMoney as _fm } from "@/lib/trip-utils";
import { RefreshCw } from "lucide-react";

/** Original value plus the trip-currency equivalent when currencies differ. */
export function Money({ amount, currency, converted, trip, className }: { amount: number | null | undefined; currency: string; converted?: number | null | undefined; trip: string; className?: string | undefined }) {
  if (amount == null) return null;
  return (
    <span className={className}>
      {_fm(amount, currency)}
      {currency !== trip && <span className="ml-1 font-normal text-muted-foreground">{converted != null ? `(≈ ${_fm(converted, trip)})` : "(sem cotação)"}</span>}
    </span>
  );
}

/** Stores rate + converted value; fetches the rate only when missing (rate is frozen afterwards). */
export async function withFx(f: Form, tripCurrency: string, total: number | null, feesPct = 0) {
  const cur = f.currency ?? tripCurrency;
  let rate = f.fx_rate ? Number(f.fx_rate) : null;
  if (cur === tripCurrency) rate = 1;
  else if (!rate) {
    rate = await fetchRate(cur, tripCurrency);
    if (!rate) throw new Error(`cotação ${cur}→${tripCurrency} indisponível, informe manualmente`);
  }
  return { ...f, fx_rate: rate, converted_amount: total == null ? null : convert(total, rate, feesPct) };
}

export function FxF({ f, set, trip }: { f: Form; set: Setter; trip: string }) {
  const cur = f.currency ?? trip;
  const first = _useRef(true);
  _useEffect(() => {
    if (first.current) { first.current = false; return; }
    set("fx_rate", null);
  }, [cur]);
  if (cur === trip) return null;
  return (
    <Field label={`Cotação: 1 ${cur} = ? ${trip}`}>
      <div className="flex gap-2">
        <Input type="number" step="0.0001" placeholder="Automática ao salvar" value={f.fx_rate ?? ""} onChange={(e) => set("fx_rate", e.target.value === "" ? null : Number(e.target.value))} />
        <Button type="button" variant="outline" size="icon" aria-label="Buscar cotação" onClick={async () => {
          const r = await fetchRate(cur, trip);
          if (r) set("fx_rate", r); else toast.error("Cotação indisponível para essa moeda. Informe manualmente.");
        }}><RefreshCw /></Button>
      </div>
    </Field>
  );
}

export const PAY_STATUS: Record<string, string> = { pending: "Pendente", deposit: "Sinal pago", paid: "Pago" };

export function PaymentFields({ f, set }: { f: Form; set: Setter }) {
  return (
    <>
      <TextF f={f} set={set} k="due_date" label="Vencimento" type="date" />
      <TextF f={f} set={set} k="installments" label="Parcelas no cartão" type="number" />
      {Number(f.installments) > 1 && (
        <Field label="Mês da 1ª parcela">
          <Input type="month" value={f.first_installment_month?.slice(0, 7) ?? ""} onChange={(e) => set("first_installment_month", e.target.value ? `${e.target.value}-01` : null)} />
        </Field>
      )}
    </>
  );
}
