import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card/50 px-6 py-14 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-salvia text-oliva"><Icon className="size-6" strokeWidth={1.5} /></span>
      <h3 className="mt-4 text-2xl">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{text}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
