import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo, LogoMark } from "@/components/Logo";
import { GoogleIcon } from "@/components/GoogleIcon";
import hero from "@/assets/auth-hero.jpg";

type AuthSearch = { redirect?: string };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): AuthSearch =>
    typeof s["redirect"] === "string" && s["redirect"].startsWith("/") ? { redirect: s["redirect"] } : {},
  head: () => ({
    meta: [
      { title: "Entrar — Rumo Trip" },
      { name: "description", content: "Entre ou crie sua conta para planejar suas viagens." },
      { property: "og:title", content: "Entrar — Rumo Trip" },
      { property: "og:description", content: "Entre ou crie sua conta para planejar suas viagens." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

type Mode = "login" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const target = redirect && !redirect.startsWith("//") ? redirect : "/trips";
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  // Already signed in (or just back from Google): continue to where the user was going.
  useEffect(() => {
    const go = () => navigate({ href: target, replace: true });
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) go();
    });
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") go();
    });
    return () => data.subscription.unsubscribe();
  }, [navigate, target]);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ href: target });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + target, data: { full_name: name } },
        });
        if (error) throw error;
        setSent("Enviamos um link de confirmação para o seu e-mail. Confirme para entrar.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent("Se houver uma conta com esse e-mail, você receberá um link para redefinir a senha.");
      }
    } catch (err: any) {
      const msg = String(err?.message ?? "");
      toast.error(msg.includes("Invalid login") ? "E-mail ou senha incorretos." : msg || "Algo deu errado.");
    } finally {
      setLoading(false);
    }
  }

  async function google(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth${redirect ? `?redirect=${encodeURIComponent(target)}` : ""}` },
    });
    if (error) toast.error("Não foi possível entrar com o Google.");
  }

  const title = { login: "Bem-vindo de volta", signup: "Crie sua conta", forgot: "Recuperar senha" }[mode];

  return (
    <div className="grid min-h-dvh md:grid-cols-2">
      <div className="flex flex-col px-6 pb-6 pt-[max(1.75rem,env(safe-area-inset-top))] sm:px-12 sm:pt-8">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <p className="font-hand text-2xl text-primary">{mode === "signup" ? "Primeira página do diário" : "Bom te ver por aqui"}</p>
          <h1 className="mt-1 text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "forgot" ? "Informe seu e-mail para receber o link." : "Suas viagens, organizadas do seu jeito."}
          </p>

          {sent ? (
            <div className="mt-8 rounded-xl border bg-card p-5 text-sm shadow-card">
              <p>{sent}</p>
              <Button variant="link" className="mt-2 px-0" onClick={() => { setSent(null); setMode("login"); }}>
                Voltar para o login
              </Button>
            </div>
          ) : (
            <>
              {mode !== "forgot" && (
                <>
                  <Button type="button" variant="outline" className="mt-8 h-11 w-full" onClick={google}>
                    <GoogleIcon /> Continuar com Google
                  </Button>
                  <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
                  </div>
                </>
              )}
              <form onSubmit={submit} className={mode === "forgot" ? "mt-8 space-y-4" : "space-y-4"}>
                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Nome</Label>
                    <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                {mode !== "forgot" && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Senha</Label>
                      {mode === "login" && (
                        <button type="button" className="text-xs font-medium text-primary hover:underline" onClick={() => setMode("forgot")}>
                          Esqueci a senha
                        </button>
                      )}
                    </div>
                    <Input id="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                )}
                <Button type="submit" className="h-11 w-full" disabled={loading}>
                  {loading ? "Aguarde…" : mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar link"}
                </Button>
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "login" ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
                <button className="font-semibold text-primary hover:underline" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
                  {mode === "login" ? "Cadastre-se" : "Entrar"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
      <div className="relative hidden md:block">
        <img src={hero} alt="Litoral visto de cima com estrada sinuosa" width={1024} height={1408} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-cover-fade" />
        <div className="absolute right-8 top-8 rounded-full bg-papel/90 p-1.5 shadow-lift backdrop-blur">
          <LogoMark animated className="size-16" />
        </div>
        <p className="absolute bottom-10 left-10 right-10 font-display text-3xl text-on-photo">
          “O mundo é um livro, e quem não viaja lê apenas uma página.”
        </p>
      </div>
    </div>
  );
}
