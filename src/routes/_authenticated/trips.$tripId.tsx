import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, BedDouble, Plus, CalendarDays, CheckSquare, FileText, MapPin, Pencil, PiggyBank, Plane, Receipt, Route as RouteIcon,
  StickyNote, Ticket, Users, Wallet, LayoutDashboard, Share2, Eye, type LucideIcon,
} from "lucide-react";
import { differenceInCalendarDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Splash } from "@/components/Logo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/trips/StatusBadge";
import { TripActions } from "@/components/trips/TripActions";
import { TripCover } from "@/components/trips/TripCover";
import { computeStatus, daysUntil, formatDate, formatMoney, toDate } from "@/lib/trip-utils";
import { getTrip, type Trip } from "@/lib/trips-api";
import { ItineraryTab } from "@/components/plan/ItineraryTab";
import { TransportTab } from "@/components/plan/TransportTab";
import { LodgingTab } from "@/components/plan/LodgingTab";
import { ActivitiesTab } from "@/components/plan/ActivitiesTab";
import { BudgetTab } from "@/components/plan/BudgetTab";
import { ExpensesTab } from "@/components/plan/ExpensesTab";
import { ExpenseDialog, newExpense } from "@/components/plan/ExpenseDialog";
import { useState } from "react";
import { OverviewTab } from "@/components/plan/OverviewTab";
import { DocumentsTab } from "@/components/plan/DocumentsTab";
import { ChecklistTab } from "@/components/plan/ChecklistTab";
import { NotesTab } from "@/components/plan/NotesTab";
import { TripAccessProvider } from "@/components/plan/access";
import { ShareDialog } from "@/components/trips/ShareDialog";
import { ExportMenu } from "@/components/trips/ExportMenu";
import { myRoleQuery } from "@/lib/sharing-api";

