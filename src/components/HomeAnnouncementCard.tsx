"use client";

import { useCallback, useEffect, useId, useRef, useState, type MouseEvent } from "react";
import type { HomeAnnouncementContent } from "@/lib/announcement-shared";

// Animaciones suaves: la imagen "flota" despacio y el botón principal tiene un destello que lo cruza cada tanto.
// Si la persona tiene activada la opción de reducir movimiento en su dispositivo, globals.css las detiene solas.
const CSS = `
@keyframes zn-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
@keyframes zn-shine { 0% { transform: translateX(-150%) skewX(-18deg); } 55%, 100% { transform: translateX(300%) skewX(-18deg); } }
.zn-float { animation: zn-float 7s ease-in-out infinite; }
.zn-shine::after {
  content: "";
  position: absolute;
  top: 0; bottom: 0; left: 0;
  width: 35%;
  background: linear-gradient(100deg, transparent, rgba(255, 255, 255, 0.55), transparent);
  animation: zn-shine 5s ease-in-out infinite;
  pointer-events: none;
}
`;

type TrackEvent = "vista" | "amazon" | "ver";

// Avisa al servidor para contar la visualización o el clic. Nunca bloquea ni rompe el botón.
function track(event: TrackEvent) {
  try {
    void fetch("/api/novedad/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* si no se puede contar, no pasa nada */
  }
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path d="M6.5 4.2v11.6a.8.8 0 0 0 1.2.7l9.3-5.8a.8.8 0 0 0 0-1.4L7.7 3.5a.8.8 0 0 0-1.2.7z" />
    </svg>
  );
}

/**
 * Tarjeta de la novedad de la portada (hoy: las agendas en Amazon).
 * Muestra imagen, título, texto y dos botones: el principal lleva a Amazon y «Ver por dentro» abre el video en una ventana.
 * Con preview = true (vista previa del panel) los enlaces no navegan.
 */
