import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Globe, Link2, Mail, Share2, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { TripRole } from "@/components/plan/access";
import {
  createInvite, deleteInvite, inviteLink, invitesQuery, membersQuery, publicLink, removeMember, ROLE_LABEL, setMemberRole,
  setPublicLink, shareOrCopy,
} from "@/lib/sharing-api";
import type { Trip } from "@/lib/trips-api";

type Grant = Exclude<TripRole, "owner">;

export function ShareDialog({ trip, open, onOpenChange, role }: { trip: Trip; open: boolean; onOpenChange: (o: boolean) => void; role: TripRole }) {
  const isOwner = role === "owner";
  const qc = useQueryClient();
  const { data: members = [] } = useQuery({ ...membersQuery(trip.id), enabled: open });
  const { data: invites = [] } = useQuery({ ...invitesQuery(trip.id), enabled: open && isOwner });
  const [email, setEmail] = useState("");
  const [grant, setGrant] = useState<Grant>("editor");
  const [publicToken, setPublicToken] = useState<string | null>(trip.public_token ?? null);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["trip-members", trip.id] });
    qc.invalidateQueries({ queryKey: ["trip-invites", trip.id] });
  };

  const invite = useMutation({
    mutationFn: () => createInvite(trip.id, email, grant),
    onSuccess: async (inv) => {
      setEmail("");
      refresh();
      const how = await shareInvite(inv.token, inv.email);
      toast.success(how === "copied" ? "Convite criado e link copiado. Envie para a pessoa." : "Convite criado.");
    },
    onError: (e: Error) => toast.error(`Não foi possível convidar: ${e.message}`),
  });

  async function shareInvite(token: string, to: string) {
    return shareOrCopy(inviteLink(token), `Convite para ${trip.name}`, `Te convidei para planejar "${trip.name}" comigo no Rumo Trip. Entre com o e-mail ${to}:`);
  }

  function mailto(token: string, to: string) {
    const subject = encodeURIComponent(`Convite para a viagem "${trip.name}"`);
    const body = encodeURIComponent(
      `Oi! Te convidei para planejar "${trip.name}" comigo no Rumo Trip.\n\nAbra o link e entre (ou crie sua conta) com este e-mail (${to}):\n${inviteLink(token)}\n`,
    );
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  }

  async function togglePublic(on: boolean) {
    try {
      const token = await setPublicLink(trip.id, on);
      setPublicToken(token);
      qc.invalidateQueries({ queryKey: ["trips", trip.id] });
      if (token) {
        const how = await shareOrCopy(publicLink(token), trip.name, `Acompanhe o roteiro de "${trip.name}":`);
        toast.success(how === "copied" ? "Link público ativado e copiado." : "Link público ativado.");
      } else toast.success("Link público desativado. O endereço antigo deixou de funcionar.");
    } catch (e) {
      toast.error(`Não foi possível alterar o link: ${(e as Error).message}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Compartilhar viagem</DialogTitle>
          <DialogDescription>Planeje junto com quem vai viajar com você, ou mande o roteiro para a família acompanhar.</DialogDescription>
        </DialogHeader>

        {isOwner && (
          <form
            className="space-y-3 rounded-xl border bg-muted/40 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (email.trim()) invite.mutate();
            }}
          >
            <Label htmlFor="invite-email" className="flex items-center gap-2"><UserPlus className="size-4 text-primary" /> Convidar por e-mail</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input id="invite-email" type="email" required placeholder="nome@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1" />
              <Select value={grant} onValueChange={(v) => setGrant(v as Grant)}>
                <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">{ROLE_LABEL.editor}</SelectItem>
                  <SelectItem value="viewer">{ROLE_LABEL.viewer}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={invite.isPending}>{invite.isPending ? "Criando…" : "Criar convite"}</Button>
            <p className="text-xs text-muted-foreground">A pessoa recebe um link. Ao entrar (ou criar conta) com esse e-mail, a viagem aparece para ela.</p>
          </form>
        )}

        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Quem tem acesso</h3>
          <ul className="divide-y rounded-xl border bg-card">
            {members.map((m) => {
              const name = m.full_name || m.email || "Viajante";
              return (
                <li key={m.user_id} className="flex items-center gap-3 p-3">
                  <Avatar className="size-9">
                    <AvatarImage src={m.avatar_url ?? undefined} alt="" />
                    <AvatarFallback>{name.slice(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{name}</p>
                    {m.email && <p className="truncate text-xs text-muted-foreground">{m.email}</p>}
                  </div>
                  {isOwner && m.role !== "owner" ? (
                    <div className="flex items-center gap-1">
                      <Select
                        value={m.role}
                        onValueChange={async (v) => {
                          try { await setMemberRole(trip.id, m.user_id, v as Grant); refresh(); } catch (e) { toast.error((e as Error).message); }
                        }}
                      >
                        <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="editor">{ROLE_LABEL.editor}</SelectItem>
                          <SelectItem value="viewer">{ROLE_LABEL.viewer}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost" size="icon" aria-label={`Remover ${name}`}
                        onClick={async () => {
                          if (!confirm(`Remover ${name} desta viagem?`)) return;
                          try { await removeMember(trip.id, m.user_id); refresh(); } catch (e) { toast.error((e as Error).message); }
                        }}
                      ><Trash2 className="text-destructive" /></Button>
                    </div>
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground">{ROLE_LABEL[m.role]}</span>
                  )}
                </li>
              );
            })}
            {isOwner && invites.map((i) => (
              <li key={i.id} className="flex items-center gap-3 p-3">
                <span className="grid size-9 place-items-center rounded-full border border-dashed text-muted-foreground"><Mail className="size-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{i.email}</p>
                  <p className="text-xs text-muted-foreground">Convite pendente · {ROLE_LABEL[i.role]}</p>
                </div>
                <Button variant="ghost" size="icon" aria-label="Enviar convite por e-mail" onClick={() => mailto(i.token, i.email)}><Mail /></Button>
                <Button variant="ghost" size="icon" aria-label="Compartilhar link do convite" onClick={async () => {
                  const how = await shareInvite(i.token, i.email);
                  if (how === "copied") toast.success("Link do convite copiado.");
                }}><Share2 /></Button>
                <Button variant="ghost" size="icon" aria-label="Cancelar convite" onClick={async () => {
                  try { await deleteInvite(i.id); refresh(); } catch (e) { toast.error((e as Error).message); }
                }}><Trash2 className="text-destructive" /></Button>
              </li>
            ))}
          </ul>
        </section>

        {isOwner && (
          <section className="space-y-3 rounded-xl border p-4">
            <div className="flex items-start gap-3">
              <Globe className="mt-0.5 size-5 shrink-0 text-mar" />
              <div className="flex-1">
                <Label htmlFor="public-link" className="text-sm font-semibold">Link público do roteiro</Label>
                <p className="mt-0.5 text-xs text-muted-foreground">Somente leitura, sem valores, códigos de reserva ou documentos. Ideal para a família.</p>
              </div>
              <Switch id="public-link" checked={!!publicToken} onCheckedChange={togglePublic} />
            </div>
            {publicToken && (
              <div className="flex gap-2">
                <Input readOnly value={publicLink(publicToken)} className="font-num text-xs" onFocus={(e) => e.currentTarget.select()} />
                <Button variant="outline" size="icon" aria-label="Copiar link" onClick={async () => {
                  await navigator.clipboard.writeText(publicLink(publicToken));
                  toast.success("Link copiado.");
                }}><Copy /></Button>
                <Button variant="outline" size="icon" aria-label="Abrir link" asChild>
                  <a href={publicLink(publicToken)} target="_blank" rel="noreferrer"><Link2 /></a>
                </Button>
              </div>
            )}
          </section>
        )}

        {!isOwner && (
          <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            Seu acesso: <strong className="text-foreground">{ROLE_LABEL[role]}</strong>. Só o dono da viagem pode convidar pessoas ou criar o link público.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
