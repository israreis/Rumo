import { cn } from "@/lib/utils";

/** Capa da viagem. Sem foto: fundo da marca com uma rosa dos ventos discreta no canto, longe do título. */
export function TripCover({ url, className }: { url: string | null; className?: string }) {
  if (!url)
    return (
      <div className={cn("relative h-full w-full overflow-hidden bg-hero", className)}>
        <svg viewBox="0 0 100 100" aria-hidden className="absolute -right-6 -top-6 size-40 text-on-photo/20">
          <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="0.6" strokeDasharray="1 3" />
          <path d="M50 10 L55 50 L50 90 L45 50 Z M10 50 L50 45 L90 50 L50 55 Z" fill="currentColor" />
        </svg>
      </div>
    );
  return <img src={url} alt="" loading="lazy" className={cn("h-full w-full object-cover", className)} />;
}
