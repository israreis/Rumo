import type { StampShape, StampTone } from "@/components/Stamp";

/**
 * Virtual passport stamps. Passports are hardly stamped any more, so Rumo Trip keeps the
 * ritual like airport immigration: one stamp per country entered on a trip, dated by the
 * first arrival there and naming the city of entry. Only countries, as in a real passport. Derived from the trips themselves, so nothing to sync.
 */
export type StampItem = {
  key: string;
  tripId: string;
  tripName: string;
  kind: "country";
  top: string;
  main: string;
  bottom: string;
  date: string | null;
  earned: boolean;
  tone: StampTone;
  shape: StampShape;
  tilt: number;
  country: string | null;
  /** Cidades da viagem dentro desse país (para contar cidades visitadas). */
  cities: string[];
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

const clean = (city: string) => city.trim().replace(/\s*\(.*\)\s*$/, "");

/** One stamp per country per trip (Londres, York e Edimburgo → um carimbo "Reino Unido"). */
export function tripStamps(trip: TripLike, today: string): StampItem[] {
  const out: StampItem[] = [];
  const ended = !!trip.end_date && trip.end_date < today;
  const dests = [...trip.trip_destinations]
    .filter((d) => d.city.trim())
    .sort((a, b) => (a.arrival_date ?? "9").localeCompare(b.arrival_date ?? "9"));
  const byCountry = new Map<string, typeof dests>();
  for (const d of dests) {
    // Sem país informado, a própria cidade faz as vezes de país.
    const id = (d.country?.trim() || clean(d.city)).toLowerCase();
    (byCountry.get(id) ?? byCountry.set(id, []).get(id)!).push(d);
  }
  let n = 0;
  for (const [id, ds] of byCountry) {
    const entry = ds[0]!;
    const country = entry.country?.trim() || clean(entry.city);
    // Chegada fora do período (ou sem data) numa viagem encerrada: vale a data de volta.
    const date = entry.arrival_date && (!trip.end_date || entry.arrival_date <= trip.end_date) ? entry.arrival_date : trip.end_date;
    out.push({
      key: `${trip.id}:${id}`,
      tripId: trip.id,
      tripName: trip.name,
      kind: "country",
      top: clean(entry.city), // porto de entrada, como nos carimbos de aeroporto
      main: country,
      bottom: stampDate(date),
      date,
      // Carimbado no dia da chegada, ou de qualquer forma quando a viagem já terminou.
      earned: (!!date && date <= today) || ended,
      // Formato e cor alternam entre os carimbos.
      tone: TONES[n % TONES.length]!,
      shape: n++ % 2 === 0 ? "round" : "rect",
      tilt: (hash(`${trip.id}:${id}`) % 15) - 7,
      country,
      cities: [...new Set(ds.map((d) => clean(d.city).toLowerCase()))],
    });
  }
  return out;
}

/** Carimbo cadastrado à mão, de uma viagem anterior ao uso do app (tabela `manual_stamps`). */
export type ManualStamp = { id: string; country: string; entry_city: string | null; stamped_on: string; note: string | null };

export function manualStamp(m: ManualStamp): StampItem {
  const country = m.country.trim();
  const id = country.toLowerCase();
  const h = hash(id);
  const city = m.entry_city ? clean(m.entry_city) : null;
  return {
    key: `manual:${m.id}`,
    tripId: "manual",
    tripName: m.note?.trim() || "Viagem anterior",
    kind: "country",
    top: city || "", // sem cidade, o carimbo fica só com país e data
    main: country,
    bottom: stampDate(m.stamped_on),
    date: m.stamped_on,
    earned: true,
    tone: TONES[h % TONES.length]!,
    shape: (h >> 3) % 2 === 0 ? "round" : "rect",
    tilt: (hash(`manual:${m.id}`) % 15) - 7,
    country,
    cities: city ? [city.toLowerCase()] : [],
  };
}

export function collection(trips: TripLike[], today: string, manual: ManualStamp[] = []) {
  const all = [...trips.flatMap((t) => tripStamps(t, today)), ...manual.map(manualStamp)];
  const byDate = (a: StampItem, b: StampItem) => (a.date ?? "9").localeCompare(b.date ?? "9") || a.key.localeCompare(b.key);
  // Formato (redondo/retangular) e cor (couro, marinho, oliva) alternam na ordem cronológica,
  // como carimbos de imigrações diferentes; ciclos de 2 e 3 evitam combinações repetidas em sequência.
  const look = (i: number) => ({ shape: (i % 2 === 0 ? "round" : "rect") as StampShape, tone: TONES[i % TONES.length]! });
  const asc = all.filter((s) => s.earned).sort(byDate).map((s, i) => ({ ...s, ...look(i) }));
  const earned = [...asc].reverse();
  // "Para carimbar" sem repetidos: só a próxima chegada de cada país.
  const pendingSeen = new Set<string>();
  const pending = all
    .filter((s) => !s.earned)
    .sort(byDate)
    .filter((s) => {
      const id = s.main.toLowerCase();
      if (pendingSeen.has(id)) return false;
      pendingSeen.add(id);
      return true;
    })
    .map((s, i) => ({ ...s, ...look(asc.length + i) }));
  const cities = new Set(earned.flatMap((s) => s.cities.map((c) => `${s.main.toLowerCase()}|${c}`)));
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
