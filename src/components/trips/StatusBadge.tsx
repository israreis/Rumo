import { cn } from "@/lib/utils";
import { STATUS_LABEL, type TripStatus } from "@/lib/trip-utils";

const STYLES: Record<TripStatus, string> = {
  planning: "bg-secondary text-secondary-foreground",
  confirmed: "bg-primary text-primary-foreground",
  ongoing: "bg-accent text-accent-foreground",
  completed: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status, className }: { status: TripStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", STYLES[status], className)}>
      {STATUS_LABEL[status]}
    </span>
  );
}
