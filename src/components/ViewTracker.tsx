"use client";

import { useEffect } from "react";

/**
 * No muestra nada: avisa al servidor que este artículo se abrió, para el contador del panel.
 * Una misma pestaña cuenta una sola vez por artículo (recargar la página no suma de nuevo).
 */
export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `zn-view:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Sin almacenamiento (navegación privada): se cuenta igual, solo sin evitar repeticiones.
    }
    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
      keepalive: true,
    }).catch(() => {});
  }, [slug]);

  return null;
}
