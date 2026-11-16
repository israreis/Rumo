import { memo, type ReactNode } from "react";

/**
 * Fundo das páginas do livreto. Inspirado na ideia do passaporte brasileiro de dedicar cada
 * par de páginas a uma região do país, com motivos desenhados aqui mesmo (formas simples e
 * originais, não as ilustrações oficiais), desfocados para ficarem abaixo dos carimbos.
 * Também o número da página perfurado, em matriz de furos, no canto externo.
 */

type Theme = { name: string; a: string; b: string; tint: string; art: ReactNode };

/* ---------- formas ---------- */
const waves = (y: number, n: number, amp: number, gap: number, color: string, w = 0.5) =>
  Array.from({ length: n }, (_, k) => {
    const yy = y + k * gap;
    let d = `M-5 ${yy}`;
    for (let x = -5; x <= 105; x += 5) d += ` Q ${x + 2.5} ${yy + (k % 2 ? amp : -amp)} ${x + 5} ${yy}`;
    return <path key={`w${y}-${k}`} d={d} fill="none" stroke={color} strokeWidth={w} />;
  });

const lighthouse = (x: number, y: number, c: string) => (
  <g key="lh" fill={c}>
    <polygon points={`${x - 3},${y} ${x + 3},${y} ${x + 2},${y - 26} ${x - 2},${y - 26}`} />
    <rect x={x - 3} y={y - 31} width={6} height={4} rx={1} />
    <polygon points={`${x - 3.5},${y - 31} ${x + 3.5},${y - 31} ${x},${y - 35}`} />
    <path d={`M${x + 3} ${y - 29} L${x + 22} ${y - 34} L${x + 22} ${y - 24} Z`} opacity={0.35} />
  </g>
);

const turtle = (x: number, y: number, c: string) => (
  <g key="tt" fill={c} transform={`rotate(-20 ${x} ${y})`}>
    <ellipse cx={x - 7} cy={y - 5} rx={4} ry={2} transform={`rotate(-35 ${x - 7} ${y - 5})`} />
    <ellipse cx={x + 7} cy={y - 5} rx={4} ry={2} transform={`rotate(35 ${x + 7} ${y - 5})`} />
    <ellipse cx={x - 6} cy={y + 6} rx={3} ry={1.6} transform={`rotate(30 ${x - 6} ${y + 6})`} />
    <ellipse cx={x + 6} cy={y + 6} rx={3} ry={1.6} transform={`rotate(-30 ${x + 6} ${y + 6})`} />
    <circle cx={x} cy={y - 10} r={2.4} />
    <ellipse cx={x} cy={y} rx={7} ry={9} />
    <path d={`M${x - 4} ${y - 3} L${x} ${y - 6} L${x + 4} ${y - 3} L${x + 4} ${y + 3} L${x} ${y + 6} L${x - 4} ${y + 3} Z`} fill="none" stroke="var(--papel)" strokeWidth={0.6} />
  </g>
);

const tiles = (x0: number, y0: number, cols: number, rows: number, s: number, c: string) => {
  const out: ReactNode[] = [];
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const x = x0 + i * s, y = y0 + j * s, r = (i * 7 + j * 3) % 4;
      out.push(
        <g key={`t${i}-${j}`} transform={`rotate(${r * 90} ${x + s / 2} ${y + s / 2})`}>
          <rect x={x} y={y} width={s} height={s} fill="none" stroke={c} strokeWidth={0.3} />
          <path d={`M${x} ${y} A ${s / 2} ${s / 2} 0 0 1 ${x + s / 2} ${y + s / 2} L ${x} ${y + s / 2} Z`} fill={c} />
          <circle cx={x + s * 0.75} cy={y + s * 0.75} r={s * 0.12} fill={c} />
        </g>,
      );
    }
  return out;
};

const owl = (x: number, y: number, c: string) => (
  <g key="ow" fill={c}>
    <ellipse cx={x} cy={y} rx={5} ry={7} />
    <circle cx={x} cy={y - 8} r={4} />
    <circle cx={x - 1.6} cy={y - 8.5} r={1.2} fill="var(--papel)" />
    <circle cx={x + 1.6} cy={y - 8.5} r={1.2} fill="var(--papel)" />
    <path d={`M${x - 2} ${y + 7} L${x - 2} ${y + 11} M${x + 2} ${y + 7} L${x + 2} ${y + 11}`} stroke={c} strokeWidth={0.8} />
    <path d={`M${x - 14} ${y + 11} L${x + 14} ${y + 11}`} stroke={c} strokeWidth={1} />
  </g>
);

