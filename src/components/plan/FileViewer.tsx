import { Eye } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const isPdf = (u: string) => /\.pdf(\?|$)/i.test(u.split("?")[0] ?? u);

export function FileViewer({ url, title }: { url: string | null; title: string }) {
  const [open, setOpen] = useState(false);
  if (!url) return null;
  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setOpen(true); }}><Eye /> Ver arquivo</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl" onClick={(e) => e.stopPropagation()}>
          <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
          {isPdf(url)
            ? <iframe src={url} title={title} className="h-[70vh] w-full rounded-lg border" />
            : <img src={url} alt={title} className="max-h-[70vh] w-full rounded-lg object-contain" />}
          <a href={url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">Abrir em nova aba</a>
        </DialogContent>
      </Dialog>
    </>
  );
}
