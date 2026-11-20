import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteMyAccount, sendAccountCode, verifyAccountCode } from "@/lib/account";

/**
 * Exclusão da conta confirmada por um código enviado ao e-mail. Funciona igual para quem
 * entrou com senha ou com Google (que não tem senha para conferir).
 */
export function DeleteAccountDialog({ open, onOpenChange, userId, email }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
  email: string;
}) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState<"intro" | "code" | "confirm">("intro");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close(v: boolean) {
    if (busy) return;
    onOpenChange(v);
    if (!v) { setStep("intro"); setCode(""); setError(null); }
  }

  async function run(fn: () => Promise<void>) {
    setBusy(true); setError(null);
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : "Algo deu errado."); } finally { setBusy(false); }
  }

  const send = () => run(async () => { await sendAccountCode(email); setStep("code"); toast.success(`Código enviado para ${email}`); });
  const verify = () => run(async () => {
    if (!code.trim()) throw new Error("Digite o código recebido por e-mail.");
    await verifyAccountCode(email, code);
    setStep("confirm");
  });
  const destroy = () => run(async () => {
    await deleteMyAccount(userId);
    qc.clear();
    onOpenChange(false);
    toast.success("Sua conta foi excluída.");
    navigate({ to: "/auth", replace: true });
  });

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir conta</DialogTitle>
          <DialogDescription>
            Apaga para sempre suas viagens (com roteiro, gastos, documentos e anexos), carimbos, dados do passaporte e a conta {email}.
            Viagens de outras pessoas compartilhadas com você continuam com elas. Não dá para desfazer.
          </DialogDescription>
        </DialogHeader>

        {error && <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

        {step === "intro" && (
          <p className="text-sm text-muted-foreground">Para sua segurança, vamos enviar um código de confirmação para <strong className="text-foreground">{email}</strong>.</p>
        )}
        {step === "code" && (
          <div className="space-y-1.5">
            <Label htmlFor="del-code">Código recebido por e-mail</Label>
            <Input id="del-code" inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} onKeyDown={(e) => { if (e.key === "Enter") void verify(); }} />
            <button type="button" className="text-xs font-medium text-primary hover:underline disabled:opacity-50" disabled={busy} onClick={send}>Reenviar código</button>
          </div>
        )}
        {step === "confirm" && (
          <p className="text-sm font-medium text-destructive">Código confirmado. Esta é a última etapa: tudo será apagado agora.</p>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => close(false)} disabled={busy}>Cancelar</Button>
          {step === "intro" && <Button variant="destructive" onClick={send} disabled={busy}>{busy ? "Enviando…" : "Enviar código"}</Button>}
          {step === "code" && <Button variant="destructive" onClick={verify} disabled={busy}>{busy ? "Conferindo…" : "Confirmar código"}</Button>}
          {step === "confirm" && <Button variant="destructive" onClick={destroy} disabled={busy}>{busy ? "Excluindo…" : "Excluir tudo"}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
