import { Download, Eye, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { localFileUrl } from "@/lib/offline-files";

const isPdf = (u: string, type?: string) => type === "application/pdf" || /\.pdf(\?|$)/i.test(u.split("?")[0] ?? u);

/**
 * Mostra o anexo. O arquivo é lido do aparelho quando já está salvo (funciona sem internet)
 * e exibido como blob local, inclusive PDFs.
 */
export function FileViewer({ url, title }: { url: string | null; title: string }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<{ src: string; type: string } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open || !url) return;
    let alive = true, made: string | null = null;
    setFailed(false);
    localFileUrl(url)
      .then((f) => { made = f.src; if (alive) setFile(f); else URL.revokeObjectURL(f.src); })
      .catch(() => alive && setFailed(true));
    return () => { alive = false; setFile(null); if (made) URL.revokeObjectURL(made); };
  }, [open, url]);

  if (!url) return null;
  const pdf = isPdf(url, file?.type);
  const ext = pdf ? "pdf" : (file?.type.split("/")[1] ?? "jpg");
  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setOpen(true); }}><Eye /> Ver arquivo</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100%-1rem)] grid-cols-[minmax(0,1fr)] rounded-2xl sm:max-w-3xl" onClick={(e) => e.stopPropagation()}>
          <DialogHeader><DialogTitle className="pr-6 text-left">{title}</DialogTitle></DialogHeader>
          {failed ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Não foi possível abrir: o arquivo ainda não foi salvo neste aparelho e você está sem internet.</p>
          ) : !file ? (
            <div className="grid h-60 place-items-center text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>
          ) : pdf ? (
            <iframe src={file.src} title={title} className="h-[70vh] w-full rounded-lg border" />
          ) : (
            <img src={file.src} alt={title} className="max-h-[70vh] w-full rounded-lg object-contain" />
          )}
          {file && (
            <a href={file.src} download={`${title.replace(/[\\/:*?"<>|]/g, "-")}.${ext}`} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
              <Download className="size-4" /> Abrir ou salvar o arquivo
            </a>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
