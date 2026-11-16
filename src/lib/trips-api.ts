import { supabase } from "@/integrations/supabase/client";
import type { TripStatus } from "./trip-utils";

export type Destination = {
  id?: string;
  city: string;
  country: string | null;
  arrival_date: string | null;
  departure_date: string | null;
  timezone?: string | null;
  currency?: string | null;
};
export type Traveler = { id?: string; name: string; email: string | null };
export type Trip = {
  id: string;
  owner_id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  travelers_count: number;
  currency: string;
  budget: number | null;
  cover_url: string | null;
  status_override: TripStatus | null;
  iof_pct: number;
  card_spread_pct: number;
  public_token?: string | null;
  trip_destinations: Destination[];
  trip_travelers: Traveler[];
};
export type TripInput = Omit<Trip, "id" | "owner_id" | "public_token" | "trip_destinations" | "trip_travelers"> & {
  destinations: Destination[];
  travelers: Traveler[];
};

const SELECT =
  "*, trip_destinations(id, city, country, arrival_date, departure_date, timezone, currency, position), trip_travelers(id, name, email, position)";

function sortChildren(t: any): Trip {
  t.trip_destinations?.sort((a: any, b: any) => a.position - b.position);
  t.trip_travelers?.sort((a: any, b: any) => a.position - b.position);
  return t as Trip;
}

export async function listTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from("trips")
    .select(SELECT)
    .order("start_date", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []).map(sortChildren);
}

export async function getTrip(id: string): Promise<Trip | null> {
  const { data, error } = await supabase.from("trips").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? sortChildren(data) : null;
}

async function replaceChildren(tripId: string, input: Pick<TripInput, "destinations" | "travelers">) {
  await supabase.from("trip_destinations").delete().eq("trip_id", tripId);
  await supabase.from("trip_travelers").delete().eq("trip_id", tripId);
  const dests = input.destinations
    .filter((d) => d.city.trim())
    .map((d, i) => ({
      trip_id: tripId,
      city: d.city.trim(),
      country: d.country?.trim() || null,
      arrival_date: d.arrival_date || null,
      departure_date: d.departure_date || null,
      timezone: d.timezone || null,
      currency: d.currency || null,
      position: i,
    }));
  const travs = input.travelers
    .filter((t) => t.name.trim())
    .map((t, i) => ({ trip_id: tripId, name: t.name.trim(), email: t.email?.trim() || null, position: i }));
  if (dests.length) {
    const { error } = await supabase.from("trip_destinations").insert(dests);
    if (error) throw error;
  }
  if (travs.length) {
    const { error } = await supabase.from("trip_travelers").insert(travs);
    if (error) throw error;
  }
}

function tripRow(input: TripInput) {
  const { destinations: _d, travelers: _t, ...row } = input;
  return { ...row, start_date: row.start_date || null, end_date: row.end_date || null };
}

export async function saveTrip(input: TripInput, id?: string): Promise<string> {
  if (id) {
    const { error } = await supabase.from("trips").update(tripRow(input)).eq("id", id);
    if (error) throw error;
    await replaceChildren(id, input);
    return id;
  }
  const { data: u } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("trips")
    .insert({ ...tripRow(input), owner_id: u.user!.id })
    .select("id")
    .single();
  if (error) throw error;
  await replaceChildren(data.id, input);
  return data.id;
}

export async function duplicateTrip(trip: Trip): Promise<string> {
  return saveTrip({
    name: `${trip.name} (cópia)`,
    start_date: trip.start_date,
    end_date: trip.end_date,
    travelers_count: trip.travelers_count,
    currency: trip.currency,
    budget: trip.budget,
    cover_url: trip.cover_url,
    status_override: null,
    iof_pct: trip.iof_pct,
    card_spread_pct: trip.card_spread_pct,
    destinations: trip.trip_destinations.map(({ id: _i, ...d }) => d),
    travelers: trip.trip_travelers.map(({ id: _i, ...t }) => t),
  });
}

export async function deleteTrip(id: string) {
  const { error } = await supabase.from("trips").delete().eq("id", id);
  if (error) throw error;
}

/** Uploads to the user's private folder and returns a long-lived viewing link. */
export async function uploadImage(file: File, folder: string): Promise<string> {
  const { data: u } = await supabase.auth.getUser();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${u.user!.id}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
  if (error) throw error;
  const { data, error: e2 } = await supabase.storage
    .from("media")
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (e2) throw e2;
  return data.signedUrl;
}
