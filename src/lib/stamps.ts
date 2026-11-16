import type { StampShape, StampTone } from "@/components/Stamp";

/**
 * Virtual passport stamps. Passports are hardly stamped any more, so Rumo keeps the
 * ritual: every city of a trip is a stamp, collected on its arrival day; a finished trip
 * adds a "Viagem concluída" stamp. Derived from the trips themselves, so nothing to sync.
 */
export type StampItem = {
  key: string;
  tripId: string;
  tripName: string;
  kind: "city" | "trip";
  top: string;
  main: string;
  bottom: string;
  date: string | null;
  earned: boolean;
  tone: StampTone;
  shape: StampShape;
  tilt: number;
  country: string | null;
};

type TripLike = {
  id: string;
  name: string;
  end_date: string | null;
  trip_destinations: { city: string; country: string | null; arrival_date: string | null }[];
};

const TONES: StampTone[] = ["couro", "marinho", "oliva"];
const MONTHS = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** "2027-10-21" → "21 OUT 2027" */
export function stampDate(d: string | null) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day} ${MONTHS[Number(m) - 1] ?? ""} ${y}`;
}

/** Same city twice in one trip (e.g. back to Edimburgo) is one stamp, dated by the first arrival. */
export function tripStamps(trip: TripLike, today: string): StampItem[] {
  const seen = new Set<string>();
  const out: StampItem[] = [];
  const ended = !!trip.end_date && trip.end_date < today;
  const dests = [...trip.trip_destinations].sort((a, b) => (a.arrival_date ?? "9").localeCompare(b.arrival_date ?? "9"));
  for (const d of dests) {
    const city = d.city.trim();
    const id = city.toLowerCase();
    if (!city || seen.has(id)) continue;
    seen.add(id);
    const h = hash(`${trip.id}:${id}`);
    // Chegada fora do período (ou sem data) numa viagem encerrada: vale a data de volta.
    const date = d.arrival_date && (!trip.end_date || d.arrival_date <= trip.end_date) ? d.arrival_date : trip.end_date;
    out.push({
      key: `${trip.id}:${id}`,
      tripId: trip.id,
      tripName: trip.name,
      kind: "city",
      top: d.country?.trim() || "Chegada",
      main: city.replace(/\s*\(.*\)\s*$/, ""),
      bottom: stampDate(date),
      date,
      // Carimbado no dia da chegada, ou de qualquer forma quando a viagem já terminou.
      earned: (!!date && date <= today) || ended,
      tone: TONES[hash(d.country?.trim().toLowerCase() || id) % TONES.length]!,
      shape: h % 2 === 0 ? "round" : "rect",
      tilt: (h % 15) - 7,
      country: d.country?.trim() || null,
    });
  }
  if (trip.end_date) {
    out.push({
      key: `${trip.id}:done`,
      tripId: trip.id,
      tripName: trip.name,
      kind: "trip",
      top: "Viagem",
      main: "Concluída",
      bottom: stampDate(trip.end_date),
      date: trip.end_date,
      earned: trip.end_date < today,
      tone: "oliva",
      shape: "rect",
      tilt: (hash(trip.id) % 9) - 4,
      country: null,
    });
  }
  return out;
}

export function collection(trips: TripLike[], today: string) {
  const all = trips.flatMap((t) => tripStamps(t, today));
  const earned = all.filter((s) => s.earned).sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  const pending = all.filter((s) => !s.earned).sort((a, b) => (a.date ?? "9").localeCompare(b.date ?? "9"));
  const cities = new Set(earned.filter((s) => s.kind === "city").map((s) => s.main.toLowerCase()));
  const countries = new Set(earned.filter((s) => s.country).map((s) => s.country!.toLowerCase()));
  return { earned, pending, cities: cities.size, countries: countries.size };
}

/* Which earned stamps the user already saw, so new ones get the stamping animation once. */
const SEEN = "rumo:stamps-seen";
export function seenStamps(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}
export function markStampsSeen(keys: string[]) {
  try {
    localStorage.setItem(SEEN, JSON.stringify([...new Set([...seenStamps(), ...keys])]));
  } catch {
    /* storage unavailable: the animation simply plays again */
  }
}
