import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DateInput } from "@/components/ui/date-input";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Stamp } from "@/components/Stamp";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { manualStamp, type ManualStamp } from "@/lib/stamps";

const stampProps = (m: ManualStamp) => {
  const s = manualStamp(m);
  return { top: s.top, main: s.main, bottom: s.bottom, tone: s.tone, shape: s.shape, tilt: s.tilt };
};

export const manualStampsKey = (userId: string) => ["manual_stamps", userId] as const;

/** Lê os carimbos manuais; se a tabela ainda não existir no banco, devolve lista vazia. */
export async function listManualStamps(): Promise<ManualStamp[]> {
  const { data, error } = await supabase.from("manual_stamps").select("id, country, entry_city, stamped_on, note").order("stamped_on");
  if (error) {
    if (/manual_stamps/.test(error.message)) return [];
    throw error;
  }
  return data ?? [];
}

const COUNTRIES = [
  "Alemanha", "Argentina", "Austrália", "Áustria", "Bélgica", "Bolívia", "Canadá", "Chile", "China", "Colômbia", "Coreia do Sul",
  "Costa Rica", "Croácia", "Cuba", "Dinamarca", "Egito", "Emirados Árabes Unidos", "Equador", "Escócia", "Espanha", "Estados Unidos",
  "Finlândia", "França", "Grécia", "Holanda", "Hungria", "Índia", "Indonésia", "Inglaterra", "Irlanda", "Islândia", "Israel", "Itália",
  "Japão", "Marrocos", "México", "Noruega", "Nova Zelândia", "Panamá", "Paraguai", "Peru", "Polônia", "Portugal", "Reino Unido",
  "República Dominicana", "República Tcheca", "Rússia", "Suécia", "Suíça", "Tailândia", "Turquia", "Uruguai", "Venezuela", "Vietnã",
];

/** Incluir (e remover) carimbos de viagens feitas antes de usar o Rumo Trip. */
export function ManualStampsDialog({ open, onOpenChange, userId, stamps }: {
  open: boolean; onOpenChange: (o: boolean) => void; userId: string; stamps: ManualStamp[];
}) {
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const invalid = country.trim().length < 2 || !date || date > today;

  const refresh = () => qc.invalidateQueries({ queryKey: manualStampsKey(userId) });
  const fail = (msg: string) =>
    toast.error(/manual_stamps/.test(msg) ? "O banco ainda não tem a tabela de carimbos manuais. Rode a migração 20261116000009 no Supabase." : msg);

  const add = async () => {
    setBusy(true);
    const { error } = await supabase.from("manual_stamps").insert({
      country: country.trim(),
      entry_city: city.trim() || null,
      stamped_on: date,
      note: note.trim() || null,
    });
    setBusy(false);
    if (error) { fail(error.message); return; }
    toast.success(`Carimbo de ${country.trim()} incluído no passaporte`);
    setCountry(""); setCity(""); setDate(""); setNote("");
    refresh();
  };

  const remove = async (s: ManualStamp) => {
    const { error } = await supabase.from("manual_stamps").delete().eq("id", s.id);
    if (error) { fail(error.message); return; }
    toast.success(`Carimbo de ${s.country} removido`);
    refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Carimbos de viagens anteriores</DialogTitle>
          <DialogDescription>Inclua os países por onde você já passou antes de usar o Rumo Trip. Cada um vira um carimbo no livreto, na data da entrada.</DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!invalid && !busy) add();
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="ms-country">País</Label>
            <Input id="ms-country" list="ms-countries" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Ex.: Argentina" autoComplete="off" />
            <datalist id="ms-countries">{COUNTRIES.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ms-city">Cidade de entrada <span className="font-normal text-muted-foreground">(opcional)</span></Label>
            <Input id="ms-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex.: Buenos Aires" autoComplete="off" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ms-date">Data da entrada</Label>
            <DateInput id="ms-date" max={today} value={date} onValueChange={setDate} clearable={false} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ms-note">Viagem <span className="font-normal text-muted-foreground">(opcional)</span></Label>
            <Input id="ms-note" value={note} maxLength={80} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: Mochilão 2019" autoComplete="off" />
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            {country.trim().length >= 2 && date && (
              <Stamp {...stampProps({ id: "preview", country, entry_city: city || null, stamped_on: date, note: null })} className="size-16 shrink-0" />
            )}
            <Button type="submit" className="ml-auto" disabled={invalid || busy}>{busy ? "Incluindo…" : "Incluir carimbo"}</Button>
          </div>
        </form>

        {stamps.length > 0 && (
          <div className="mt-2 border-t pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Já incluídos</p>
            <ul className="space-y-1.5">
              {[...stamps].sort((a, b) => b.stamped_on.localeCompare(a.stamped_on)).map((s) => (
                <li key={s.id} className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2 text-sm">
                  <Stamp {...stampProps(s)} className="size-9 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{s.country}{s.entry_city ? ` · ${s.entry_city}` : ""}</span>
                    <span className="block truncate text-xs text-muted-foreground">{s.stamped_on.split("-").reverse().join("/")}{s.note ? ` · ${s.note}` : ""}</span>
                  </span>
                  <Button type="button" variant="ghost" size="icon" aria-label={`Remover carimbo de ${s.country}`} onClick={() => remove(s)}>
                    <Trash2 className="text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
