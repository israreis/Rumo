import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

/*
 * Rumo symbol: a camera lens (knurled barrel, brass focus ring, iris) holding a compass.
 * Fixed brand colours — the mark reads the same on light and dark grounds.
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

export function LogoMark({ className, animated = false, title }: { className?: string; animated?: boolean; title?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={cn("shrink-0", className)} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <circle cx="100" cy="100" r="97" fill="#2a211a" />
      <path d={KNURL} stroke="#4a3b2f" strokeWidth="2.2" strokeLinecap="round" />
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

/** Wordmark lockup: symbol + "rumo" in Fraunces. */
export function Logo({ to = "/", className }: { to?: "/" | "/trips"; className?: string }) {
  return (
    <Link to={to} className={cn("flex items-center gap-2.5 text-foreground", className)} aria-label="Rumo — início">
      <LogoMark className="size-8" />
      <span className="font-display text-[26px] font-semibold leading-none tracking-[-0.02em]">rumo</span>
    </Link>
  );
}

/** Full-screen splash used while the app boots or a signed-in page loads. */
export function Splash({ label = "Carregando…" }: { label?: string }) {
  return (
    <div className="grid min-h-[60vh] place-items-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <LogoMark animated className="size-20" />
        <p className="font-hand text-2xl text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
