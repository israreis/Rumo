import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

/*
 * Rumo Trip symbol: a camera lens (knurled barrel, brass focus ring, iris) holding a compass.
 * Fixed brand colours; on dark grounds the barrel gets a lighter metal tone and a brass rim
 * (via `dark:` classes, which beat the SVG presentation attributes) so its edge doesn't sink.
 * Same geometry as the SVG files in public/brand/.
 */
const C = 100;
const rad = (d: number) => (d * Math.PI) / 180;
const pt = (r: number, deg: number) => [C + r * Math.sin(rad(deg)), C - r * Math.cos(rad(deg))] as const;
const f = (n: number) => n.toFixed(2);

const KNURL = Array.from({ length: 96 }, (_, i) => {
  const a = (360 * i) / 96;
  const [x1, y1] = pt(93, a);
  const [x2, y2] = pt(85, a);
  return `M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`;
}).join("");

const TICKS = Array.from({ length: 72 }, (_, i) => i * 5)
  .filter((d) => d % 90 !== 0)
  .map((d) => {
    const len = d % 45 === 0 ? 6 : 4;
    const [x1, y1] = pt(70, d);
    const [x2, y2] = pt(70 - len, d);
    return `M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`;
  })
  .join("");

const CARDINALS = [0, 90, 180, 270].map((d) => {
  const [x1, y1] = pt(70, d);
  const [x2, y2] = pt(58, d);
  return { d, path: `M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}` };
});

const IRIS = Array.from({ length: 6 }, (_, k) => {
  const t = k * 60 + 15;
  const h = pt(50, t);
  const q = pt(58, t + 14);
  const b = pt(60, t + 34);
  return { h, blade: `M${f(h[0])} ${f(h[1])}Q${f(q[0])} ${f(q[1])} ${f(b[0])} ${f(b[1])}` };
});
const IRIS_POLY = IRIS.map(({ h }) => `${f(h[0])},${f(h[1])}`).join(" ");
const IRIS_BLADES = IRIS.map((i) => i.blade).join("");

const ROSE = Array.from({ length: 8 }, (_, k) => {
  const r = k % 2 === 0 ? 44 : 44 * 0.18 * 2.2;
  const [x, y] = pt(r, k * 45);
  return `${f(x)},${f(y)}`;
}).join(" ");

const GLARE = (() => {
  const [x1, y1] = pt(63, -70);
  const [x2, y2] = pt(63, -28);
  return `M${f(x1)} ${f(y1)}A63 63 0 0 1 ${f(x2)} ${f(y2)}`;
})();

/**
 * The Rumo Trip symbol. Animated by default (the needle swings and settles on north every 5 s,
 * paused under prefers-reduced-motion); pass `animated={false}` for print and tiny sizes.
 */