const flower = (x: number, y: number, r: number, c: string, k: string) => (
  <g key={k} fill={c}>
    {Array.from({ length: 6 }, (_, i) => (
      <ellipse key={i} cx={x} cy={y - r} rx={r * 0.45} ry={r} transform={`rotate(${i * 60} ${x} ${y})`} opacity={0.8} />
    ))}
    <circle cx={x} cy={y} r={r * 0.4} fill="var(--papel)" />
  </g>
);

const kite = (x: number, y: number, s: number, c: string, k: string) => (
  <g key={k}>
    <polygon points={`${x},${y - s} ${x + s * 0.7},${y} ${x},${y + s * 1.2} ${x - s * 0.7},${y}`} fill={c} />
    <path d={`M${x} ${y + s * 1.2} q 3 6 -1 10 q -4 5 1 11`} fill="none" stroke={c} strokeWidth={0.5} />
  </g>
);

const toucan = (x: number, y: number, c: string, beak: string) => (
  <g key="tc">
    <ellipse cx={x} cy={y} rx={5} ry={8} fill={c} transform={`rotate(20 ${x} ${y})`} />
    <circle cx={x + 2} cy={y - 8} r={3.2} fill={c} />
    <path d={`M${x + 4} ${y - 9.5} Q ${x + 16} ${y - 9} ${x + 15} ${y - 5} Q ${x + 9} ${y - 5.5} ${x + 4.5} ${y - 6.5} Z`} fill={beak} />
    <path d={`M${x - 3} ${y + 7} L${x - 6} ${y + 15}`} stroke={c} strokeWidth={2} strokeLinecap="round" />
    <path d={`M${x - 14} ${y + 7} L${x + 12} ${y + 7}`} stroke={c} strokeWidth={0.8} />
  </g>
);

const calcadao = (y: number, c: string) => {
  let d = `M-5 ${y}`;
  for (let x = -5; x <= 105; x += 10) d += ` C ${x + 2} ${y - 6}, ${x + 3} ${y + 6}, ${x + 5} ${y} S ${x + 8} ${y - 6}, ${x + 10} ${y}`;
  return [0, 4, 8].map((o) => <path key={`cd${y}-${o}`} d={d} transform={`translate(0 ${o})`} fill="none" stroke={c} strokeWidth={1.4} />);
};

const cactus = (x: number, y: number, h: number, c: string, k: string) => (
  <g key={k} fill={c}>
    <rect x={x - 2.5} y={y - h} width={5} height={h} rx={2.5} />
    <path d={`M${x - 2} ${y - h * 0.45} h -5 a 2 2 0 0 1 -2 -2 v -${h * 0.25} a 2 2 0 0 1 4 0 v ${h * 0.12} h 3 Z`} />
    <path d={`M${x + 2} ${y - h * 0.6} h 5 a 2 2 0 0 0 2 -2 v -${h * 0.2} a 2 2 0 0 0 -4 0 v ${h * 0.1} h -3 Z`} />
  </g>
);

const star8 = (x: number, y: number, r: number, c: string, k: string) => (
  <g key={k} fill="none" stroke={c} strokeWidth={0.6}>
    <rect x={x - r} y={y - r} width={2 * r} height={2 * r} />
    <rect x={x - r} y={y - r} width={2 * r} height={2 * r} transform={`rotate(45 ${x} ${y})`} />
    <circle cx={x} cy={y} r={r * 0.35} fill={c} />
  </g>
);

const sun = (x: number, y: number, r: number, c: string) => (
  <g key="sun" stroke={c} fill={c}>
    <circle cx={x} cy={y} r={r} />
    {Array.from({ length: 16 }, (_, i) => {
      const a = (i * Math.PI) / 8;
      return <line key={i} x1={x + Math.cos(a) * (r + 2)} y1={y + Math.sin(a) * (r + 2)} x2={x + Math.cos(a) * (r + 6)} y2={y + Math.sin(a) * (r + 6)} strokeWidth={0.8} />;
    })}
  </g>
);

