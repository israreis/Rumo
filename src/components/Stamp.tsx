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
  const mainSize = main.length > 11 ? 15 : main.length > 8 ? 18 : 22;
  const topSize = top.length > 18 ? 7.5 : top.length > 13 ? 8.5 : 10;
  return (
    <svg
      viewBox="0 0 160 160"
      role="img"
      aria-label={title ?? `${main}${bottom ? `, ${bottom}` : ""}`}
      className={cn("shrink-0 select-none", pending && "opacity-45", fresh && "animate-carimbo", className)}
      style={{ color: ink }}
    >
      <g fill="currentColor" stroke="currentColor" transform={`rotate(${tilt} 80 80)`}>
        {shape === "round" && (
          <>
            <defs><path id={`arc-${id}`} d="M80,80 m-52,0 a52,52 0 1,1 104,0 a52,52 0 1,1 -104,0" /></defs>
            <circle cx="80" cy="80" r="74" fill="none" strokeWidth="3" strokeDasharray={pending ? "6 5" : undefined} />
            <circle cx="80" cy="80" r="66" fill="none" strokeWidth="1.2" />
            <text stroke="none" className="font-sans" fontWeight="600" fontSize="10.5" letterSpacing="1.6">
              <textPath href={`#arc-${id}`}>{`${[top, bottom].filter(Boolean).join(" · ")} ·`.toUpperCase()}</textPath>
            </text>
            <text stroke="none" x="80" y="87" textAnchor="middle" className="font-display" fontWeight="600" fontSize={mainSize}>{main}</text>
          </>
        )}
        {shape === "rect" && (
          <>
            <rect x="10" y="30" width="140" height="100" rx="10" fill="none" strokeWidth="3" strokeDasharray={pending ? "6 5" : undefined} />
            <rect x="18" y="38" width="124" height="84" rx="6" fill="none" strokeWidth="1.2" strokeDasharray="3 3" />
            {top && <text stroke="none" x="80" y="62" textAnchor="middle" className="font-sans" fontWeight="600" fontSize={topSize} letterSpacing="1.4">{top.toUpperCase()}</text>}
            <text stroke="none" x="80" y={top ? 92 : 84} textAnchor="middle" className="font-display" fontWeight="600" fontSize={mainSize + 1}>{main}</text>
            {bottom && <text stroke="none" x="80" y={top ? 112 : 106} textAnchor="middle" className="font-sans" fontWeight="600" fontSize="10" letterSpacing="1.4">{bottom.toUpperCase()}</text>}
          </>
        )}
        {shape === "dashed" && (
          <>
            <circle cx="80" cy="80" r="70" fill="none" strokeWidth="3" strokeDasharray="6 4" />
            <text stroke="none" x="80" y="68" textAnchor="middle" className="font-sans" fontWeight="600" fontSize={topSize + 1} letterSpacing="1.6">{top.toUpperCase()}</text>
            <text stroke="none" x="80" y="96" textAnchor="middle" className="font-display" fontWeight="600" fontSize={mainSize + 2}>{main}</text>
            {bottom && <text stroke="none" x="80" y="116" textAnchor="middle" className="font-sans" fontWeight="600" fontSize="10" letterSpacing="1.4">{bottom.toUpperCase()}</text>}
          </>
        )}
      </g>
    </svg>
  );
}
