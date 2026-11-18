import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutTemplate, Plus, Trash2 } from "lucide-react";
import { DateInput } from "@/components/ui/date-input";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Dial } from "@/components/Dial";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { deleteRow, planQuery, saveRow } from "@/lib/plan-api";
import { CHECKLIST_LISTS, progressPct, TEMPLATES } from "@/lib/trip-extras";
import type { Trip } from "@/lib/trips-api";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export type ChecklistItem = Database["public"]["Tables"]["checklist_items"]["Row"];

export function ChecklistTab({ trip }: { trip: Trip }) {
  const qc = useQueryClient();
  const key = planQuery<ChecklistItem>("checklist_items", trip.id);
  const { data: items = [] } = useQuery(key);
  const [tpl, setTpl] = useState<string | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: key.queryKey });
  const upd = async (id: string, patch: Partial<ChecklistItem>) => {
    qc.setQueryData(key.queryKey, (old: ChecklistItem[] = []) => old.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    await saveRow("checklist_items", { id, ...patch });
    refresh();
  };
  const pct = progressPct(items);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Dial value={pct} label="Checklist concluída" sub="pronto" className="size-20 sm:size-24" />
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-semibold">Checklist</h2>
          <p className="text-sm text-muted-foreground">{items.filter((i) => i.done).length} de {items.length} concluídos</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Modelos prontos</span>
        {Object.entries(TEMPLATES).map(([k, t]) => (
          <Button key={k} size="sm" variant="outline" onClick={() => setTpl(k)}><LayoutTemplate /> {t.label}</Button>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Object.entries(CHECKLIST_LISTS).map(([list, label]) => (
          <ListCard key={list} trip={trip} list={list} label={label} items={items.filter((i) => i.list === list)} onUpdate={upd} onChange={refresh} />
        ))}
      </div>
      {tpl && <TemplateDialog trip={trip} tplKey={tpl} count={items.length} onClose={() => setTpl(null)} onDone={refresh} />}
    </div>
  );
}

function ListCard({ trip, list, label, items, onUpdate, onChange }: {
  trip: Trip; list: string; label: string; items: ChecklistItem[]; onUpdate: (id: string, p: Partial<ChecklistItem>) => void; onChange: () => void;
}) {
  const [title, setTitle] = useState("");
  const today = format(new Date(), "yyyy-MM-dd");
  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await saveRow("checklist_items", { trip_id: trip.id, list, title: title.trim(), position: items.length });
    setTitle(""); onChange();
  }
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between"><h3 className="text-lg font-semibold">{label}</h3><span className="text-sm text-muted-foreground">{progressPct(items)}%</span></div>
      <form onSubmit={add} className="mt-3 flex gap-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={list === "pre" ? "Ex.: avisar o banco" : "Ex.: carregador"} />
        <Button type="submit" size="icon" aria-label="Adicionar"><Plus /></Button>
      </form>
      {!items.length && <p className="mt-4 text-sm text-muted-foreground">Lista vazia. Adicione itens acima ou use um modelo pronto.</p>}
      <ul className="mt-3 divide-y">
        {items.map((i) => (
          <li key={i.id} className="flex flex-wrap items-center gap-2 py-2.5">
            <Checkbox checked={i.done} onCheckedChange={(v) => onUpdate(i.id, { done: !!v })} aria-label={i.title} />
            <span className={cn("min-w-0 flex-1", i.done && "text-muted-foreground line-through")}>{i.title}</span>
            <label className={cn("flex items-center gap-1 text-xs", !i.done && i.due_date && i.due_date < today ? "text-destructive" : "text-muted-foreground")}>
              <DateInput compact aria-label="Prazo" value={i.due_date} onValueChange={(d) => onUpdate(i.id, { due_date: d || null })} />
            </label>
            {trip.trip_travelers.length > 0 && (
              <Select value={i.assignee ?? "none"} onValueChange={(v) => onUpdate(i.id, { assignee: v === "none" ? null : v })}>
                <SelectTrigger aria-label="Responsável" className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguém</SelectItem>
                  {trip.trip_travelers.map((t) => <SelectItem key={t.id} value={t.id!}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Button size="icon" variant="ghost" className="size-7" aria-label="Excluir" onClick={async () => { await deleteRow("checklist_items", i.id); onChange(); }}><Trash2 className="size-3.5" /></Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TemplateDialog({ trip, tplKey, count, onClose, onDone }: { trip: Trip; tplKey: string; count: number; onClose: () => void; onDone: () => void }) {
  const t = TEMPLATES[tplKey]!;
  const [pre, setPre] = useState(t.pre.join("\n"));
  const [packing, setPacking] = useState(t.packing.join("\n"));
  async function apply() {
    const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
    const rows = [...lines(pre).map((title) => ({ list: "pre", title })), ...lines(packing).map((title) => ({ list: "packing", title }))]
      .map((r, i) => ({ ...r, trip_id: trip.id, position: count + i }));
    const { error } = await supabase.from("checklist_items").insert(rows);
    if (error) { toast.error("Não foi possível adicionar."); return; }
    toast.success(`${rows.length} itens adicionados`); onDone(); onClose();
  }
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle className="font-display text-2xl">Modelo: {t.label}</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Ajuste os itens antes de adicionar (um por linha).</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><p className="mb-1 text-sm font-medium">Pré-viagem</p><Textarea rows={9} value={pre} onChange={(e) => setPre(e.target.value)} /></div>
          <div><p className="mb-1 text-sm font-medium">Mala</p><Textarea rows={9} value={packing} onChange={(e) => setPacking(e.target.value)} /></div>
        </div>
        <DialogFooter><Button variant="oliva" onClick={apply}>Adicionar à checklist</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