export function LogoMark({ className, animated = true, title }: { className?: string; animated?: boolean; title?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={cn("shrink-0", className)} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <circle cx="100" cy="100" r="97" fill="#2a211a" className="dark:fill-[#3d3026]" />
      <path d={KNURL} stroke="#4a3b2f" strokeWidth="2.2" strokeLinecap="round" className="dark:stroke-[#7d6753]" />
      <circle cx="100" cy="100" r="96" fill="none" stroke="#c9a66b" strokeWidth="3" className="hidden dark:inline" />
      <circle cx="100" cy="7.5" r="3.2" fill="#b9783f" />
      <circle cx="100" cy="100" r="80" fill="none" stroke="#a88449" strokeWidth="3.5" />
      <circle cx="100" cy="100" r="74" fill="#f3eee4" />
      <circle cx="100" cy="100" r="74" fill="none" stroke="#d9cdb6" strokeWidth="1" />
      <path d={TICKS} stroke="#2a211a" strokeWidth="1.1" strokeLinecap="round" />
      {CARDINALS.map((c) => (
        <path key={c.d} d={c.path} stroke={c.d === 0 ? "#8a4f2a" : "#2a211a"} strokeWidth="2.6" strokeLinecap="round" />
      ))}
      <path d={IRIS_BLADES} fill="none" stroke="#a88449" strokeWidth="1" opacity="0.55" />
      <polygon points={IRIS_POLY} fill="none" stroke="#a88449" strokeWidth="1.2" opacity="0.8" />
      <polygon points={ROSE} fill="#e2d6c1" />
      <g className={animated ? "agulha" : undefined} transform={animated ? undefined : "rotate(-12 100 100)"}>
        <polygon points="100,48 108.5,100 91.5,100" fill="#8a4f2a" />
        <polygon points="100,152 108.5,100 91.5,100" fill="#2a211a" />
      </g>
      <circle cx="100" cy="100" r="7" fill="#a88449" />
      <circle cx="100" cy="100" r="2.6" fill="#2a211a" />
      <path d={GLARE} fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

/** Wordmark lockup: symbol + "Rumo Trip" in Fraunces. */
export function Logo({ to = "/", className }: { to?: "/" | "/trips"; className?: string }) {
  return (
    <Link to={to} className={cn("flex items-center gap-2.5 text-foreground", className)} aria-label="Rumo Trip — início">
      <LogoMark className="size-8" />
      <Wordmark className="text-[26px]" />
    </Link>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return <span className={cn("font-display font-semibold leading-none tracking-[-0.02em]", className)}>Rumo Trip</span>;
}

/** Passport version of the mark: leather cover with the lens-compass emblem in brass. */
export function PassportMark({ className, title }: { className?: string; title?: string }) {
  const cx = 104, cy = 96;
  const ticks = Array.from({ length: 12 }, (_, k) => {
    const d = k * 30, a = (d * Math.PI) / 180, r2 = d % 90 === 0 ? 17 : 20;
    return `M${f(cx + 23 * Math.sin(a))} ${f(cy - 23 * Math.cos(a))}L${f(cx + r2 * Math.sin(a))} ${f(cy - r2 * Math.cos(a))}`;
  }).join("");
  const b = "#d2b67e";
  return (
    <svg viewBox="0 0 200 200" className={cn("shrink-0", className)} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <rect x="46" y="22" width="118" height="160" rx="10" fill="#e6dccb" />
      <rect x="38" y="18" width="120" height="164" rx="10" fill="#6e3d1f" />
      <rect x="38" y="18" width="14" height="164" rx="7" fill="#5a3118" />
      <rect x="48" y="18" width="4" height="164" fill="#5a3118" />
      <rect x="58" y="26" width="92" height="148" rx="6" fill="none" stroke="#a88449" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.8" />
      <rect x="78" y="40" width="52" height="4" rx="2" fill={b} />
      <circle cx={cx} cy={cy} r="30" fill="none" stroke={b} strokeWidth="3" />
      <circle cx={cx} cy={cy} r="23" fill="none" stroke={b} strokeWidth="1.2" />
      <path d={ticks} stroke={b} strokeWidth="1.4" strokeLinecap="round" />
      <g transform={`rotate(-12 ${cx} ${cy})`}>
        <polygon points={`${cx},${cy - 17} ${cx + 4.5},${cy} ${cx - 4.5},${cy}`} fill={b} />
        <polygon points={`${cx},${cy + 17} ${cx + 4.5},${cy} ${cx - 4.5},${cy}`} fill="none" stroke={b} strokeWidth="1.3" strokeLinejoin="round" />
      </g>
      <circle cx={cx} cy={cy} r="2.4" fill={b} />
      <rect x="74" y="140" width="60" height="4.5" rx="2.2" fill={b} />
      <rect x="84" y="150" width="40" height="3" rx="1.5" fill={b} opacity="0.75" />
      <rect x="96" y="160" width="16" height="10" rx="2" fill="none" stroke={b} strokeWidth="1.3" />
      <circle cx="104" cy="165" r="2.2" fill="none" stroke={b} strokeWidth="1.1" />
      <rect x="139" y="14" width="6" height="172" rx="3" fill="#b9783f" />
      <rect x="139" y="14" width="2" height="172" rx="1" fill="#d69a62" opacity="0.7" />
    </svg>
  );
}

/** Full-screen splash used while the app boots or a signed-in page loads. */
export function Splash({ label = "Carregando…", full = false }: { label?: string; full?: boolean }) {
  return (
    <div className={cn("grid place-items-center", full ? "min-h-dvh" : "min-h-[60vh]")} role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <LogoMark animated className="size-20" />
        <p className="font-hand text-2xl text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
