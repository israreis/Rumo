import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { activityCategory, budgetItemAmount, eventCategory, transportCategory } from "@/lib/budget";
import { convert, fetchRate } from "@/lib/fx";
import { planQuery, TRANSPORT_TYPES, type Activity, type ItineraryEvent, type Lodging, type PlanTable, type Transport } from "@/lib/plan-api";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { Trip } from "@/lib/trips-api";
import { lodgingTotal } from "./LodgingTab";
import { activityTotal } from "./ActivitiesTab";

export type BudgetItem = Database["public"]["Tables"]["budget_items"]["Row"];
export type Expense = Database["public"]["Tables"]["expenses"]["Row"];

export type Line = {
  key: string; table: PlanTable | "budget_items"; id: string; auto: boolean; daily: boolean;
  category: string; label: string; amount: number; currency: string; converted: number | null;
  paid: boolean; due_date: string | null; installments: number; first_month: string | null; row: any;
};

export function useBudget(trip: Trip) {
  const id = trip.id;
  const qc = useQueryClient();
  const { data: transports = [] } = useQuery(planQuery<Transport>("transports", id));
  const { data: lodgings = [] } = useQuery(planQuery<Lodging>("lodgings", id));
  const { data: activities = [] } = useQuery(planQuery<Activity>("activities", id));
  const { data: events = [] } = useQuery(planQuery<ItineraryEvent>("itinerary_events", id));
  const { data: items = [] } = useQuery(planQuery<BudgetItem>("budget_items" as PlanTable, id));
  const { data: expenses = [] } = useQuery(planQuery<Expense>("expenses" as PlanTable, id));

  const lines = useMemo<Line[]>(() => {
    const L: Line[] = [];
    const base = (r: any) => ({ id: r.id, row: r, converted: r.converted_amount, due_date: r.due_date ?? null, installments: r.installments ?? 1, first_month: r.first_installment_month ?? null });
    transports.filter((t) => t.price != null).forEach((t) => L.push({ ...base(t), key: `tr:${t.id}`, table: "transports", auto: true, daily: false,
      category: transportCategory(t.type), label: `${TRANSPORT_TYPES[t.type]} ${t.origin ?? ""} → ${t.destination ?? ""}`, amount: t.price!, currency: t.currency, paid: t.payment_status === "paid" }));
    lodgings.filter((l) => lodgingTotal(l) > 0).forEach((l) => L.push({ ...base(l), key: `lo:${l.id}`, table: "lodgings", auto: true, daily: false,
      category: "lodging", label: l.name, amount: lodgingTotal(l), currency: l.currency, paid: l.payment_status === "paid" }));
    activities.filter((a) => a.unit_price != null).forEach((a) => L.push({ ...base(a), key: `ac:${a.id}`, table: "activities", auto: true, daily: false,
      category: activityCategory(a.category), label: a.name, amount: activityTotal(a), currency: a.currency, paid: a.purchased }));
    events.filter((e) => e.cost != null).forEach((e) => L.push({ ...base(e), key: `ev:${e.id}`, table: "itinerary_events", auto: true, daily: false,
      category: eventCategory(e.category), label: e.title, amount: e.cost!, currency: trip.currency, converted: e.converted_amount ?? e.cost, paid: false }));
    items.forEach((i) => L.push({ ...base(i), key: `bi:${i.id}`, table: "budget_items", auto: false, daily: i.kind === "daily",
      category: i.category, label: i.description, amount: budgetItemAmount(i), currency: i.currency, paid: i.paid }));
    return L.map((l) => ({ ...l, converted: l.currency === trip.currency ? l.amount : l.converted }));
  }, [transports, lodgings, activities, events, items, trip.currency]);

  // Fill in the rate once for older rows that never got one; afterwards the stored rate is kept.
  const busy = useRef(false);
  useEffect(() => {
    const missing = lines.filter((l) => l.currency !== trip.currency && (l.row.fx_rate == null || l.row.converted_amount == null));
    if (!missing.length || busy.current) return;
    busy.current = true;
    (async () => {
      for (const l of missing) {
        const rate = l.row.fx_rate ?? (await fetchRate(l.currency, trip.currency));
        if (!rate) continue;
        await (supabase.from(l.table) as any).update({ fx_rate: rate, converted_amount: convert(l.amount, rate) }).eq("id", l.id);
      }
      await qc.invalidateQueries({ queryKey: ["plan"] });
      busy.current = false;
    })();
  }, [lines, trip.currency, qc]);

  return { lines, expenses, items };
}

export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
