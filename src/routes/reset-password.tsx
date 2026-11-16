import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — Rumo" },
      { name: "description", content: "Defina uma nova senha para sua conta." },
      { property: "og:title", content: "Nova senha — Rumo" },
      { property: "og:description", content: "Defina uma nova senha para sua conta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return void toast.error("Link inválido ou expirado. Solicite um novo.");
    toast.success("Senha atualizada!");
    navigate({ to: "/trips" });
  }
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col px-6 py-6">
      <Logo />
      <form onSubmit={submit} className="my-auto space-y-4">
        <h1 className="text-3xl font-semibold">Defina uma nova senha</h1>
        <div className="space-y-1.5">
          <Label htmlFor="pw">Nova senha</Label>
          <Input id="pw" type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="h-11 w-full" disabled={loading}>Salvar senha</Button>
      </form>
    </div>
  );
}
