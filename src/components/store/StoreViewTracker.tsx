"use client";

import { useEffect } from "react";

/**
 * No muestra nada: avisa al servidor que se abrió la tienda ({ kind: "page" }) o la ficha de un
 * libro ({ kind: "product", slug }), para el contador del panel. Una misma pestaña cuenta una sola
 * vez por destino (recargar o volver a abrir la misma ficha no suma de nuevo).
 */
export function StoreViewTracker({ kind, slug }: { kind: "page" | "product"; slug?: string }) {
  useEffect(() => {
    const key = `zn-sv:${kind}:${slug ?? ""}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Sin almacenamiento (navegación privada): se cuenta igual, solo sin evitar repeticiones.
    }
    fetch("/api/store-views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, slug }),
      keepalive: true,
    }).catch(() => {});
  }, [kind, slug]);

  return null;
}
