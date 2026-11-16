import { Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";

export function Logo({ to = "/" }: { to?: "/" | "/trips" }) {
  return (
    <Link to={to} className="flex items-center gap-2 font-display text-xl font-semibold text-foreground">
      <span className="grid size-8 place-items-center rounded-full bg-hero text-primary-foreground">
        <Compass className="size-4" />
      </span>
      Rota
    </Link>
  );
}