export const Route = createFileRoute("/_authenticated/trips/$tripId")({
  head: () => ({
    meta: [
      { title: "Viagem — Rumo" },
      { name: "description", content: "Visão geral, roteiro, orçamento e tudo sobre a sua viagem." },
      { property: "og:title", content: "Viagem — Rumo" },
      { property: "og:description", content: "Visão geral, roteiro, orçamento e tudo sobre a sua viagem." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TripPage,
});

const TABS: { id: string; label: string; icon: LucideIcon; empty?: string }[] = [
  { id: "overview", label: "Visão geral", icon: LayoutDashboard },
  { id: "itinerary", label: "Roteiro", icon: RouteIcon, empty: "Monte o seu dia a dia: o que fazer em cada cidade, manhã, tarde e noite." },
  { id: "transport", label: "Transporte", icon: Plane, empty: "Guarde aqui voos, trens, ônibus e aluguel de carro, com horários e códigos de reserva." },
  { id: "lodging", label: "Hospedagem", icon: BedDouble, empty: "Registre hotéis e apartamentos com endereço, check-in e check-out." },
  { id: "activities", label: "Atividades", icon: Ticket, empty: "Passeios, museus, restaurantes e ingressos que você quer reservar." },
  { id: "budget", label: "Orçamento", icon: PiggyBank, empty: "Distribua o orçamento por categoria para saber quanto pode gastar." },
  { id: "expenses", label: "Gastos", icon: Receipt, empty: "Lance os gastos da viagem e veja como dividir entre os viajantes." },
  { id: "documents", label: "Documentos", icon: FileText, empty: "Passaportes, vistos, seguros e comprovantes, tudo à mão quando precisar." },
  { id: "checklist", label: "Checklist", icon: CheckSquare, empty: "Liste o que levar e o que resolver antes de embarcar." },
  { id: "notes", label: "Notas", icon: StickyNote, empty: "Ideias soltas, dicas de amigos e lembretes da viagem." },
];

function TripPage() {
  const { tripId } = Route.useParams();
  const navigate = useNavigate();
  const { data: trip, isLoading } = useQuery({ queryKey: ["trips", tripId], queryFn: () => getTrip(tripId) });
  const [newExp, setNewExp] = useState<any>(null);
  const [sharing, setSharing] = useState(false);
  const { data: role = "viewer" } = useQuery({ ...myRoleQuery(tripId, trip?.owner_id), enabled: !!trip });
  const canEdit = role !== "viewer";

  if (isLoading) return <Splash label="Abrindo a viagem…" />;
  if (!trip)
    return <EmptyState icon={MapPin} title="Viagem não encontrada" text="Ela pode ter sido excluída." action={<Button asChild><Link to="/trips">Voltar</Link></Button>} />;

  const status = computeStatus(trip.start_date, trip.end_date, trip.status_override);
  const days = daysUntil(trip.start_date);

  return (
    <TripAccessProvider role={role}>
    <div>
      <Link to="/trips" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Minhas viagens</Link>
      <div className="relative overflow-hidden rounded-3xl shadow-lift">
        <div className="aspect-[16/10] sm:aspect-[21/8]"><TripCover url={trip.cover_url} /></div>
        <div className="absolute inset-0 bg-cover-fade" />
        <div className="absolute right-3 top-3 flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setSharing(true)}><Share2 /> <span className="hidden sm:inline">Compartilhar</span></Button>
          <ExportMenu trip={trip} />
          {canEdit && <Button asChild variant="secondary" size="sm"><Link to="/trips/$tripId/edit" params={{ tripId }}><Pencil /> <span className="hidden sm:inline">Editar</span></Link></Button>}
          {role === "owner" && <div className="rounded-md bg-secondary"><TripActions trip={trip} afterDelete={() => navigate({ to: "/trips" })} /></div>}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
          <StatusBadge status={status} />
          <h1 className="mt-2 text-4xl font-medium text-on-photo sm:text-5xl">{trip.name}</h1>
          <p className="mt-2 font-num text-sm text-on-photo/90">
            {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
            {days != null && status !== "completed" && <> · faltam <strong>{days} {days === 1 ? "dia" : "dias"}</strong></>}
          </p>
        </div>
      </div>

      {!canEdit && (
        <p className="mt-4 flex items-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground shadow-card">
          <Eye className="size-4 text-mar" /> Você foi convidado para acompanhar esta viagem. Seu acesso é somente leitura.
        </p>
      )}
      <Tabs defaultValue="overview" className="mt-6">
        <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          <TabsList className="h-auto w-max gap-1 bg-transparent p-0">
            {TABS.map((t) => (
              <TabsTrigger key={t.id} value={t.id} className="gap-1.5 rounded-full border px-3.5 py-1.5 bg-card data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <t.icon className="size-4" /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value="overview" className="mt-6 space-y-6"><OverviewTab trip={trip} /><Overview trip={trip} /></TabsContent>
        <TabsContent value="itinerary" className="mt-6"><ItineraryTab trip={trip} /></TabsContent>
        <TabsContent value="transport" className="mt-6"><TransportTab trip={trip} /></TabsContent>
        <TabsContent value="lodging" className="mt-6"><LodgingTab trip={trip} /></TabsContent>
        <TabsContent value="activities" className="mt-6"><ActivitiesTab trip={trip} /></TabsContent>
        <TabsContent value="budget" className="mt-6"><BudgetTab trip={trip} /></TabsContent>
        <TabsContent value="expenses" className="mt-6"><ExpensesTab trip={trip} /></TabsContent>
        <TabsContent value="documents" className="mt-6"><DocumentsTab trip={trip} /></TabsContent>
        <TabsContent value="checklist" className="mt-6"><ChecklistTab trip={trip} /></TabsContent>
        <TabsContent value="notes" className="mt-6"><NotesTab trip={trip} /></TabsContent>
      </Tabs>
      {canEdit && (
        <Button size="lg" onClick={() => setNewExp(newExpense(trip))} className="no-print bottom-safe-nav fixed right-4 z-40 h-14 rounded-full px-6 shadow-lift md:bottom-6 md:right-6">
          <Plus className="size-5" /> Gasto
        </Button>
      )}
      {newExp && <ExpenseDialog trip={trip} row={newExp} onClose={() => setNewExp(null)} />}
      <ShareDialog trip={trip} role={role} open={sharing} onOpenChange={setSharing} />
    </div>
    </TripAccessProvider>
  );
}

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-card">
      <Icon className="size-5 text-primary" />
      <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold">{value}</p>
    </div>
  );
}

function Overview({ trip }: { trip: Trip }) {
  const s = toDate(trip.start_date), e = toDate(trip.end_date);
  const nights = s && e ? differenceInCalendarDays(e, s) : null;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={CalendarDays} label="Duração" value={nights != null ? `${nights + 1} dias` : "—"} />
        <Stat icon={MapPin} label="Destinos" value={String(trip.trip_destinations.length)} />
        <Stat icon={Users} label="Viajantes" value={String(trip.travelers_count)} />
        <Stat icon={Wallet} label="Orçamento" value={formatMoney(trip.budget, trip.currency)} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5 shadow-card">
          <h2 className="text-lg font-semibold">Destinos</h2>
          {trip.trip_destinations.length ? (
            <ol className="mt-4 space-y-4">
              {trip.trip_destinations.map((d, i) => (
                <li key={d.id} className="flex gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold text-primary">{i + 1}</span>
                  <div>
                    <p className="font-medium">{d.city}{d.country && <span className="text-muted-foreground">, {d.country}</span>}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(d.arrival_date)} – {formatDate(d.departure_date)}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : <p className="mt-3 text-sm text-muted-foreground">Nenhum destino. Edite a viagem para adicionar cidades.</p>}
        </section>
        <section className="rounded-2xl border bg-card p-5 shadow-card">
          <h2 className="text-lg font-semibold">Viajantes</h2>
          {trip.trip_travelers.length ? (
            <ul className="mt-4 space-y-3">
              {trip.trip_travelers.map((t) => (
                <li key={t.id} className="flex items-center gap-3">
                  <span className="grid size-8 place-items-center rounded-full bg-oliva text-sm font-semibold text-sobre-couro">{t.name.slice(0, 1).toUpperCase()}</span>
                  <div><p className="font-medium">{t.name}</p>{t.email && <p className="text-sm text-muted-foreground">{t.email}</p>}</div>
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 text-sm text-muted-foreground">Adicione quem vai com você editando a viagem.</p>}
        </section>
      </div>
    </div>
  );
}
