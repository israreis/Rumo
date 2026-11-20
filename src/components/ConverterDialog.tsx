import { CurrencyConverter } from "@/components/plan/CurrencyConverter";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** Conversor de moedas aberto pela barra de navegação, de qualquer tela. */
export function ConverterDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md grid-cols-[minmax(0,1fr)] rounded-2xl p-5 sm:p-6">
        <DialogHeader className="text-left">
          <DialogTitle className="font-display text-2xl">Conversor</DialogTitle>
          <DialogDescription className="sr-only">Converta valores entre moedas, com ou sem as taxas do cartão.</DialogDescription>
        </DialogHeader>
        <CurrencyConverter bare />
      </DialogContent>
    </Dialog>
  );
}
