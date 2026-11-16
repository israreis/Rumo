import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type T = Database["public"]["Tables"];
export type Transport = T["transports"]["Row"];
export type Lodging = T["lodgings"]["Row"];
export type Activity = T["activities"]["Row"];
export type ItineraryEvent = T["itinerary_events"]["Row"];
export type PlanTable = "transports" | "lodgings" | "activities" | "itinerary_events" | "budget_items" | "expenses" | "traveler_documents" | "emergency_contacts" | "checklist_items" | "trip_notes";

const ORDER: Record<PlanTable, string> = {
  transports: "departure_at",
  lodgings: "check_in_date",
  activities: "position",
  itinerary_events: "position",
  budget_items: "created_at",
  expenses: "date",
  traveler_documents: "created_at",
  emergency_contacts: "created_at",
  checklist_items: "position",
  trip_notes: "created_at",
};

export const planQuery = <R,>(table: PlanTable, tripId: string) =>
  queryOptions({
    queryKey: ["plan", table, tripId],
    queryFn: async () => {
      const { data, error } = await (supabase.from(table) as any)
        .select("*").eq("trip_id", tripId).order(ORDER[table], { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as R[];
    },
  });

export async function saveRow(table: PlanTable, row: Record<string, any>) {
  const clean: any = Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v === "" ? null : v]));
  const q = supabase.from(table) as any;
  const { error } = clean.id ? await q.update(clean).eq("id", clean.id) : await q.insert(clean);
  if (error) throw error;
}

export async function deleteRow(table: PlanTable, id: string) {
  const { error } = await (supabase.from(table) as any).delete().eq("id", id);
  if (error) throw error;
}

export async function updateMany(table: "activities" | "itinerary_events", rows: { id: string; [k: string]: any }[]) {
  await Promise.all(rows.map(({ id, ...r }) => (supabase.from(table) as any).update(r).eq("id", id)));
}

/** Free geocoding via OpenStreetMap Nominatim; returns null when not found. */
export async function geocode(q: string | null | undefined): Promise<{ lat: number; lng: number } | null> {
  if (!q?.trim()) return null;
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`, {
      headers: { "Accept-Language": "pt-BR" },
    });
    const j = await r.json();
    return j[0] ? { lat: +j[0].lat, lng: +j[0].lon } : null;
  } catch {
    return null;
  }
}

export const TRANSPORT_TYPES: Record<string, string> = {
  flight: "Voo", train: "Trem", bus: "Ônibus", car: "Carro alugado", transfer: "Transfer", ferry: "Ferry", other: "Outro",
};
export const PAYMENT_STATUS: Record<string, string> = { pending: "Pendente", deposit: "Sinal pago", paid: "Pago" };
export const LODGING_TYPES: Record<string, string> = { hotel: "Hotel", hostel: "Hostel", apartment: "Apartamento", other: "Outro" };
export const ACTIVITY_CATEGORIES: Record<string, string> = {
  attraction: "Atração", tour: "Passeio", museum: "Museu", show: "Show", restaurant: "Restaurante", other: "Outro",
};
export const PRIORITIES: Record<string, string> = { must: "Imperdível", optional: "Se der tempo" };
export const EVENT_CATEGORIES: Record<string, string> = {
  transport: "Transporte", lodging: "Hospedagem", activity: "Atividade", meal: "Refeição", free: "Livre",
};
