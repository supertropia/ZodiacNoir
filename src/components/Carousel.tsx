"use client";

import { useEffect, useRef, useState } from "react";

// Carrusel genérico: una tarjeta visible por vez, se desliza sola cada
// "autoplayMs" milisegundos, tiene puntitos abajo (clickeables), y también
// se puede arrastrar/deslizar a mano. Reutilizado tanto para artículos
// relacionados como para productos de la tienda, para no duplicar la lógica.
export function Carousel<T>({
  items,
  getKey,
  renderItem,
  autoplayMs = 3500,
}: {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
  autoplayMs?: number;
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

  useEffect(() => {
    if (paused || items.length <= 1) return;
    const id = setInterval(() => {
      const next = (activeIndex + 1) % items.length;
      scrollToIndex(next);
    }, autoplayMs);
    return () => clearInterval(id);
  }, [activeIndex, paused, items.length, autoplayMs]);

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
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
    >
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <div key={getKey(item)} className="w-full shrink-0 snap-start px-1">
            {renderItem(item)}
          </div>
        ))}
      </div>

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
