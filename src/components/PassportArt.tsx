import { memo } from "react";

/**
 * Fundo das páginas do livreto, no espírito do passaporte brasileiro: gravuras de fauna e
 * paisagens do Brasil em azul acinzentado sobre papel com hachuras laranja.
 * As imagens são gravuras e desenhos antigos em domínio público (Wikimedia Commons; ver
 * public/passport-art/CREDITOS.md), já convertidas para a tinta azul com fundo transparente.
 * A ordem garante arara-azul, harpia, onça-pintada e arara-canindé nas primeiras páginas;
 * depois o ciclo continua, e uma imagem só se repete 10 páginas depois.
 */
type Art = { src: string; alt: string; box: string };

const ARTS: Art[] = [
  { src: "/passport-art/azul.webp", alt: "Arara-azul", box: "right-[4%] bottom-[12%] h-[52%]" },
  { src: "/passport-art/harpia.webp", alt: "Harpia", box: "right-[3%] bottom-[8%] h-[64%]" },
  { src: "/passport-art/onca.webp", alt: "Onça-pintada", box: "left-[4%] right-[4%] bottom-[14%] h-[40%]" },
  { src: "/passport-art/caninde.webp", alt: "Arara-canindé", box: "right-[6%] bottom-[10%] h-[58%]" },
  { src: "/passport-art/tucano.webp", alt: "Tucano", box: "left-[6%] bottom-[12%] h-[50%]" },
  { src: "/passport-art/arcos.webp", alt: "Arcos da Lapa, Rio de Janeiro", box: "left-[2%] right-[2%] bottom-[16%] h-[38%]" },
  { src: "/passport-art/tamandua.webp", alt: "Tamanduá-bandeira", box: "left-[4%] right-[4%] bottom-[12%] h-[38%]" },
  { src: "/passport-art/tuiuiu.webp", alt: "Tuiuiú", box: "right-[8%] bottom-[10%] h-[55%]" },
  { src: "/passport-art/anta.webp", alt: "Anta", box: "left-[4%] right-[4%] bottom-[14%] h-[38%]" },
  { src: "/passport-art/capivara.webp", alt: "Capivara", box: "left-[4%] right-[4%] bottom-[12%] h-[36%]" },
];

export const artFor = (page: number) => ARTS[Math.max(0, page) % ARTS.length]!;

/** Gravura de fundo da página, clara e levemente desfocada, sempre abaixo dos carimbos. */
export const PageArt = memo(function PageArt({ page }: { page: number }) {
  const a = artFor(page);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <img
        src={a.src}
        alt=""
        loading="lazy"
        draggable={false}
        className={`absolute ${a.box} m-auto w-auto max-w-[92%] object-contain opacity-[0.5] blur-[0.4px] dark:opacity-30 dark:invert`}
      />
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
              <circle key={`${i}-${x}-${y}`} cx={i * 6 + x + 0.5} cy={y + 0.5} r={0.38} className="fill-tinta/60 dark:fill-black/70" stroke="var(--linho)" strokeWidth={0.1} />
            ) : null,
          ),
        ),
      )}
    </svg>
  );
}
