import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Luggage, LogOut, Plus, Stamp as StampIcon, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo, Splash } from "@/components/Logo";
import { PageBackdrop } from "@/components/PageBackdrop";
import { OfflineIndicator } from "@/components/OfflineSync";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { profileQuery } from "@/lib/profile";
import { acceptPendingInvites } from "@/lib/sharing-api";
import { cn } from "@/lib/utils";

let invitesChecked = false;

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", search: { redirect: location.href } });
    // Invites sent to this e-mail become trips in the list, once per app start.
    if (!invitesChecked) {
      invitesChecked = true;
      acceptPendingInvites().catch(() => undefined);
    }
    return { user: data.user };
  },
  pendingComponent: () => <Splash />,
  component: AppLayout,
});

const NAV = [
  { to: "/trips", label: "Viagens", icon: Luggage, exact: false },
  { to: "/trips/new", label: "Nova", icon: Plus, exact: true },
  { to: "/passaporte", label: "Passaporte", icon: StampIcon, exact: true },
  { to: "/profile", label: "Perfil", icon: User, exact: true },
] as const;

function AppLayout() {
  const { user } = Route.useRouteContext();
  const { data: profile } = useQuery(profileQuery(user.id));
  const qc = useQueryClient();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const name = profile?.full_name || user.email || "";

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    navigator.serviceWorker?.controller?.postMessage("clear-data");
    invitesChecked = false;
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const active = (to: string, exact: boolean) =>
    exact ? path === to : path === to || (path.startsWith(`${to}/`) && path !== "/trips/new");

  return (
    <div className="min-h-dvh">
      <PageBackdrop />
      <header className="no-print pt-safe sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Logo to="/trips" />
          <div className="flex items-center gap-1">
            <OfflineIndicator className="mr-1" />
            <Link to="/passaporte" className="mr-1 hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground md:inline-flex">
              <StampIcon className="size-4" /> Passaporte
            </Link>
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger aria-label="Menu da conta" className="rounded-full">
                <Avatar className="size-9">
                  <AvatarImage src={profile?.avatar_url ?? undefined} alt="" />
                  <AvatarFallback>{name.slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/passaporte"><StampIcon /> Meu passaporte</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/profile"><User /> Meu perfil</Link></DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}><LogOut /> Sair</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 sm:pt-10 md:pb-12">
        <Outlet />
      </main>

      {/* Phone: app-style tab bar at the thumb. */}
      <nav
        aria-label="Navegação principal"
        className="no-print pb-safe fixed inset-x-0 bottom-0 z-40 border-t bg-papel/95 backdrop-blur md:hidden"
      >
        <ul className="mx-auto grid h-16 max-w-md grid-cols-4">
          {NAV.map((n) => {
            const on = active(n.to, n.exact);
            return (
              <li key={n.to}>
                <Link
                  to={n.to}
                  className={cn(
                    "flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-semibold",
                    on ? "text-primary" : "text-muted-foreground",
                  )}
                  aria-current={on ? "page" : undefined}
                >
                  <span className={cn("grid h-7 w-12 place-items-center rounded-full transition-colors", on && "bg-primary/12")}>
                    <n.icon className={cn("size-5", on && "[stroke-width:2]")} />
                  </span>
                  {n.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
