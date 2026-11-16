import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapPoint = { lat: number; lng: number; label: string; kind: "lodging" | "activity" | "event" };
const COLORS = { lodging: "#1f6f78", activity: "#d9773b", event: "#5b6b7a" };

export default function DayMap({ points }: { points: MapPoint[] }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!el.current || map.current) return;
    map.current = L.map(el.current, { scrollWheelZoom: false }).setView([38.72, -9.14], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap", maxZoom: 19,
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => { map.current?.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    if (!map.current || !layer.current) return;
    layer.current.clearLayers();
    points.forEach((p, i) => {
      L.circleMarker([p.lat, p.lng], { radius: 9, color: "#fff", weight: 2, fillColor: COLORS[p.kind], fillOpacity: 1 })
        .bindTooltip(`${i + 1}. ${p.label}`).addTo(layer.current!);
    });
    if (points.length === 1) map.current.setView([points[0]!.lat, points[0]!.lng], 14);
    else if (points.length > 1) map.current.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: [30, 30] });
  }, [points]);

  return <div ref={el} className="h-full w-full" />;
}