const lilyPad = (x: number, y: number, r: number, c: string, k: string) => (
  <g key={k}>
    <ellipse cx={x} cy={y} rx={r} ry={r * 0.45} fill={c} />
    <ellipse cx={x} cy={y - 0.8} rx={r * 0.92} ry={r * 0.38} fill="none" stroke="var(--papel)" strokeWidth={0.5} />
    <path d={`M${x} ${y} L${x + r} ${y - r * 0.15}`} stroke="var(--papel)" strokeWidth={0.8} />
  </g>
);

const meander = (y: number, c: string) => {
  let d = `M0 ${y}`;
  for (let x = 0; x < 100; x += 8) d += ` h 4 v -4 h -2 v 2 h -1 v -3 h 5 v 5 h 2`;
  return <path key={`mz${y}`} d={d} fill="none" stroke={c} strokeWidth={0.6} />;
};

const stork = (x: number, y: number, c: string) => (
  <g key="st" fill={c} stroke={c}>
    <ellipse cx={x} cy={y} rx={7} ry={4} strokeWidth={0} />
    <path d={`M${x + 5} ${y - 2} Q ${x + 7} ${y - 10} ${x + 6} ${y - 14}`} fill="none" strokeWidth={1.6} />
    <circle cx={x + 6} cy={y - 15} r={1.8} strokeWidth={0} />
    <path d={`M${x + 7} ${y - 15} L${x + 14} ${y - 12}`} strokeWidth={0.9} />
    <path d={`M${x - 1} ${y + 3} L${x - 2} ${y + 16} M${x + 2} ${y + 3} L${x + 3} ${y + 16}`} strokeWidth={0.6} />
  </g>
);

const grass = (y: number, c: string) => (
  <g key={`gr${y}`} stroke={c} strokeWidth={0.5}>
    {Array.from({ length: 40 }, (_, i) => {
      const x = i * 2.6;
      return <path key={i} d={`M${x} ${y} q 1 -4 ${(i % 3) - 1} -${5 + (i % 4)}`} fill="none" />;
    })}
  </g>
);

const araucaria = (x: number, y: number, h: number, c: string, k: string) => (
  <g key={k} fill={c}>
    <rect x={x - 0.7} y={y - h} width={1.4} height={h} />
    <path d={`M${x - h * 0.45} ${y - h} Q ${x} ${y - h * 0.82} ${x + h * 0.45} ${y - h} Q ${x + h * 0.3} ${y - h * 1.08} ${x} ${y - h * 1.02} Q ${x - h * 0.3} ${y - h * 1.08} ${x - h * 0.45} ${y - h} Z`} />
    <path d={`M${x - h * 0.3} ${y - h * 0.88} Q ${x} ${y - h * 0.75} ${x + h * 0.3} ${y - h * 0.88}`} fill="none" stroke={c} strokeWidth={0.8} />
  </g>
);

const lace = (y: number, c: string) => (
  <g key={`lc${y}`} fill="none" stroke={c} strokeWidth={0.4}>
    {Array.from({ length: 13 }, (_, i) => (
      <g key={i}>
        <circle cx={i * 8} cy={y} r={3.5} />
        <circle cx={i * 8} cy={y} r={1.5} />
        <path d={`M${i * 8 + 3.5} ${y} q 2 3 4.5 0`} />
      </g>
    ))}
  </g>
);

