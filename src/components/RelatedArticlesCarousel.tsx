"use client";

import { useEffect, useRef, useState } from "react";
import type { Article } from "@prisma/client";
import { ArticleCard } from "./ArticleCard";

// Carrusel simple de tarjetas de artículo: una tarjeta visible por vez,
// se desliza sola cada pocos segundos, tiene puntitos abajo para saltar a
// cualquiera, y también se puede arrastrar/deslizar a mano (scroll nativo
// con "snap", funciona bien con el dedo en el celular).
export function RelatedArticlesCarousel({ articles }: { articles: Article[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const scrollToIndex = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const slide = track.children[index] as HTMLElement | undefined;
    if (slide) track.scrollTo({ left: slide.offsetLeft, behavior: "smooth" });
  };

  // Autoplay: avanza una tarjeta cada 4.5s, y vuelve al principio al llegar al final.
  useEffect(() => {
    if (paused || articles.length <= 1) return;
    const id = setInterval(() => {
      const next = (activeIndex + 1) % articles.length;
      scrollToIndex(next);
    }, 4500);
    return () => clearInterval(id);
  }, [activeIndex, paused, articles.length]);

  // Detecta qué tarjeta está visible mientras el usuario desliza a mano.
  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const index = Array.from(track.children).findIndex((child) => {
      const el = child as HTMLElement;
      return Math.abs(el.offsetLeft - track.scrollLeft) < el.offsetWidth / 2;
    });
    if (index >= 0 && index !== activeIndex) setActiveIndex(index);
  };

  if (articles.length === 0) return null;

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
        {articles.map((article) => (
          <div key={article.slug} className="w-full shrink-0 snap-start px-1">
            <ArticleCard article={article} />
          </div>
        ))}
      </div>

      {articles.length > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {articles.map((article, i) => (
            <button
              key={article.slug}
              type="button"
              aria-label={`Ir al artículo ${i + 1}`}
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