export function HomeAnnouncementCard({
  content,
  preview = false,
}: {
  content: HomeAnnouncementContent;
  preview?: boolean;
}) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const { eyebrow, title, text, imageUrl, videoUrl, amazonUrl, productSlug, primaryLabel, secondaryLabel } = content;
  const hasImage = Boolean(imageUrl);
  const hasVideo = Boolean(videoUrl);
  // Con una ficha de la tienda elegida, «Ver por dentro» lleva a ella; si no, abre el video en una ventana.
  const productHref = productSlug ? `/tienda/${productSlug}` : "";
  const hasSecondary = Boolean(productHref) || hasVideo;
  const imageOpensVideo = hasVideo && !productHref;

  // Cuenta una vista por visita (no en la vista previa del panel).
  useEffect(() => {
    if (preview) return;
    try {
      if (window.sessionStorage.getItem("zn-novedad-vista")) return;
      window.sessionStorage.setItem("zn-novedad-vista", "1");
    } catch {
      /* sin almacenamiento: se cuenta igual */
    }
    track("vista");
  }, [preview]);

  const openVideo = () => {
    if (!preview) track("ver");
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    setOpen(true);
  };
  const closeVideo = useCallback(() => {
    setOpen(false);
    returnFocusRef.current?.focus();
  }, []);

  // Ventana abierta: Escape la cierra, el foco va al botón de cerrar y la página de atrás no se desplaza.
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeVideo();
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, closeVideo]);

  const onAmazonClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (preview) {
      e.preventDefault();
      return;
    }
    track("amazon");
  };

  const onProductClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (preview) {
      e.preventDefault();
      return;
    }
    track("ver");
  };

  const primaryButton = () => (
    <a
      href={amazonUrl || "#"}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onAmazonClick}
      className={`zn-shine focus-ring relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gold px-8 py-3.5 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg shadow-[0_10px_30px_-10px_rgba(200,150,27,0.85)] transition hover:bg-gold-bright`}
    >
      {primaryLabel}
      <span aria-hidden="true">→</span>
    </a>
  );

  const picture = (
    <img
      src={imageUrl}
      alt={hasVideo ? "" : title}
      decoding="async"
      draggable={false}
      className="relative block h-auto w-full rounded-2xl border border-gold/40 bg-noir-surface2 shadow-[0_26px_55px_-22px_rgba(38,24,63,0.55)]"
    />
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <article
        aria-labelledby={titleId}
        className="relative isolate overflow-hidden rounded-3xl border border-gold/40 bg-gradient-to-br from-gold/10 via-noir-surface/60 to-noir-surface2/70 px-6 py-10 sm:px-12 sm:py-14"
      >
        {/* Resplandor dorado de fondo */}
        <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -right-16 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />

        <div className={`relative grid items-center gap-10 ${hasImage ? "md:grid-cols-[0.85fr_1.15fr] md:gap-14" : ""}`}>
          {hasImage && (
            <div className="relative mx-auto w-full max-w-[16rem] sm:max-w-xs">
              <div aria-hidden="true" className="absolute inset-6 rounded-full bg-gold/30 blur-2xl" />
              <div className="zn-float relative">
                {imageOpensVideo ? (
                  <button
                    type="button"
                    onClick={openVideo}
                    aria-label={`Ver el video: ${title}`}
                    className="focus-ring group relative block w-full rounded-2xl"
                  >
                    {picture}
                    <span className="absolute -bottom-4 -right-3 flex h-14 w-14 items-center justify-center">
                      <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-gold/50 [animation-duration:2.8s]" />
                      <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gold text-noir-bg shadow-lg transition group-hover:scale-105 group-hover:bg-gold-bright">
                        <PlayIcon className="ml-0.5 h-6 w-6" />
                      </span>
                    </span>
                  </button>
                ) : (
                  picture
                )}
              </div>
            </div>
          )}

          <div className={hasImage ? "text-center md:text-left" : "mx-auto max-w-2xl text-center"}>
            <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">
              <span aria-hidden="true">✦ </span>
              {eyebrow}
            </p>
            <h2 id={titleId} className="mt-3 font-display text-3xl leading-tight text-gold-pale sm:text-4xl">
              {title}
            </h2>
            {text && <p className="mt-4 font-body text-xl leading-relaxed text-gold-pale/85">{text}</p>}

            <div
              className={`mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center ${
                hasImage ? "sm:justify-center md:justify-start" : "sm:justify-center"
              }`}
            >
              {primaryButton()}
              {hasSecondary &&
                (productHref ? (
                  <a
                    href={productHref}
                    onClick={onProductClick}
                    className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-gold/60 px-8 py-3.5 font-ui text-sm font-medium uppercase tracking-wide text-gold transition hover:border-gold hover:bg-gold/10"
                  >
                    {hasVideo && <PlayIcon className="h-4 w-4" />}
                    {secondaryLabel}
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={openVideo}
                    className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-gold/60 px-8 py-3.5 font-ui text-sm font-medium uppercase tracking-wide text-gold transition hover:border-gold hover:bg-gold/10"
                  >
                    <PlayIcon className="h-4 w-4" />
                    {secondaryLabel}
                  </button>
                ))}
            </div>
            <p className="mt-4 font-ui text-xs text-gold-dim">Se abre en Amazon</p>
          </div>
        </div>
      </article>

      {/* Ventana con el video: se abre al tocar «Ver por dentro» o la imagen */}
      {open && hasVideo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Video: ${title}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-8"
          onClick={closeVideo}
        >
          <button
            ref={closeRef}
            type="button"
            onClick={closeVideo}
            aria-label="Cerrar el video"
            className="focus-ring absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-gold bg-noir-bg text-xl text-gold-pale shadow hover:bg-gold hover:text-noir-bg sm:right-6 sm:top-6"
          >
            ✕
          </button>

          <div
            className="flex max-h-full w-full max-w-3xl flex-col items-center gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              src={videoUrl}
              controls
              autoPlay
              playsInline
              preload="metadata"
              controlsList="nodownload noplaybackrate"
              disablePictureInPicture
              onContextMenu={(e) => e.preventDefault()}
              className="max-h-[70vh] w-full rounded-xl bg-black shadow-[0_0_60px_rgba(0,0,0,0.6)]"
            />
            {primaryButton()}
          </div>
        </div>
      )}
    </>
  );
}

