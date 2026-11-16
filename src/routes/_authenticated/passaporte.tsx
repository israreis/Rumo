import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PassportMark, Splash } from "@/components/Logo";
import { Stamp } from "@/components/Stamp";
import { collection, markStampsSeen, seenStamps } from "@/lib/stamps";
import { profileQuery } from "@/lib/profile";
import { PassportBook } from "@/components/PassportBook";
import { PassportDialog } from "@/components/PassportDialog";
import { maskPassport, passportState, relTime, type PassportState } from "@/lib/passport";
import { AlertTriangle, BadgeCheck, CircleAlert, IdCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { listTrips } from "@/lib/trips-api";

export const Route = createFileRoute("/_authenticated/passaporte")({
  head: () => ({ meta: [{ title: "Meu passaporte — Rumo" }, { name: "description", content: "Sua coleção de carimbos de viagem." }] }),
  component: Passport,
});

function Passport() {
  const { user } = Route.useRouteContext();
  const { data: trips, isLoading } = useQuery({ queryKey: ["trips"], queryFn: listTrips });
  const { data: profile } = useQuery(profileQuery(user.id));
  const today = format(new Date(), "yyyy-MM-dd");
  const col = useMemo(() => collection(trips ?? [], today), [trips, today]);
  // Stamps earned since the last visit land with the stamping animation, once.
  const [fresh] = useState(() => (typeof window === "undefined" ? new Set<string>() : seenStamps()));
  const newOnes = col.earned.filter((s) => !fresh.has(s.key));
  const [editing, setEditing] = useState(false);
  const pState = useMemo(
    () => passportState(profile?.passport_expiry, today, (trips ?? []).map((t) => ({ name: t.name, end_date: t.end_date }))),
    [profile?.passport_expiry, today, trips],
  );

  useEffect(() => {
    if (!trips) return;
    if (newOnes.length && fresh.size) toast.success(newOnes.length === 1 ? "Novo carimbo no passaporte!" : `${newOnes.length} carimbos novos no passaporte!`);
    markStampsSeen(col.earned.map((s) => s.key));
  }, [trips]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) return <Splash label="Abrindo o passaporte…" />;

  // No livreto, os carimbos seguem a ordem das viagens: cidades na ordem de chegada e o "concluída" no fim.
  const chrono = [...col.earned].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "") || (a.kind === "trip" ? 1 : 0) - (b.kind === "trip" ? 1 : 0));

  return (
    <div className="space-y-10">
      <header className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center">
        <div className="flex items-center gap-4 sm:gap-6">
          <PassportMark className="size-16 shrink-0 sm:size-24" title="Passaporte Rumo" />
          <div className="min-w-0">
            <p className="font-hand text-xl text-primary sm:text-2xl">Carimbe cada chegada</p>
            <h1 className="text-3xl sm:text-4xl">Meu passaporte</h1>
          </div>
        </div>
        <dl className="order-last grid grid-cols-3 gap-3 text-center lg:order-none lg:row-span-2">
          <Count n={col.earned.length} label="carimbos" />
          <Count n={col.cities} label="cidades" />
          <Count n={col.countries} label={col.countries === 1 ? "país" : "países"} />
        </dl>
        <p className="max-w-2xl text-sm text-muted-foreground lg:-mt-2">
          Os passaportes quase não são mais carimbados, então o Rumo guarda esse ritual: cada país ganha um carimbo no dia em que você entra nele, como na imigração do aeroporto, e cada viagem concluída ganha o seu.
        </p>
      </header>

      <div className="space-y-4">
        <PassportStatus state={pState} number={profile?.passport_number ?? null} expiry={profile?.passport_expiry ?? null} onEdit={() => setEditing(true)} />
        <PassportBook
          stamps={chrono}
          seen={fresh}
          holder={{
            name: profile?.full_name ?? null,
            avatar: profile?.avatar_url ?? null,
            passportNumber: profile?.passport_number ?? null,
            passportExpiry: profile?.passport_expiry ?? null,
            passportState: pState,
            onEditPassport: () => setEditing(true),
          }}
          counts={{ stamps: col.earned.length, cities: col.cities, countries: col.countries }}
        />
      </div>
      {editing && (
        <PassportDialog open onOpenChange={setEditing} userId={user.id} number={profile?.passport_number ?? null} expiry={profile?.passport_expiry ?? null} />
      )}

      {col.pending.length > 0 && (
        <section>
          <h2 className="text-2xl">Para carimbar</h2>
          <p className="mt-1 text-sm text-muted-foreground">Próximas chegadas das suas viagens.</p>
          <ul className="mt-5 grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {col.pending.slice(0, 12).map((s) => (
              <li key={s.key} className="flex flex-col items-center gap-1 text-center">
                <Stamp top={s.top} main={s.main} bottom={s.bottom} tone={s.tone} shape={s.shape} tilt={s.tilt} pending className="size-24" />
                <span className="text-[11px] text-muted-foreground">{s.tripName}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Count({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-2 shadow-card">
      <dt className="sr-only">{label}</dt>
      <dd className="font-num text-2xl font-medium">{n}</dd>
      <dd className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</dd>
    </div>
  );
}

/** Faixa acima do livreto: situação do passaporte real e atalho para cadastrar/atualizar. */
function PassportStatus({ state, number, expiry, onEdit }: { state: PassportState; number: string | null; expiry: string | null; onEdit: () => void }) {
  const br = (d: string | null) => (d ? d.split("-").reverse().join("/") : "");
  const v = {
    missing: { tone: "border-dashed bg-card/60", Icon: IdCard, icon: "text-muted-foreground", text: "Cadastre o número e a validade do seu passaporte para o Rumo avisar quando ele estiver vencendo.", cta: "Cadastrar" },
    expired: { tone: "border-destructive/40 bg-destructive/10", Icon: CircleAlert, icon: "text-destructive", text: "", cta: "Atualizar" },
    expiring: { tone: "border-warning/40 bg-warning/10", Icon: AlertTriangle, icon: "text-warning", text: "", cta: "Atualizar" },
    "short-for-trip": { tone: "border-warning/40 bg-warning/10", Icon: AlertTriangle, icon: "text-warning", text: "", cta: "Atualizar" },
    ok: { tone: "bg-card", Icon: BadgeCheck, icon: "text-success", text: "", cta: "Editar" },
  }[state.kind];
  const text =
    state.kind === "expired" ? <><strong>Seu passaporte venceu há {relTime(state.days)}</strong> ({br(expiry)}). Renove antes da próxima viagem.</>
    : state.kind === "expiring" ? <><strong>Seu passaporte vence em {relTime(state.days)}</strong> ({br(expiry)}). Muitos países exigem pelo menos 6 meses de validade na entrada.</>
    : state.kind === "short-for-trip" ? <><strong>Validade curta para “{state.trip}”.</strong> O passaporte vence em {br(expiry)}, menos de 6 meses depois da volta ({br(state.returnDate)}); alguns países barram a entrada.</>
    : state.kind === "ok" ? <>Passaporte <span className="font-num tracking-wider">{maskPassport(number)}</span> válido até <strong>{br(expiry)}</strong>.</>
    : v.text;
  return (
    <div className={cn("flex flex-wrap items-center gap-3 rounded-[14px] border px-4 py-3 text-sm", v.tone)}>
      <v.Icon className={cn("size-5 shrink-0", v.icon)} />
      <p className="min-w-0 flex-1">{text}</p>
      <Button size="sm" variant={state.kind === "ok" ? "ghost" : "outline"} onClick={onEdit}>{v.cta}</Button>
    </div>
  );
}
