import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CalendarPlus, Download, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buildAgenda } from "@/lib/agenda";
import { BUDGET_CATEGORIES, PAYMENT_METHODS } from "@/lib/budget";
import { buildIcs, downloadText, slug, toCsv } from "@/lib/exports";
import { dayTimezone } from "@/lib/itinerary";
import { planQuery, type Activity, type ItineraryEvent, type Lodging, type PlanTable, type Transport } from "@/lib/plan-api";
import type { Trip } from "@/lib/trips-api";
import { useBudget, type Expense } from "@/components/plan/useBudget";

/** Export actions for a trip: PDF (print view), expenses & budget as CSV, itinerary as .ics. */
export function ExportMenu({ trip, variant = "secondary" }: { trip: Trip; variant?: "secondary" | "outline" }) {
  const qc = useQueryClient();
  const { lines, expenses } = useBudget(trip);
  const travelers = Object.fromEntries(trip.trip_travelers.map((t) => [t.id ?? "", t.name]));
  const base = slug(trip.name);

  function expensesCsv() {
    const rows = (expenses as Expense[]).map((e) => [
      e.date, e.description, BUDGET_CATEGORIES[e.category] ?? e.category, PAYMENT_METHODS[e.payment_method] ?? e.payment_method,
      Number(e.amount), e.currency, Number(e.fx_rate), Number(e.fees_pct), Number(e.converted_amount), trip.currency,
      e.paid_by ? travelers[e.paid_by] ?? "" : "",
    ]);
    downloadText(`${base}-gastos.csv`, toCsv(
      ["Data", "Descrição", "Categoria", "Pagamento", "Valor", "Moeda", "Cotação", "Taxas (%)", `Valor em ${trip.currency}`, "Moeda da viagem", "Pago por"],
      rows,
    ), "text/csv");
  }

  function budgetCsv() {
    const rows = lines.map((l) => [
      BUDGET_CATEGORIES[l.category] ?? l.category, l.label, l.amount, l.currency, l.converted, l.paid, l.due_date, l.installments,
      l.auto ? "automático" : "manual",
    ]);
    downloadText(`${base}-orcamento.csv`, toCsv(
      ["Categoria", "Item", "Valor", "Moeda", `Valor em ${trip.currency}`, "Pago", "Vencimento", "Parcelas", "Origem"],
      rows,
    ), "text/csv");
  }

  async function calendar() {
    try {
      const get = <R,>(t: PlanTable) => qc.fetchQuery(planQuery<R>(t, trip.id));
      const [transports, lodgings, activities, events] = await Promise.all([
        get<Transport>("transports"), get<Lodging>("lodgings"), get<Activity>("activities"), get<ItineraryEvent>("itinerary_events"),
      ]);
      const days = buildAgenda({ start: trip.start_date, end: trip.end_date, transports, lodgings, activities, events });
      const ics = buildIcs({ tripName: trip.name, tripId: trip.id, days, dayTz: (d) => dayTimezone(d, trip.trip_destinations) });
      downloadText(`${base}.ics`, ics, "text/calendar");
      toast.success("Calendário gerado. Abra o arquivo para importar no Google Agenda, Apple ou Outlook.");
    } catch (e) {
      toast.error(`Não foi possível gerar o calendário: ${(e as Error).message}`);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size="sm"><Download /> <span className="hidden sm:inline">Exportar</span></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Levar a viagem com você</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link to="/trips/$tripId/imprimir" params={{ tripId: trip.id }}><FileText /> Roteiro em PDF</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={calendar}><CalendarPlus /> Calendário (.ics)</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={expensesCsv}><FileSpreadsheet /> Gastos (CSV / Excel)</DropdownMenuItem>
        <DropdownMenuItem onClick={budgetCsv}><FileSpreadsheet /> Orçamento (CSV / Excel)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
