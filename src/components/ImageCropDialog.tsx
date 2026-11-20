import { useEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const MAX_ZOOM = 4;

/**
 * Recorte de imagem: arraste para posicionar, pinça/roda/controle para zoom.
 * Padrão: círculo para foto de perfil (JPEG 512×512). Capa: `aspect={16 / 9}`, `round={false}`, `outWidth={1600}`.
 */
export function ImageCropDialog({ file, onCancel, onDone, aspect = 1, round = true, outWidth = 512, title = "Ajustar foto", maxBox = 300 }: {
  file: File | null; onCancel: () => void; onDone: (f: File) => Promise<void> | void;
  aspect?: number; round?: boolean; outWidth?: number; title?: string; maxBox?: number;
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [size, setSize] = useState(280); // largura da área de recorte
  const height = size / aspect;
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);

  useEffect(() => {
    if (!file) { setImg(null); return; }
    const url = URL.createObjectURL(file);
    const i = new Image();
    i.onload = () => { setImg(i); setZoom(1); setOff({ x: 0, y: 0 }); };
    i.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize(Math.min(maxBox, el.clientWidth)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [img]);

  const base = img ? Math.max(size / img.naturalWidth, height / img.naturalHeight) : 1;
  const dw = img ? img.naturalWidth * base * zoom : size;
  const dh = img ? img.naturalHeight * base * zoom : height;
  const clamp = (o: { x: number; y: number }, w = dw, h = dh) => ({
    x: Math.max(-(w - size) / 2, Math.min((w - size) / 2, o.x)),
    y: Math.max(-(h - height) / 2, Math.min((h - height) / 2, o.y)),
  });

  function setZoomKeep(z: number) {
    const nz = Math.max(1, Math.min(MAX_ZOOM, z));
    if (!img) return;
    const r = nz / zoom;
    setZoom(nz);
    setOff((o) => clamp({ x: o.x * r, y: o.y * r }, img.naturalWidth * base * nz, img.naturalHeight * base * nz));
  }

  function onDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a!.x - b!.x, a!.y - b!.y), zoom };
    }
  }
  function onMove(e: React.PointerEvent) {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      setZoomKeep(pinch.current.zoom * (Math.hypot(a!.x - b!.x, a!.y - b!.y) / pinch.current.dist));
    } else if (pointers.current.size === 1) {
      setOff((o) => clamp({ x: o.x + e.clientX - prev.x, y: o.y + e.clientY - prev.y }));
    }
  }
  function onUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  }

  async function confirm() {
    if (!img || !file) return;
    setBusy(true);
    try {
      const k = outWidth / size;
      const c = document.createElement("canvas");
      c.width = outWidth;
      c.height = Math.round(outWidth / aspect);
      const ctx = c.getContext("2d")!;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, (size / 2 + off.x - dw / 2) * k, (height / 2 + off.y - dh / 2) * k, dw * k, dh * k);
      const blob = await new Promise<Blob | null>((res) => c.toBlob(res, "image/jpeg", 0.9));
      if (blob) await onDone(new File([blob], "imagem.jpg", { type: "image/jpeg" }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!file} onOpenChange={(v) => !v && !busy && onCancel()}>
      <DialogContent className={cn("w-[calc(100%-2rem)] grid-cols-[minmax(0,1fr)] rounded-2xl p-5 sm:p-6", aspect > 1.2 ? "max-w-lg" : "max-w-sm")}>
        <DialogHeader className="text-left">
          <DialogTitle className="font-display text-2xl">{title}</DialogTitle>
          <DialogDescription>Arraste para posicionar e use o zoom (ou pinça) para enquadrar.</DialogDescription>
        </DialogHeader>
        <div ref={box} className="flex justify-center">
          <div
            className="relative touch-none select-none overflow-hidden rounded-2xl bg-muted"
            style={{ width: size, height, cursor: "grab" }}
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
            onWheel={(e) => setZoomKeep(zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08))}
          >
            {img && (
              <img src={img.src} alt="" draggable={false} className="pointer-events-none absolute max-w-none"
                style={{ width: dw, height: dh, left: size / 2 + off.x - dw / 2, top: height / 2 + off.y - dh / 2 }} />
            )}
            {/* Máscara: escurece o que fica fora do círculo */}
            {round ? <div className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_9999px_rgb(0_0_0/0.55)] ring-2 ring-white/80" />
              : <div className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-inset ring-white/70" />}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ZoomOut className="size-4 shrink-0 text-muted-foreground" />
          <Slider aria-label="Zoom" min={1} max={MAX_ZOOM} step={0.01} value={[zoom]} onValueChange={([z]) => setZoomKeep(z ?? 1)} />
          <ZoomIn className="size-4 shrink-0 text-muted-foreground" />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>Cancelar</Button>
          <Button type="button" onClick={confirm} disabled={!img || busy}>{busy ? "Salvando…" : "Usar foto"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
