import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeleteAccountDialog } from "@/components/DeleteAccountDialog";
import { profileQuery } from "@/lib/profile";
import { uploadImage } from "@/lib/trips-api";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Meu perfil — Rumo Trip" },
      { name: "description", content: "Seu nome, foto e moeda padrão." },
      { property: "og:title", content: "Meu perfil — Rumo Trip" },
      { property: "og:description", content: "Seu nome, foto e moeda padrão." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: profile } = useQuery(profileQuery(user.id));
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [currency, setCurrency] = useState("BRL");
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.full_name ?? "");
    setAvatar(profile.avatar_url);
    setCurrency(profile.default_currency);
  }, [profile]);

  async function onFile(f?: File) {
    if (!f) return;
    try { setAvatar(await uploadImage(f, "avatars")); } catch { toast.error("Falha ao enviar a foto."); }
  }

  async function save(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({ id: user.id, full_name: name, avatar_url: avatar, default_currency: currency });
    setSaving(false);
    if (error) return void toast.error("Não foi possível salvar.");
    qc.invalidateQueries({ queryKey: ["profile", user.id] });
    toast.success("Perfil atualizado");
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-3xl font-semibold">Meu perfil</h1>
      <form onSubmit={save} className="space-y-5 rounded-2xl border bg-card p-6 shadow-card">
        <div className="flex items-center gap-4">
          <Avatar className="size-20">
            <AvatarImage src={avatar ?? undefined} alt="" />
            <AvatarFallback className="text-2xl">{(name || user.email || "?").slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <Button type="button" variant="outline" asChild>
            <label className="cursor-pointer"><Camera /> Trocar foto
              <input type="file" accept="image/*" aria-label="Trocar foto do perfil" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
          </Button>
        </div>
        <div className="space-y-1.5"><Label htmlFor="pname">Nome</Label><Input id="pname" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>E-mail</Label><Input value={user.email ?? ""} disabled /></div>
        <Button type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
      </form>

      <section className="mt-8 rounded-2xl border border-destructive/30 bg-card p-6 shadow-card">
        <h2 className="text-lg font-semibold">Excluir conta</h2>
        <p className="mt-1 text-sm text-muted-foreground">Apaga a conta e todas as suas viagens. Pedimos um código enviado ao seu e-mail para confirmar.</p>
        <Button variant="outline" className="mt-4 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleting(true)}>
          <Trash2 /> Excluir minha conta
        </Button>
      </section>
      <DeleteAccountDialog open={deleting} onOpenChange={setDeleting} userId={user.id} email={user.email ?? ""} />
    </div>
  );
}
