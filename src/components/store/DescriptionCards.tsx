"use client";

import { useEffect, useState } from "react";
import { Slider } from "@/components/store/Slider";
import type { DescriptionCard } from "@/lib/description-cards";

/** Tarjetas deslizables con el contenido de la descripción. Cada una tiene "Leer más", que abre su texto completo. */
export function DescriptionCards({ cards, fullText }: { cards: DescriptionCard[]; fullText: React.ReactNode }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const open = openIndex !== null ? cards[openIndex] : null;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenIndex(null);
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
    <div>
      <Slider label="Lo que incluye este producto" paused={open !== null}>
        {cards.map((card, i) => (
          <article key={i} className="flex h-full flex-col rounded-2xl border border-gold/30 bg-noir-surface p-5">
            <h3 className="font-display text-lg leading-snug text-gold-pale">{card.title}</h3>
            <p className="mt-2 whitespace-pre-line font-body text-base leading-relaxed text-gold-pale/85 [-webkit-box-orient:vertical] [-webkit-line-clamp:4] [display:-webkit-box] overflow-hidden">
              {card.body}
            </p>
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              className="focus-ring mt-auto self-start pt-3 font-ui text-xs uppercase tracking-wide text-gold underline underline-offset-4 hover:text-gold-pale"
            >
              Leer más
            </button>
          </article>
        ))}
      </Slider>

      <details className="mt-5 rounded-xl border border-gold/20 bg-noir-surface/40 px-4 py-3">
        <summary className="focus-ring cursor-pointer font-ui text-sm text-gold-pale">Ver la descripción completa en un solo texto</summary>
        <div className="mt-4">{fullText}</div>
      </details>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={open.title}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpenIndex(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-gold/40 bg-noir-bg p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-display text-xl leading-snug text-gold-pale">{open.title}</h3>
              <button
                type="button"
                autoFocus
                onClick={() => setOpenIndex(null)}
                className="focus-ring shrink-0 rounded-full border border-gold/60 px-4 py-2 font-ui text-xs uppercase tracking-wide text-gold-pale hover:bg-gold/15"
              >
                Cerrar ✕
              </button>
            </div>
            <p className="mt-4 whitespace-pre-line font-body text-lg leading-relaxed text-gold-pale/90">{open.body}</p>
          </div>
        </div>
      )}
    </div>
  );
}