/* ---------- temas por região (pares de páginas) ---------- */
const THEMES: Theme[] = [
  {
    name: "Litoral", a: "var(--marinho)", b: "var(--mar)", tint: "var(--mar)",
    art: <>{waves(108, 7, 1.6, 3.2, "var(--mar)")}{lighthouse(80, 100, "var(--marinho)")}{turtle(28, 70, "var(--mar)")}</>,
  },
  {
    name: "Cerrado", a: "var(--caramelo)", b: "var(--oliva)", tint: "var(--caramelo)",
    art: <>{tiles(4, 4, 6, 2, 15.3, "var(--caramelo)")}{owl(72, 108, "var(--oliva)")}{flower(26, 102, 4, "var(--caramelo)", "f1")}{flower(36, 116, 3, "var(--oliva)", "f2")}</>,
  },
  {
    name: "Mata Atlântica", a: "var(--oliva)", b: "var(--couro)", tint: "var(--salvia)",
    art: <>{calcadao(118, "var(--tinta-suave)")}{kite(22, 30, 6, "var(--couro)", "k1")}{kite(78, 22, 4, "var(--mar)", "k2")}{toucan(64, 80, "var(--tinta)", "var(--caramelo)")}</>,
  },
  {
    name: "Caatinga", a: "var(--couro)", b: "var(--caramelo)", tint: "var(--caramelo)",
    art: <>{sun(78, 26, 9, "var(--caramelo)")}{cactus(24, 124, 34, "var(--oliva)", "c1")}{cactus(70, 126, 22, "var(--oliva)", "c2")}{star8(30, 34, 7, "var(--couro)", "s1")}{star8(50, 52, 4, "var(--couro)", "s2")}</>,
  },
  {
    name: "Amazônia", a: "var(--oliva)", b: "var(--mar)", tint: "var(--oliva)",
    art: <>{meander(10, "var(--couro)")}{meander(16, "var(--couro)")}{waves(96, 4, 1, 4, "var(--mar)", 0.4)}{lilyPad(30, 112, 14, "var(--oliva)", "l1")}{lilyPad(70, 124, 10, "var(--oliva)", "l2")}{flower(52, 108, 3.5, "var(--couro)", "vr")}</>,
  },
  {
    name: "Pantanal", a: "var(--mar)", b: "var(--oliva)", tint: "var(--salvia)",
    art: <>{waves(118, 5, 0.8, 3, "var(--mar)", 0.4)}{grass(116, "var(--oliva)")}{stork(66, 92, "var(--tinta)")}{stork(30, 80, "var(--tinta-suave)")}</>,
  },
  {
    name: "Sul", a: "var(--marinho)", b: "var(--oliva)", tint: "var(--marinho)",
    art: <>{lace(10, "var(--marinho)")}{araucaria(22, 128, 34, "var(--oliva)", "a1")}{araucaria(52, 128, 26, "var(--oliva)", "a2")}{araucaria(80, 128, 38, "var(--oliva)", "a3")}</>,
  },
];

export const themeFor = (page: number) => THEMES[Math.floor(Math.max(0, page) / 2) % THEMES.length]!;

/** Ilustração de fundo, desfocada e clara. O par de páginas (0–1, 2–3…) compartilha o tema. */
export const PageArt = memo(function PageArt({ page }: { page: number }) {
  const t = themeFor(page);
  // Em cada par, a página da esquerda mostra a metade esquerda da cena e a da direita a outra metade.
  const left = page % 2 === 0;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.10]" style={{ background: `linear-gradient(${left ? 160 : 200}deg, transparent 20%, ${t.tint} 65%, transparent 95%)` }} />
      <svg viewBox="0 0 100 140" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full opacity-[0.22] blur-[1.4px] dark:opacity-[0.16]">
        <g transform={left ? undefined : "translate(100 0) scale(-1 1)"}>{t.art}</g>
      </svg>
    </div>
  );
});

/* ---------- número perfurado ---------- */
const DOTS: Record<string, string[]> = {
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
};

/** Número da página em furos, como a numeração perfurada a laser dos passaportes. */
export function Perforated({ n, className }: { n: number; className?: string }) {
  const digits = String(n).padStart(2, "0").split("");
  const w = digits.length * 6 - 1;
  return (
    <svg viewBox={`0 0 ${w} 7`} aria-label={`Página ${n}`} className={className}>
      {digits.flatMap((d, i) =>
        DOTS[d]!.flatMap((row, y) =>
          [...row].map((on, x) =>
            on === "1" ? (
              <circle key={`${i}-${x}-${y}`} cx={i * 6 + x + 0.5} cy={y + 0.5} r={0.36} className="fill-tinta/45 dark:fill-black/60" stroke="var(--papel)" strokeWidth={0.08} />
            ) : null,
          ),
        ),
      )}
    </svg>
  );
}
