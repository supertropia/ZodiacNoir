"use client";

import { useEffect, useState } from "react";
import { ProductVideo } from "@/components/store/ProductVideo";

/**
 * Miniatura del video de presentación, pensada para ir al lado de la portada.
 * Al tocarla, el video se abre en pantalla completa con un botón grande de "Cerrar video".
 */
export function VideoThumb({
  src,
  title,
  heading = "Mira la presentación",
  className = "",
}: {
  src: string;
  title: string;
  heading?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${heading}: ${title}`}
        className={`focus-ring group relative block w-full overflow-hidden rounded-xl border border-gold/30 bg-noir-surface2 text-left shadow-[0_18px_40px_-20px_rgba(38,24,63,0.45)] ${className}`}
      >
        <video
          src={`${src}#t=0.1`}
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"
          tabIndex={-1}
          className="pointer-events-none block aspect-[4/5] w-full object-cover"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" aria-hidden="true" />
        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 font-ui text-[11px] uppercase tracking-wide text-white">
          Video
        </span>
        <span className="absolute left-1/2 top-[42%] flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-3xl text-[#7A1F38] shadow-xl transition group-hover:scale-105" aria-hidden="true">
          ▶
        </span>
        <span className="absolute inset-x-0 bottom-0 p-4">
          <span className="block font-display text-lg leading-snug text-white">{heading}</span>
          <span className="mt-1 block font-ui text-xs text-white/85">Toca para verla en pantalla completa</span>
        </span>
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-label={heading} className="fixed inset-0 z-[90] flex flex-col bg-black/95">
          <div className="flex justify-end p-4">
            <button
              type="button"
              autoFocus
              onClick={() => setOpen(false)}
              className="focus-ring flex min-h-[52px] items-center gap-2 rounded-full bg-white px-6 font-ui text-sm font-semibold uppercase tracking-wide text-[#26183F] shadow-xl hover:bg-white/90"
            >
              <span aria-hidden="true">✕</span> Cerrar video
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center overflow-y-auto px-4 pb-6">
            <div className="w-full max-w-4xl">
              <ProductVideo key={src} src={src} title={title} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
