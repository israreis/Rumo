import { Plane } from "lucide-react";
import { cn } from "@/lib/utils";

export function TripCover({ url, className }: { url: string | null; className?: string }) {
  if (!url)
    return (
      <div className={cn("grid h-full w-full place-items-center bg-hero", className)}>
        <Plane className="size-10 text-primary-foreground/70" />
      </div>
    );
  return <img src={url} alt="" loading="lazy" className={cn("h-full w-full object-cover", className)} />;
}
