import { recordStoreView, getStoreViewStats } from "@/lib/store-views";
import type { ArticleViewStats } from "@/lib/views";

/**
 * Contador de la novedad de la portada. Usa la misma tabla de la tienda (StoreView): un número por
 * evento y por día, sin IP ni datos personales, así que no hace falta tocar la base de datos.
 *
 * Eventos:
 * - "vista": la tarjeta se mostró en la portada (una vez por visita)
 * - "amazon": clic en el botón principal («¡La quiero!»), en la tarjeta o dentro de la ventana del video
 * - "ver": clic en «Ver por dentro»
 */
export const NOVEDAD_TARGETS = {
  vista: "novedad:vista",
  amazon: "novedad:amazon",
  ver: "novedad:ver",
} as const;

export type NovedadEvent = keyof typeof NOVEDAD_TARGETS;

export function isNovedadEvent(value: unknown): value is NovedadEvent {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(NOVEDAD_TARGETS, value);
}

export async function recordNovedadEvent(event: NovedadEvent): Promise<void> {
  await recordStoreView(NOVEDAD_TARGETS[event]);
}

export type NovedadStats = Record<NovedadEvent, ArticleViewStats>;

/** Números para el panel: total, últimos 7 y últimos 30 días de cada evento (en cero si todavía no hay datos). */
export async function getNovedadStats(): Promise<NovedadStats> {
  const all = await getStoreViewStats();
  const pick = (event: NovedadEvent): ArticleViewStats =>
    all.get(NOVEDAD_TARGETS[event]) ?? { total: 0, last7: 0, last30: 0 };
  return { vista: pick("vista"), amazon: pick("amazon"), ver: pick("ver") };
}
