import { CurrencyConverter } from "@/components/plan/CurrencyConverter";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** Conversor de moedas aberto pela barra de navegação, de qualquer tela. */
export function ConverterDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Conversor</DialogTitle>
          <DialogDescription className="sr-only">Converta valores entre moedas, com ou sem as taxas do cartão.</DialogDescription>
        </DialogHeader>
        <CurrencyConverter bare />
      </DialogContent>
    </Dialog>
  );
}
