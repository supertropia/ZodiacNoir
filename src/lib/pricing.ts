// Precios en dólares (USD) de la tienda y la membresía.
//
// Los precios se publican siempre en USD. Mercado Pago cobra en pesos, así que en ese caso
// el monto se convierte al dólar blue del momento más un margen (ver exchange-rate.ts).
// PayPal cobra directamente en dólares, sin conversión.

import { usdToArs } from "@/lib/exchange-rate";

/** Texto corto que se muestra junto a cualquier precio en pesos calculado. */
export const FX_NOTE = "En pesos se calcula al dólar blue del día.";

/** "USD 9,99", "USD 3" — sin decimales cuando el monto es entero. */
export function formatUsdAmount(usd: number): string {
  const hasDecimals = Math.abs(usd - Math.round(usd)) > 0.001;
  return `USD ${usd.toLocaleString("es-AR", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

/** "ARS 14.800" */
export function formatArsAmount(ars: number): string {
  return `ARS ${ars.toLocaleString("es-AR")}`;
}

/** Monto en USD con dos decimales y punto, tal como lo pide PayPal ("9.99"). */
export function paypalAmount(usd: number): string {
  return (Math.round(usd * 100) / 100).toFixed(2);
}

/** Precio en pesos de un precio en USD con la cotización dada (null si no hay cotización). */
export function estimateArs(usd: number | null | undefined, rate: number | null | undefined): number | null {
  if (!usd || usd <= 0 || !rate) return null;
  return usdToArs(usd, rate);
}

/** Convierte lo que escribe la administradora ("9,99" o "9.99") en un número de USD válido. */
export function parseUsdInput(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : null;
  if (typeof value !== "string") return null;
  const n = Number(value.trim().replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}
