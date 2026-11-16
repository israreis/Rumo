import { ImagePlus, Link2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRENCIES, STATUS_LABEL, type TripStatus } from "@/lib/trip-utils";
import { uploadImage, type TripInput } from "@/lib/trips-api";
import { TripCover } from "./TripCover";
import { allTimezones } from "@/lib/tz";

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-card sm:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

export function TripForm({ initial, onSubmit, submitLabel }: { initial: TripInput; onSubmit: (v: TripInput) => Promise<void>; submitLabel: string }) {
  const [v, setV] = useState<TripInput>(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const set = <K extends keyof TripInput>(k: K, val: TripInput[K]) => setV((p) => ({ ...p, [k]: val }));

  async function onFile(f?: File) {
    if (!f) return;
    setUploading(true);
    try {
      set("cover_url", await uploadImage(f, "covers"));
    } catch {
      toast.error("Falha ao enviar a imagem.");
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (v.start_date && v.end_date && v.end_date < v.start_date)
      return void toast.error("A data de volta deve ser depois da ida.");
    if (v.travelers_count < 1) return void toast.error("Informe o número de viajantes.");
    setSaving(true);
    try {
      await onSubmit(v);
    } catch {
      toast.error("Não foi possível salvar.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <datalist id="tz-options">{allTimezones().map((z) => <option key={z} value={z} />)}</datalist>
      <Section title="Informações básicas">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome da viagem</Label>
          <Input id="name" required placeholder="Ex.: Férias na Itália" value={v.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="start">Data de ida</Label>
            <Input id="start" type="date" value={v.start_date ?? ""} onChange={(e) => set("start_date", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="end">Data de volta</Label>
            <Input id="end" type="date" value={v.end_date ?? ""} onChange={(e) => set("end_date", e.target.value)} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="count">Nº de viajantes</Label>
            <Input id="count" type="number" inputMode="numeric" min={1} step={1} required placeholder="1" value={v.travelers_count > 0 ? v.travelers_count : ""} onChange={(e) => set("travelers_count", Math.max(0, Math.floor(Number(e.target.value) || 0)))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="budget">Orçamento previsto{v.currency !== "BRL" && ` (${v.currency})`}</Label>
            <MoneyInput id="budget" currency={v.currency} value={v.budget} onValueChange={(b) => set("budget", b)} />
            {v.currency === "BRL" && <p className="text-xs text-muted-foreground">Em reais. Valores em outras moedas são convertidos para reais nos resumos.</p>}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="iof">IOF (%) em gastos no cartão em moeda estrangeira</Label>
            <Input id="iof" type="number" min={0} step="0.01" value={v.iof_pct ?? 0} onChange={(e) => set("iof_pct", Number(e.target.value) || 0)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="spread">Spread do cartão (%)</Label>
            <Input id="spread" type="number" min={0} step="0.01" value={v.card_spread_pct ?? 0} onChange={(e) => set("card_spread_pct", Number(e.target.value) || 0)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={v.status_override ?? "auto"} onValueChange={(s) => set("status_override", s === "auto" ? null : (s as TripStatus))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Automático (pelas datas)</SelectItem>
              {(Object.keys(STATUS_LABEL) as TripStatus[]).map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Section>

      <Section title="Foto de capa" hint="Envie uma imagem ou cole um link.">
        <div className="aspect-[16/7] overflow-hidden rounded-xl border"><TripCover url={v.cover_url} /></div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" asChild disabled={uploading}>
            <label className="cursor-pointer">
              <ImagePlus /> {uploading ? "Enviando…" : "Enviar imagem"}
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
          </Button>
          <Button type="button" variant="outline" onClick={() => setUrlMode((m) => !m)}><Link2 /> Usar URL</Button>
          {v.cover_url && <Button type="button" variant="ghost" onClick={() => set("cover_url", null)}>Remover</Button>}
        </div>
        {urlMode && (
          <Input placeholder="https://…" value={v.cover_url ?? ""} onChange={(e) => set("cover_url", e.target.value || null)} />
        )}
      </Section>

      <Section title="Destinos" hint="Adicione cada cidade com as datas de chegada e saída.">
        {v.destinations.map((d, i) => (
          <div key={i} className="grid gap-3 rounded-xl border bg-background p-3 sm:grid-cols-[1fr_1fr_auto]">
            <Input aria-label="Cidade" placeholder="Cidade" value={d.city} onChange={(e) => set("destinations", v.destinations.map((x, j) => (j === i ? { ...x, city: e.target.value } : x)))} />
            <Input aria-label="País" placeholder="País" value={d.country ?? ""} onChange={(e) => set("destinations", v.destinations.map((x, j) => (j === i ? { ...x, country: e.target.value } : x)))} />
            <Button type="button" variant="ghost" size="icon" aria-label="Remover destino" className="hidden sm:inline-flex" onClick={() => set("destinations", v.destinations.filter((_, j) => j !== i))}><Trash2 /></Button>
            <div className="grid grid-cols-2 gap-3 sm:col-span-2 lg:grid-cols-4">
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Chegada</Label>
                <Input type="date" value={d.arrival_date ?? ""} onChange={(e) => set("destinations", v.destinations.map((x, j) => (j === i ? { ...x, arrival_date: e.target.value } : x)))} /></div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Saída</Label>
                <Input type="date" value={d.departure_date ?? ""} onChange={(e) => set("destinations", v.destinations.map((x, j) => (j === i ? { ...x, departure_date: e.target.value } : x)))} /></div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Moeda local</Label>
                <Select value={d.currency ?? "none"} onValueChange={(c) => set("destinations", v.destinations.map((x, j) => (j === i ? { ...x, currency: c === "none" ? null : c } : x)))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="none">—</SelectItem>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select></div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Fuso horário</Label>
                <Input list="tz-options" placeholder="Ex.: Europe/Lisbon" value={d.timezone ?? ""} onChange={(e) => set("destinations", v.destinations.map((x, j) => (j === i ? { ...x, timezone: e.target.value } : x)))} /></div>
            </div>
            <Button type="button" variant="ghost" size="sm" className="sm:hidden" onClick={() => set("destinations", v.destinations.filter((_, j) => j !== i))}><Trash2 /> Remover</Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => set("destinations", [...v.destinations, { city: "", country: "", arrival_date: null, departure_date: null }])}>
          <Plus /> Adicionar destino
        </Button>
      </Section>

      <Section title="Viajantes" hint="Quem vai com você. Usaremos depois em documentos e divisão de gastos.">
        {v.travelers.map((t, i) => (
          <div key={i} className="flex gap-2">
            <Input aria-label="Nome" placeholder="Nome" value={t.name} onChange={(e) => set("travelers", v.travelers.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
            <Input aria-label="E-mail" type="email" placeholder="E-mail (opcional)" value={t.email ?? ""} onChange={(e) => set("travelers", v.travelers.map((x, j) => (j === i ? { ...x, email: e.target.value } : x)))} />
            <Button type="button" variant="ghost" size="icon" aria-label="Remover viajante" onClick={() => set("travelers", v.travelers.filter((_, j) => j !== i))}><Trash2 /></Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => set("travelers", [...v.travelers, { name: "", email: "" }])}><Plus /> Adicionar viajante</Button>
      </Section>

      <div className="sticky bottom-0 -mx-4 border-t bg-background/90 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={saving || uploading}>{saving ? "Salvando…" : submitLabel}</Button>
      </div>
    </form>
  );
}
