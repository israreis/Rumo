import { queryOptions, useQueries } from "@tanstack/react-query";
import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun, type LucideIcon } from "lucide-react";
import { destinationForDay } from "./itinerary";
import type { Destination } from "./trips-api";

/**
 * Previsão do tempo via Open-Meteo (gratuito, sem chave). A previsão alcança 16 dias à frente;
 * dias mais distantes simplesmente não aparecem.
 */
export type DayWeather = { date: string; max: number; min: number; code: number; rain: number | null };
type Place = { lat: number; lng: number; tz: string };

const HOURS = 3600_000;
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

async function findPlace(city: string, country: string | null): Promise<Place | null> {
  const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=10&language=pt&format=json`);
  if (!r.ok) throw new Error("geocoding");
  const j: { results?: { latitude: number; longitude: number; timezone?: string; country?: string }[] } = await r.json();
  const list = j.results ?? [];
  const hit = (country && list.find((p) => p.country && norm(p.country) === norm(country))) || list[0];
  return hit ? { lat: hit.latitude, lng: hit.longitude, tz: hit.timezone || "auto" } : null;
}

async function forecast(p: Place): Promise<DayWeather[]> {
  const q = new URLSearchParams({
    latitude: String(p.lat), longitude: String(p.lng), timezone: p.tz, forecast_days: "16",
    daily: "temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max",
  });
  const r = await fetch(`https://api.open-meteo.com/v1/forecast?${q}`);
  if (!r.ok) throw new Error("forecast");
  const d = (await r.json()).daily as { time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[]; weather_code: number[]; precipitation_probability_max: (number | null)[] };
  return d.time.map((date, i) => ({
    date, max: Math.round(d.temperature_2m_max[i] ?? 0), min: Math.round(d.temperature_2m_min[i] ?? 0),
    code: d.weather_code[i] ?? 0, rain: d.precipitation_probability_max?.[i] ?? null,
  }));
}

export const weatherQuery = (city: string, country: string | null) =>
  queryOptions({
    queryKey: ["weather", norm(city), norm(country ?? "")],
    queryFn: async () => {
      const p = await findPlace(city, country);
      return p ? await forecast(p) : [];
    },
    staleTime: 3 * HOURS,
    gcTime: 12 * HOURS,
    retry: 1,
    refetchOnWindowFocus: false,
  });

/** Tempo previsto para cada dia da viagem, na cidade onde você estará. */
export function useTripWeather(dests: Destination[], days: string[], enabled = true) {
  const today = new Date().toISOString().slice(0, 10);
  const horizon = new Date(Date.now() + 15 * 24 * HOURS).toISOString().slice(0, 10);
  const inRange = days.some((d) => d >= today && d <= horizon);
  const places = dests.filter((d) => d.city?.trim());
  const results = useQueries({
    queries: places.map((d) => ({ ...weatherQuery(d.city, d.country ?? null), enabled: enabled && inRange })),
  });
  const byCity = new Map(places.map((d, i) => [norm(d.city), results[i]?.data ?? []]));
  const map = new Map<string, DayWeather & { city: string }>();
  for (const day of days) {
    const dest = destinationForDay(day, dests);
    if (!dest) continue;
    const w = byCity.get(norm(dest.city))?.find((x) => x.date === day);
    if (w) map.set(day, { ...w, city: dest.city });
  }
  return map;
}

/** Códigos WMO → ícone e descrição em português. */
export function weatherLabel(code: number): { icon: LucideIcon; label: string } {
  if (code === 0) return { icon: Sun, label: "Céu limpo" };
  if (code <= 2) return { icon: CloudSun, label: "Parcialmente nublado" };
  if (code === 3) return { icon: Cloud, label: "Nublado" };
  if (code === 45 || code === 48) return { icon: CloudFog, label: "Neblina" };
  if (code >= 51 && code <= 57) return { icon: CloudDrizzle, label: "Garoa" };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { icon: CloudRain, label: "Chuva" };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { icon: CloudSnow, label: "Neve" };
  if (code >= 95) return { icon: CloudLightning, label: "Tempestade" };
  return { icon: Cloud, label: "Nublado" };
}
