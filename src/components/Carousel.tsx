"use client";

import { useEffect, useRef, useState } from "react";

// Carrusel genérico: una tarjeta visible por vez, con flechas a los costados,
// puntitos abajo (clickeables), se puede arrastrar/deslizar a mano, y
// opcionalmente se desliza sola cada "autoplayMs" milisegundos. Reutilizado
// tanto para artículos relacionados como para productos de la tienda, para
// no duplicar la lógica.
export function Carousel<T>({
  items,
  getKey,
  renderItem,
  autoplayMs = 3500,
  autoplay = true,
  className = "",
}: {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
  autoplayMs?: number;
  autoplay?: boolean;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const scrollToIndex = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const slide = track.children[index] as HTMLElement | undefined;
    if (slide) track.scrollTo({ left: slide.offsetLeft, behavior: "smooth" });
  };

  const goTo = (index: number) => {
    const clamped = (index + items.length) % items.length;
    scrollToIndex(clamped);
  };

  useEffect(() => {
    if (!autoplay || paused || items.length <= 1) return;
    const id = setInterval(() => {
      const next = (activeIndex + 1) % items.length;
      scrollToIndex(next);
    }, autoplayMs);
    return () => clearInterval(id);
  }, [activeIndex, paused, items.length, autoplayMs, autoplay]);

  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const index = Array.from(track.children).findIndex((child) => {
      const el = child as HTMLElement;
      return Math.abs(el.offsetLeft - track.scrollLeft) < el.offsetWidth / 2;
    });
    if (index >= 0 && index !== activeIndex) setActiveIndex(index);
  };

  if (items.length === 0) return null;

  return (
    <div
      className={`relative flex h-full flex-col ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
    >
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <div key={getKey(item)} className="h-full w-full shrink-0 snap-start px-1">
            {renderItem(item)}
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => goTo(activeIndex - 1)}
            className="focus-ring absolute left-0 top-1/2 z-10 flex h-9 w-9 -translate-x-3 -translate-y-1/2 items-center justify-center rounded-full border border-gold/40 bg-noir-bg/80 text-gold opacity-70 backdrop-blur transition hover:opacity-100"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Siguiente"
            onClick={() => goTo(activeIndex + 1)}
            className="focus-ring absolute right-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 translate-x-3 items-center justify-center rounded-full border border-gold/40 bg-noir-bg/80 text-gold opacity-70 backdrop-blur transition hover:opacity-100"
          >
            ›
          </button>
        </>
      )}

      {items.length > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {items.map((item, i) => (
            <button
              key={getKey(item)}
              type="button"
              aria-label={`Ir al elemento ${i + 1}`}
              onClick={() => scrollToIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === activeIndex ? "w-5 bg-gold" : "w-2 bg-gold/30 hover:bg-gold/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
