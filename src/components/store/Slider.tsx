"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Tira deslizable con avance automático. Se usa para las tarjetas de la descripción y para los productos relacionados.
 * - Muestra 1 elemento en el celular, 2 en tableta y `desktopCount` en pantalla grande.
 * - Avanza sola cada `interval` ms; se puede pausar, ir atrás o adelante.
 * - Si la persona prefiere menos movimiento, arranca en pausa.
 * - Con un solo grupo de elementos no muestra controles.
 */
export function Slider({
  label,
  children,
  desktopCount = 3,
  interval = 4000,
  paused: pausedFromOutside = false,
}: {
  label: string;
  children: ReactNode[];
  desktopCount?: 2 | 3;
  interval?: number;
  /** Para frenar el avance desde afuera (por ejemplo, mientras hay una ventana abierta). */
  paused?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [maxIndex, setMaxIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const count = children.length;

  // Con "menos movimiento" activado en el dispositivo, no se mueve sola.
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setUserPaused(true);
    }
  }, []);

  const measure = useCallback(() => {
    const track = trackRef.current;
    const first = track?.firstElementChild as HTMLElement | null;
    if (!track || !first) return null;
    const gap = parseFloat(getComputedStyle(track).columnGap || "0") || 0;
    const step = first.offsetWidth + gap;
    const visible = Math.max(1, Math.round((track.clientWidth + gap) / step));
    return { track, step, visible };
  }, []);

  const recompute = useCallback(() => {
    const m = measure();
    if (!m) return;
    setMaxIndex(Math.max(0, count - m.visible));
  }, [measure, count]);

  useEffect(() => {
    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, [recompute]);

  const goTo = useCallback(
    (next: number) => {
      const m = measure();
      if (!m) return;
      const limit = Math.max(0, count - m.visible);
      const target = Math.min(Math.max(0, next), limit);
      m.track.scrollTo({ left: target * m.step, behavior: "smooth" });
      setIndex(target);
    },
    [measure, count]
  );

  // Si la persona desliza con el dedo, el indicador sigue la posición real.
  const onScroll = () => {
    const m = measure();
    if (!m) return;
    setIndex(Math.min(Math.round(m.track.scrollLeft / m.step), Math.max(0, count - m.visible)));
  };

  const running = !userPaused && !pausedFromOutside && !hover && maxIndex > 0;
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setIndex((current) => {
        const next = current >= maxIndex ? 0 : current + 1;
        const m = measure();
        if (m) m.track.scrollTo({ left: next * m.step, behavior: "smooth" });
        return next;
      });
    }, interval);
    return () => window.clearInterval(timer);
  }, [running, maxIndex, interval, measure]);

  const itemClass =
    desktopCount === 2
      ? "shrink-0 basis-full snap-start sm:basis-[calc((100%-16px)/2)]"
      : "shrink-0 basis-full snap-start sm:basis-[calc((100%-16px)/2)] lg:basis-[calc((100%-32px)/3)]";
  const progress = maxIndex > 0 ? ((index + 1) / (maxIndex + 1)) * 100 : 100;
  const buttonClass =
    "focus-ring flex h-12 w-12 items-center justify-center rounded-full border border-gold/50 bg-noir-surface font-ui text-lg text-gold-pale transition hover:bg-gold/15 disabled:opacity-40";

  return (
    <div
      role="region"
      aria-roledescription="carrusel"
      aria-label={label}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children.map((child, i) => (
          <div key={i} className={itemClass}>
            {child}
          </div>
        ))}
      </div>

      {maxIndex > 0 && (
        <div className="mt-4 flex items-center gap-4">
          <button type="button" aria-label="Anterior" onClick={() => goTo(index <= 0 ? maxIndex : index - 1)} className={buttonClass}>
            ◀
          </button>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gold/15" aria-hidden="true">
            <div className="h-full rounded-full bg-gold transition-[width] duration-500" style={{ width: `${progress}%` }} />
          </div>
          <button
            type="button"
            aria-pressed={userPaused}
            onClick={() => setUserPaused((p) => !p)}
            className="focus-ring rounded-full border border-gold/50 px-4 py-2.5 font-ui text-xs uppercase tracking-wide text-gold-pale transition hover:bg-gold/15"
          >
            {userPaused ? "▶ Reanudar" : "❚❚ Pausar"}
          </button>
          <button type="button" aria-label="Siguiente" onClick={() => goTo(index >= maxIndex ? 0 : index + 1)} className={buttonClass}>
            ▶
          </button>
        </div>
      )}
    </div>
  );
}
