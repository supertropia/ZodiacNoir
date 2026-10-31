"use client";

import { useState } from "react";

/**
 * Reproductor del video de presentación de un producto.
 * Se adapta a la forma del video: los horizontales ocupan el ancho de la ficha y los verticales (tipo reel)
 * quedan en una columna angosta, para que no aparezcan enormes franjas negras a los costados.
 */
export function ProductVideo({ src, title }: { src: string; title: string }) {
  const [vertical, setVertical] = useState(false);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <p className="rounded-xl border border-gold/25 bg-gold/5 px-4 py-3 text-center font-ui text-sm text-gold-pale">
        No pudimos cargar el video en este momento. Vuelve a intentarlo en unos minutos.
      </p>
    );
  }

  // "#t=0.1" hace que los celulares muestren un primer cuadro del video en lugar de un recuadro negro.
  const videoSrc = src.includes("#") ? src : `${src}#t=0.1`;

  return (
    <div className={`mx-auto w-full ${vertical ? "max-w-xs sm:max-w-sm" : "max-w-3xl"}`}>
      <video
        src={videoSrc}
        controls
        playsInline
        preload="metadata"
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        aria-label={`Video de presentación: ${title}`}
        onContextMenu={(e) => e.preventDefault()}
        onLoadedMetadata={(e) => {
          const v = e.currentTarget;
          if (v.videoWidth && v.videoHeight) setVertical(v.videoHeight > v.videoWidth);
        }}
        onError={() => setFailed(true)}
        className="block max-h-[75vh] w-full rounded-2xl border border-gold/30 bg-black shadow-[0_18px_40px_-20px_rgba(38,24,63,0.45)]"
      />
    </div>
  );
}
