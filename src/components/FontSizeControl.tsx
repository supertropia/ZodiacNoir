"use client";

import { usePrefs } from "./Providers";

export function FontSizeControl() {
  const { decreaseFont, increaseFont } = usePrefs();

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Ajustar tamaño de letra">
      <button
        onClick={decreaseFont}
        aria-label="Achicar letra"
        className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-gold/40 font-ui text-xs text-gold transition hover:border-gold hover:bg-gold/10"
      >
        A−
      </button>
      <button
        onClick={increaseFont}
        aria-label="Agrandar letra"
        className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-gold/40 font-ui text-sm text-gold transition hover:border-gold hover:bg-gold/10"
      >
        A+
      </button>
    </div>
  );
}
