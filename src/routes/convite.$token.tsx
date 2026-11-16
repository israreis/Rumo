import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PassportMark, Splash } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { acceptInvite } from "@/lib/sharing-api";

export const Route = createFileRoute("/convite/$token")({
  ssr: false,
  head: () => ({ meta: [{ title: "Convite de viagem — Rumo Trip" }, { name: "robots", content: "noindex" }] }),
  component: AcceptInvite,
});

const ERRORS: Record<string, string> = {
  invite_email_mismatch: "Este convite foi enviado para outro e-mail. Entre com o e-mail que recebeu o convite.",
  invite_not_found: "Convite não encontrado. Ele pode ter sido cancelado pelo dono da viagem.",
};

function AcceptInvite() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate({ to: "/auth", search: { redirect: `/convite/${token}` }, replace: true });
        return;
      }
      setEmail(data.user.email ?? null);
      try {
        const tripId = await acceptInvite(token);
        if (cancelled) return;
        await qc.invalidateQueries({ queryKey: ["trips"] });
        navigate({ to: "/trips/$tripId", params: { tripId }, replace: true });
      } catch (e) {
        const msg = String((e as Error)?.message ?? e);
        const key = Object.keys(ERRORS).find((k) => msg.includes(k));
        setError(key ? ERRORS[key] ?? msg : `Não foi possível aceitar o convite: ${msg}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, navigate, qc]);

  if (!error) return <Splash label="Abrindo o convite…" />;

  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="max-w-sm text-center">
        <PassportMark className="mx-auto size-20" />
        <h1 className="mt-6 text-3xl">Convite de viagem</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        {email && <p className="mt-1 text-xs text-muted-foreground">Você entrou como {email}.</p>}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth", search: { redirect: `/convite/${token}` } });
            }}
          >
            Entrar com outro e-mail
          </Button>
          <Button asChild><Link to="/trips">Minhas viagens</Link></Button>
        </div>
      </div>
    </div>
  );
}
