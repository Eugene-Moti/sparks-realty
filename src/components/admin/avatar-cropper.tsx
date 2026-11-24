"use client";

import { Slider } from "radix-ui";
import { type PointerEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type SquareCrop = { x: number; y: number; size: number };

const VIEW = 280;

/**
 * Square crop: drag to position, slider (or arrow keys) to zoom. Returns the
 * crop in source-image pixels; upload.ts draws and compresses it.
 */
export function AvatarCropper({ file, onCancel, onConfirm }: { file: File; onCancel: () => void; onConfirm: (crop: SquareCrop) => void }) {
  const [src, setSrc] = useState<string | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- object URL must be created and revoked with the file
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Image scaled so its short side fills the frame at zoom 1.
  const base = natural ? VIEW / Math.min(natural.w, natural.h) : 1;
  const scale = base * zoom;
  const w = (natural?.w ?? 0) * scale;
  const h = (natural?.h ?? 0) * scale;
  const clamp = (o: { x: number; y: number }) => ({
    x: Math.min(0, Math.max(VIEW - w, o.x)),
    y: Math.min(0, Math.max(VIEW - h, o.y)),
  });

  function onLoad(img: HTMLImageElement) {
    const n = { w: img.naturalWidth, h: img.naturalHeight };
    setNatural(n);
    const s = VIEW / Math.min(n.w, n.h);
    setOffset({ x: (VIEW - n.w * s) / 2, y: (VIEW - n.h * s) / 2 });
  }

  function setZoomCentered(z: number) {
    if (!natural) return;
    const cx = (VIEW / 2 - offset.x) / scale;
    const cy = (VIEW / 2 - offset.y) / scale;
    const ns = base * z;
    setZoom(z);
    setOffset(
      ((o) => ({
        x: Math.min(0, Math.max(VIEW - natural.w * ns, o.x)),
        y: Math.min(0, Math.max(VIEW - natural.h * ns, o.y)),
      }))({ x: VIEW / 2 - cx * ns, y: VIEW / 2 - cy * ns }),
    );
  }

  const onDown = (e: PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onMove = (e: PointerEvent) => {
    if (!drag.current) return;
    setOffset(clamp({ x: drag.current.ox + e.clientX - drag.current.x, y: drag.current.oy + e.clientY - drag.current.y }));
  };

  function confirm() {
    if (!natural) return;
    onConfirm({ x: Math.round(-offset.x / scale), y: Math.round(-offset.y / scale), size: Math.round(VIEW / scale) });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crop photo</DialogTitle>
          <DialogDescription>Drag to position the face in the circle, then zoom.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-5">
          <div
            className="relative touch-none select-none overflow-hidden rounded-2xl bg-ink"
            style={{ width: VIEW, height: VIEW }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={() => (drag.current = null)}
            tabIndex={0}
            role="img"
            aria-label="Crop area. Use arrow keys to move the photo."
            onKeyDown={(e) => {
              const step = e.shiftKey ? 20 : 5;
              const d = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[e.key];
              if (d) {
                e.preventDefault();
                setOffset((o) => clamp({ x: o.x + d[0], y: o.y + d[1] }));
              }
            }}
          >
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt=""
                draggable={false}
                onLoad={(e) => onLoad(e.currentTarget)}
                className="absolute top-0 left-0 max-w-none cursor-grab active:cursor-grabbing"
                style={{ width: w || undefined, height: h || undefined, transform: `translate(${offset.x}px, ${offset.y}px)` }}
              />
            ) : null}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_999px_rgb(11_11_12/0.55)] ring-2 ring-gold/70" />
          </div>
          <Slider.Root
            className="relative flex h-6 w-full max-w-[280px] touch-none select-none items-center"
            min={1}
            max={4}
            step={0.01}
            value={[zoom]}
            onValueChange={(v) => setZoomCentered(v[0])}
          >
            <Slider.Track className="relative h-1 grow rounded-full bg-foreground/12">
              <Slider.Range className="absolute h-full rounded-full bg-gold-600" />
            </Slider.Track>
            <Slider.Thumb aria-label="Zoom" className="block size-5 rounded-full border-2 border-gold-600 bg-surface shadow-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30" />
          </Slider.Root>
          <div className="flex w-full justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="button" variant="green-solid" onClick={confirm} disabled={!natural}>
              Use photo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
