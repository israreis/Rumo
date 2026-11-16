import { cn } from "@/lib/utils";

/**
 * "Mostrador": the compass dial of the logo reused as a circular progress gauge.
 * 60 ticks; the filled share is drawn in couro (or erro when over 100%).
 */
export function Dial({ value, label, sub, className }: { value: number; label: string; sub?: string; className?: string }) {
  const pct = Math.max(0, value);
  const filled = Math.round(Math.min(pct, 100) * 0.6);
  const over = pct > 100;
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const a = (i * 6 * Math.PI) / 180;
    const long = i % 15 === 0;
    const r1 = 46, r2 = long ? 36 : 40;
    return { i, x1: 50 + r1 * Math.sin(a), y1: 50 - r1 * Math.cos(a), x2: 50 + r2 * Math.sin(a), y2: 50 - r2 * Math.cos(a), long };
  });
  return (
    <div className={cn("relative grid size-28 shrink-0 place-items-center", className)} role="img" aria-label={`${label}: ${Math.round(pct)}%`}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden>
        <circle cx="50" cy="50" r="49" fill="none" stroke="var(--latao)" strokeWidth="1.5" />
        {ticks.map((t) => (
          <line
            key={t.i}
            x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            strokeLinecap="round"
            strokeWidth={t.long ? 2.2 : 1.6}
            stroke={t.i < filled ? (over ? "var(--erro)" : "var(--couro)") : "var(--borda)"}
          />
        ))}
      </svg>
      <div className="text-center leading-tight">
        <div className="font-num text-xl font-medium">{Math.round(pct)}%</div>
        {sub && <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}
