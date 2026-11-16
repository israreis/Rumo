import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Copy, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteTrip, duplicateTrip, type Trip } from "@/lib/trips-api";

export function TripActions({ trip, variant = "ghost", afterDelete }: { trip: Trip; variant?: "ghost" | "outline"; afterDelete?: () => void }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);

  async function dup() {
    try {
      const id = await duplicateTrip(trip);
      await qc.invalidateQueries({ queryKey: ["trips"] });
      toast.success("Viagem duplicada");
      navigate({ to: "/trips/$tripId/edit", params: { tripId: id } });
    } catch {
      toast.error("Não foi possível duplicar.");
    }
  }
  async function del() {
    try {
      await deleteTrip(trip.id);
      await qc.invalidateQueries({ queryKey: ["trips"] });
      toast.success("Viagem excluída");
      afterDelete?.();
    } catch {
      toast.error("Não foi possível excluir.");
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size="icon" aria-label="Ações da viagem" onClick={(e) => e.stopPropagation()}>
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link to="/trips/$tripId/edit" params={{ tripId: trip.id }}><Pencil /> Editar</Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={dup}><Copy /> Duplicar como modelo</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setConfirm(true)}>
            <Trash2 /> Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir “{trip.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os destinos, viajantes e informações desta viagem serão apagados. Isso não pode ser desfeito.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={del}>
              Excluir viagem
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
