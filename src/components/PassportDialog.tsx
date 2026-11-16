import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { normalizePassport } from "@/lib/passport";

/** Cadastro do passaporte real (número e validade), guardado no perfil do usuário. */
export function PassportDialog({ open, onOpenChange, userId, number, expiry }: {
  open: boolean; onOpenChange: (o: boolean) => void; userId: string; number: string | null; expiry: string | null;
}) {
  const qc = useQueryClient();
  const [n, setN] = useState(number ?? "");
  const [e, setE] = useState(expiry ?? "");
  const [saving, setSaving] = useState(false);
  const clean = normalizePassport(n);
  const invalid = clean.length > 0 && (clean.length < 5 || clean.length > 20);

  const save = async (clear = false) => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ passport_number: clear ? null : clean || null, passport_expiry: clear ? null : e || null })
      .eq("id", userId);
    setSaving(false);
    if (error) {
      toast.error(/passport_/.test(error.message) ? "O banco ainda não tem os campos do passaporte. Rode a migração 20261116000007 no Supabase." : error.message);
      return;
    }
    await qc.invalidateQueries({ queryKey: ["profile", userId] });
    toast.success(clear ? "Dados do passaporte removidos" : "Passaporte atualizado");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dados do passaporte</DialogTitle>
          <DialogDescription>Ficam só na sua conta. O Rumo avisa quando a validade estiver chegando ao fim ou for curta para uma viagem.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(ev) => {
            ev.preventDefault();
            if (!invalid) save();
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="pp-number">Número</Label>
            <Input id="pp-number" value={n} onChange={(ev) => setN(ev.target.value)} placeholder="Ex.: FX123456" autoComplete="off" className="font-num uppercase tracking-wider" />
            {invalid && <p className="text-xs text-destructive">O número tem entre 5 e 20 letras e algarismos.</p>}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="pp-expiry">Válido até</Label>
            <Input id="pp-expiry" type="date" value={e} onChange={(ev) => setE(ev.target.value)} />
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            {(number || expiry) ? (
              <Button type="button" variant="ghost" className="text-destructive" disabled={saving} onClick={() => save(true)}>Remover dados</Button>
            ) : <span />}
            <Button type="submit" disabled={saving || invalid}>{saving ? "Salvando…" : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
