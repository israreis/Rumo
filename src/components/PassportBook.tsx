import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus } from "lucide-react";
import { Stamp } from "@/components/Stamp";
import { Button } from "@/components/ui/button";
import type { StampItem } from "@/lib/stamps";
import { maskPassport, type PassportState } from "@/lib/passport";
import { PageArt, Perforated } from "@/components/PassportArt";
import { cn } from "@/lib/utils";

/**
 * O passaporte como livreto: página de identificação + páginas de "vistos" com até
 * 4 carimbos cada. No computador abre em duas páginas; no celular, uma por vez.
 * A troca de página é uma folha que gira em 3D (Web Animations), com arrastar,
 * setas do teclado e botões.
 */
const PER_PAGE = 4;
const DURATION = 750;

type Holder = {
  name: string | null;
  avatar: string | null;
  passportLast4: string | null;
  passportExpiry: string | null;
  passportState: PassportState;
  onEditPassport?: () => void;
  onAddStamps?: () => void;
};

export function PassportBook({ stamps, seen, holder, counts }: {
  stamps: StampItem[]; // em ordem cronológica
  seen: Set<string>; // carimbos já vistos neste aparelho (os demais ganham a animação)
  holder: Holder;
  counts: { stamps: number; cities: number; countries: number };
}) {
  const wide = useWide();
  const per = wide ? 2 : 1;

  // Páginas: identificação, vistos, e pelo menos uma página em branco no fim (número par).
  const pages = useMemo(() => {
    const chunks: StampItem[][] = [];
    for (let i = 0; i < stamps.length; i += PER_PAGE) chunks.push(stamps.slice(i, i + PER_PAGE));
    const list: ReactNode[] = [<IdPage key="id" holder={holder} counts={counts} />];
    chunks.forEach((c, i) => list.push(<VisaPage key={`v${i}`} stamps={c} seen={seen} />));
    list.push(<VisaPage key="blank" stamps={[]} seen={seen} hint />);
    if (list.length % 2) list.push(<VisaPage key="blank2" stamps={[]} seen={seen} />);
    return list;
  }, [stamps, seen, holder, counts]);

  // Abre na página do primeiro carimbo novo, se houver.
  const firstFreshPage = useMemo(() => {
    if (!seen.size) return 0;
    const i = stamps.findIndex((s) => !seen.has(s.key));
    return i < 0 ? 0 : 1 + Math.floor(i / PER_PAGE);
  }, [stamps, seen]);

  const [page, setPage] = useState(firstFreshPage); // primeira página visível
  const view = per === 2 ? page - (page % 2) : page; // em dupla, começa sempre em página par
  const last = pages.length - per;

  const [turn, setTurn] = useState<null | { dir: 1 | -1 }>(null);
  const leaf = useRef<HTMLDivElement>(null);

  const go = useCallback((dir: 1 | -1) => {
    if (turn) return;
    const target = view + dir * per;
    if (target < 0 || target > last) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setPage(target);
    setTurn({ dir });
  }, [turn, view, per, last]);

  // Roda a animação da folha assim que ela é montada.
  useEffect(() => {
    if (!turn || !leaf.current) return;
    const { dir } = turn;
    const single = per === 1;
    const frames = single
      ? dir === 1
        ? [{ transform: "rotateY(0deg)" }, { transform: "rotateY(-180deg)" }]
        : [{ transform: "rotateY(-180deg)" }, { transform: "rotateY(0deg)" }]
      : dir === 1
        ? [{ transform: "rotateY(0deg)" }, { transform: "rotateY(-180deg)" }]
        : [{ transform: "rotateY(0deg)" }, { transform: "rotateY(180deg)" }];
    const a = leaf.current.animate(frames, { duration: DURATION, easing: "cubic-bezier(.45,.05,.3,1)", fill: "forwards" });
    a.finished.then(() => {
      setPage(view + dir * per);
      setTurn(null);
    }).catch(() => {});
    return () => a.cancel();
  }, [turn]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input, textarea, [contenteditable]")) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  // Arrastar para os lados vira a página.
  const startX = useRef<number | null>(null);
  const onDown = (e: React.PointerEvent) => { startX.current = e.clientX; };
  const onUp = (e: React.PointerEvent) => {
    if (startX.current == null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
  };

  const P = (i: number) => (i >= 0 && i < pages.length ? pages[i] : null);

  // Índices do que fica parado por baixo e do que vai na folha que gira (frente/verso).
  let under: number[];
  let front = -1, back = -1;
  if (per === 2) {
    under = [view, view + 1];
    if (turn?.dir === 1) { under = [view, view + 3]; front = view + 1; back = view + 2; }
    if (turn?.dir === -1) { under = [view - 2, view + 1]; front = view; back = view - 1; }
  } else {
    under = [view];
    if (turn?.dir === 1) { under = [view + 1]; front = view; }
    if (turn?.dir === -1) { under = [view]; front = view - 1; }
  }
  const sides = per === 2 ? (["left", "right"] as const) : (["right"] as const);

  return (
    <div className="mx-auto w-full max-w-[52rem]">
      <div
        className="paper-light relative touch-pan-y select-none rounded-[20px] bg-couro p-2 shadow-lift sm:p-3"
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerCancel={() => (startX.current = null)}
      >
        <div className={cn("relative grid [perspective:2200px]", per === 2 ? "grid-cols-2" : "grid-cols-1 overflow-hidden rounded-[10px]")}>
          {under.map((idx, i) => (
            <Sheet key={i} side={sides[i]!} number={idx}>{P(idx)}</Sheet>
          ))}
          {turn && (
            <div
              ref={leaf}
              className="absolute top-0 h-full [transform-style:preserve-3d]"
              style={{
                width: per === 2 ? "50%" : "100%",
                left: per === 2 && turn.dir === -1 ? 0 : per === 2 ? "50%" : 0,
                transformOrigin: per === 2 && turn.dir === -1 ? "right center" : "left center",
                transform: per === 1 && turn.dir === -1 ? "rotateY(-180deg)" : "rotateY(0deg)",
              }}
            >
              <div className="absolute inset-0 [backface-visibility:hidden]">
                <Sheet side={per === 2 && turn.dir === -1 ? "left" : "right"} number={front} lifting>{P(front)}</Sheet>
              </div>
              <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <Sheet side={per === 2 && turn.dir === -1 ? "right" : "left"} number={back} lifting>{per === 2 ? P(back) : <Paper />}</Sheet>
              </div>
            </div>
          )}
          {per === 2 && <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-tinta/15" />}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <Button variant="outline" size="sm" onClick={() => go(-1)} disabled={view <= 0 || !!turn} aria-label="Página anterior">
          <ChevronLeft /> <span className="hidden sm:inline">Anterior</span>
        </Button>
        <p className="font-num text-xs text-muted-foreground">
          {per === 2 ? `Páginas ${view + 1}–${view + 2}` : `Página ${view + 1}`} de {pages.length}
        </p>
        <Button variant="outline" size="sm" onClick={() => go(1)} disabled={view >= last || !!turn} aria-label="Próxima página">
          <span className="hidden sm:inline">Próxima</span> <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

function useWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(min-width: 768px)");
    const set = () => setWide(m.matches);
    set();
    m.addEventListener("change", set);
    return () => m.removeEventListener("change", set);
  }, []);
  return wide;
}

/** Uma página de papel de passaporte: textura de segurança, sombra da costura e número. */
function Sheet({ side, number, children, lifting }: {
  side: "left" | "right"; number: number; children: ReactNode; lifting?: boolean;
}) {
  return (
    <div
      className={cn(
        "passport-paper paper-light relative aspect-[5/7] overflow-hidden text-tinta",
        side === "left" ? "rounded-l-[10px]" : "rounded-r-[10px]",
        lifting && "shadow-lift",
      )}
    >
      <div
        aria-hidden
        className={cn("pointer-events-none absolute inset-y-0 w-10", side === "left" ? "right-0 bg-gradient-to-l" : "left-0 bg-gradient-to-r", "from-tinta/15 to-transparent")}
      />
      {number >= 0 && children && <PageArt page={number} />}
      {number >= 0 && children && (
        <Perforated n={number + 1} className={cn("absolute top-3 h-4", side === "left" ? "right-7" : "right-3.5")} />
      )}
      <div className="relative h-full">{children}</div>
    </div>
  );
}

function Paper() {
  return <div className="absolute inset-0" />;
}

function IdPage({ holder, counts }: { holder: Holder; counts: { stamps: number; cities: number; countries: number } }) {
  const st = holder.passportState;
  const expiryTone = st.kind === "expired" ? "font-semibold text-destructive" : st.kind === "expiring" || st.kind === "short-for-trip" ? "font-semibold text-warning" : "";
  const br = (d: string | null) => (d ? d.split("-").reverse().join("/") : "—");
  const yymmdd = holder.passportExpiry ? holder.passportExpiry.slice(2).replace(/-/g, "") : "<<<<<<";
  const name = (holder.name || "VIAJANTE").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z]+/g, "<");
  return (
    <div className="relative flex h-full flex-col p-[7%]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-tinta-suave">Passaporte · Passport</p>
      <div className="mt-[8%] flex items-start gap-4">
        <div className="aspect-[3/4] w-[34%] shrink-0 overflow-hidden rounded-md border border-tinta/20 bg-areia">
          {holder.avatar ? <img src={holder.avatar} alt="" className="h-full w-full object-cover grayscale-[35%] sepia-[20%]" /> : null}
        </div>
        <dl className="min-w-0 space-y-1.5 text-xs">
          <Field label="Titular">{holder.name || "Viajante"}</Field>
          <Field label="Passaporte nº"><span className="font-num text-[13px] tracking-wider">{maskPassport(holder.passportLast4)}</span></Field>
          <Field label="Validade"><span className={cn(expiryTone)}>{br(holder.passportExpiry)}</span></Field>
          <Field label="Carimbos · Cidades · Países">{counts.stamps} · {counts.cities} · {counts.countries}</Field>
        </dl>
      </div>
      <div className="mt-3 flex flex-col items-start gap-1.5">
        {holder.onEditPassport && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={holder.onEditPassport}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary underline-offset-2 hover:underline"
          >
            {holder.passportLast4 || holder.passportExpiry ? <Pencil className="size-3.5" /> : <Plus className="size-3.5" />}
            {holder.passportLast4 || holder.passportExpiry ? "Editar dados do passaporte" : "Cadastrar meu passaporte"}
          </button>
        )}
        {holder.onAddStamps && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={holder.onAddStamps}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary underline-offset-2 hover:underline"
          >
            <Plus className="size-3.5" />
            Incluir carimbos de viagens anteriores
          </button>
        )}
      </div>
      {(st.kind === "expired" || st.kind === "expiring" || st.kind === "short-for-trip") && (
        <div className="pointer-events-none absolute bottom-[16%] right-[6%] w-[46%]">
          <Stamp
            top="Validade"
            main={st.kind === "expired" ? "Vencido" : "Vencendo"}
            bottom={br(holder.passportExpiry)}
            tone={st.kind === "expired" ? "erro" : "alerta"}
            shape="rect"
            tilt={-12}
            className="w-full mix-blend-multiply opacity-85"
          />
        </div>
      )}
      <p className="mt-auto break-all font-num text-[9px] leading-tight tracking-[0.12em] text-tinta-suave">
        P&lt;&lt;&lt;&lt;{name}&lt;&lt;&lt;&lt;&lt;&lt;
        <br />
        {(holder.passportLast4 ?? "").padStart(9, "<")}&lt;&lt;&lt;{yymmdd}&lt;&lt;&lt;&lt;&lt;&lt;
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[9px] font-semibold uppercase tracking-[0.14em] text-tinta-suave">{label}</dt>
      <dd className="truncate font-display text-sm">{children}</dd>
    </div>
  );
}

