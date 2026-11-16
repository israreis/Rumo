import { useId } from "react";
import { cn } from "@/lib/utils";

export type StampTone = "couro" | "marinho" | "oliva" | "erro" | "alerta";
export type StampShape = "round" | "rect" | "dashed";

/**
 * A passport stamp: one ink, a slight tilt, double border. `pending` draws a faint dashed
 * outline for a stamp not collected yet; `fresh` plays the "stamping" animation once.
 */
export function Stamp({
  top, main, bottom, tone = "couro", shape = "round", tilt = -6, pending = false, fresh = false, className, title,
}: {
  top: string; main: string; bottom?: string | undefined; tone?: StampTone; shape?: StampShape; tilt?: number;
  pending?: boolean; fresh?: boolean; className?: string; title?: string;
}) {
  const id = useId().replace(/:/g, "");
  const ink = pending ? "var(--tinta-suave)" : `var(--${tone})`;
  // Nomes longos ("Emirados Árabes Unidos") quebram em duas linhas, divididas no espaço mais perto do meio.
  const lines = splitName(main);
  const longest = Math.max(...lines.map((l) => l.length));
  const mainSize = longest > 13 ? 13 : longest > 11 ? 15 : longest > 8 ? 18 : 22;
  const two = lines.length > 1;
  const topSize = top.length > 18 ? 7.5 : top.length > 13 ? 8.5 : 10;
  // Tinta irregular: cada carimbo tem a sua semente, então falhas e respingos não se repetem.
  const seed = seedOf(`${top}|${main}|${bottom ?? ""}`);
  const inky = !pending;
  return (
    <svg
      viewBox="0 0 160 160"
      role="img"
      aria-label={title ?? `${main}${bottom ? `, ${bottom}` : ""}`}
      className={cn("shrink-0 select-none", pending && "opacity-45", fresh && "animate-carimbo", className)}
      style={{ color: ink }}
    >
      {inky && (
        <defs>
          <filter id={`worn-${id}`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed % 97} />
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -5 0 0 0 2.05" />
          </filter>
          <filter id={`patch-${id}`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="1" seed={(seed >> 7) % 97} />
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -3.2 0 0 0 1.35" />
          </filter>
          <mask id={`ink-${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width="160" height="160">
            <rect width="160" height="160" fill="white" />
            <rect width="160" height="160" filter={`url(#worn-${id})`} />
            <rect width="160" height="160" filter={`url(#patch-${id})`} opacity="0.7" />
          </mask>
        </defs>
      )}
      <g fill="currentColor" stroke="currentColor" transform={`rotate(${tilt} 80 80)`} mask={inky ? `url(#ink-${id})` : undefined}>
        {shape === "round" && (
          <>
            <defs><path id={`arc-${id}`} d="M80,80 m-52,0 a52,52 0 1,1 104,0 a52,52 0 1,1 -104,0" /></defs>
            <circle cx="80" cy="80" r="74" fill="none" strokeWidth="3" strokeDasharray={pending ? "6 5" : undefined} />
            <circle cx="80" cy="80" r="66" fill="none" strokeWidth="1.2" strokeDasharray="3 3" />
            <text stroke="none" className="font-sans" fontWeight="600" fontSize="10.5" letterSpacing="1.6">
              <textPath href={`#arc-${id}`}>{`${[top, bottom].filter(Boolean).join(" · ")} ·`.toUpperCase()}</textPath>
            </text>
            <Name lines={lines} y={87} size={mainSize} />
          </>
        )}
        {shape === "rect" && (
          <>
            <rect x="10" y="30" width="140" height="100" rx="10" fill="none" strokeWidth="3" strokeDasharray={pending ? "6 5" : undefined} />
            <rect x="18" y="38" width="124" height="84" rx="6" fill="none" strokeWidth="1.2" strokeDasharray="3 3" />
            {top && <text stroke="none" x="80" y="62" textAnchor="middle" className="font-sans" fontWeight="600" fontSize={topSize} letterSpacing="1.4">{top.toUpperCase()}</text>}
            <Name lines={lines} y={top ? (two ? 86 : 92) : two ? 78 : 84} size={mainSize + 1} />
            {bottom && <text stroke="none" x="80" y={top ? 112 : two ? 112 : 106} textAnchor="middle" className="font-sans" fontWeight="600" fontSize="10" letterSpacing="1.4">{bottom.toUpperCase()}</text>}
          </>
        )}
        {shape === "dashed" && (
          <>
            <circle cx="80" cy="80" r="70" fill="none" strokeWidth="3" strokeDasharray="6 4" />
            <text stroke="none" x="80" y="68" textAnchor="middle" className="font-sans" fontWeight="600" fontSize={topSize + 1} letterSpacing="1.6">{top.toUpperCase()}</text>
            <Name lines={lines} y={96} size={mainSize + 2} />
            {bottom && <text stroke="none" x="80" y="116" textAnchor="middle" className="font-sans" fontWeight="600" fontSize="10" letterSpacing="1.4">{bottom.toUpperCase()}</text>}
          </>
        )}
      </g>
      {inky && <Splatter seed={seed} />}
    </svg>
  );
}

function splitName(name: string): string[] {
  const n = name.trim();
  if (n.length <= 13 || !n.includes(" ")) return [n];
  const mid = n.length / 2;
  let best = -1;
  for (let i = 0; i < n.length; i++) if (n[i] === " " && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  return [n.slice(0, best), n.slice(best + 1)];
}

/** Nome principal do carimbo, em uma ou duas linhas centradas em torno de `y`. */
function Name({ lines, y, size }: { lines: string[]; y: number; size: number }) {
  const lh = size * 1.05;
  const first = y - ((lines.length - 1) * lh) / 2;
  return (
    <text stroke="none" x="80" textAnchor="middle" className="font-display" fontWeight="600" fontSize={size}>
      {lines.map((l, i) => (
        <tspan key={i} x="80" y={first + i * lh}>{l}</tspan>
      ))}
    </text>
  );
}

function seedOf(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Respingos e uma mancha mais carregada de tinta, em posições derivadas da semente. */
function Splatter({ seed }: { seed: number }) {
  let x = seed || 1;
  const rnd = () => ((x = Math.imul(x ^ (x >>> 15), 2246822507) ^ Math.imul(x ^ (x >>> 13), 3266489909)) >>> 0) / 4294967296;
  const dots = Array.from({ length: 3 + Math.floor(rnd() * 4) }, () => {
    const a = rnd() * Math.PI * 2, r = 62 + rnd() * 20;
    return { cx: 80 + Math.cos(a) * r, cy: 80 + Math.sin(a) * r, r: 0.6 + rnd() * 1.8 };
  });
  const a = rnd() * Math.PI * 2;
  const blot = { cx: 80 + Math.cos(a) * 70, cy: 80 + Math.sin(a) * 70, rx: 4 + rnd() * 5, ry: 2.5 + rnd() * 3, rot: (a * 180) / Math.PI + 90 };
  return (
    <g fill="currentColor" stroke="none" aria-hidden>
      <ellipse cx={blot.cx} cy={blot.cy} rx={blot.rx} ry={blot.ry} transform={`rotate(${blot.rot} ${blot.cx} ${blot.cy})`} opacity="0.45" />
      {dots.map((d, i) => <circle key={i} cx={d.cx} cy={d.cy} r={d.r} opacity={0.55 + (i % 3) * 0.15} />)}
    </g>
  );
}