/** Carimbos que já fizeram a animação nesta visita: a folha que gira remonta a página e não deve repetir. */
const played = new Set<string>();

function VisaPage({ stamps, seen, hint }: { stamps: StampItem[]; seen: Set<string>; hint?: boolean }) {
  const fresh = (k: string) => seen.size > 0 && !seen.has(k) && !played.has(k);
  useEffect(() => {
    const t = setTimeout(() => stamps.forEach((s) => played.add(s.key)), 700);
    return () => clearTimeout(t);
  }, [stamps]);
  return (
    <div className="flex h-full flex-col px-[5%] pb-[8%] pt-[5%]">
      <p className="text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-tinta-suave">Vistos · Visas</p>
      {hint && !stamps.length ? (
        <p className="mx-auto mt-[14%] max-w-[70%] -rotate-3 text-center font-hand text-xl text-tinta-suave/80">Espaço reservado para o próximo carimbo</p>
      ) : (
        <ul className="mt-2 grid flex-1 grid-cols-2 grid-rows-2 place-items-center">
          {stamps.map((s, i) => (
            <li key={s.key} className="flex size-full items-center justify-center" style={{ transform: jitter(s.key, i) }} title={s.tripName}>
              <Stamp
                top={s.top} main={s.main} bottom={s.bottom} tone={s.tone} shape={s.shape} tilt={s.tilt}
                fresh={fresh(s.key)}
                className="w-[92%] mix-blend-multiply opacity-90"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Pequeno deslocamento estável por carimbo, para não parecerem alinhados à régua. */
function jitter(key: string, i: number) {
  let h = 0;
  for (let k = 0; k < key.length; k++) h = (h * 31 + key.charCodeAt(k)) | 0;
  const x = ((h & 0xff) / 255 - 0.5) * 10;
  // Linha de cima desce um pouco, para não invadir o cabeçalho da página.
  const y = (((h >> 8) & 0xff) / 255 - 0.5) * 8 + (i < 2 ? 5 : -2);
  return `translate(${x.toFixed(1)}%, ${y.toFixed(1)}%)`;
}
