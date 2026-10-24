// Cotización del dólar para cobrar en pesos precios publicados en USD.
//
// Mercado Pago (cuenta de Argentina) solo cobra en pesos y NO convierte monedas: si se le
// manda "35" con moneda USD, cobra 35 pesos. Por eso la conversión la hacemos nosotros,
// en el servidor, justo antes de crear el cobro, y guardamos la cotización usada en el pedido.
//
// Orden de fuentes:
//   1. LECTURAS_USD_ARS_RATE (variable de entorno): si la cargas, se usa ese valor tal cual,
//      sin margen. Sirve para fijar la cotización a mano o si las fuentes automáticas fallan.
//   2. DolarApi.com — dólar oficial, precio de venta.
//   3. Bluelytics — dólar oficial, precio de venta (respaldo).
// Al valor automático se le suma un margen (LECTURAS_FX_MARGIN_PERCENT, 3 % por defecto) para
// cubrir la variación del dólar entre que la persona ve el precio y que el pago se acredita.

export type FxQuote = {
  /** Cotización aplicada (ya incluye el margen cuando viene de una fuente automática). */
  rate: number;
  /** Cotización de la fuente, sin margen. */
  baseRate: number;
  source: string;
};

const SANITY_MIN = 100;
const SANITY_MAX = 100000;

function isSane(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= SANITY_MIN && value <= SANITY_MAX;
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    // Se reutiliza durante 15 minutos para no consultar la fuente en cada visita.
    next: { revalidate: 900 },
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const SOURCES: { name: string; url: string; pick: (json: any) => unknown }[] = [
  {
    name: "dolarapi.com (oficial, venta)",
    url: "https://dolarapi.com/v1/dolares/oficial",
    pick: (json) => json?.venta,
  },
  {
    name: "bluelytics.com.ar (oficial, venta)",
    url: "https://api.bluelytics.com.ar/v2/latest",
    pick: (json) => json?.oficial?.value_sell,
  },
];

function getMarginPercent(): number {
  const raw = process.env.LECTURAS_FX_MARGIN_PERCENT;
  if (!raw) return 3;
  const margin = Number(raw);
  if (!Number.isFinite(margin)) return 3;
  return Math.min(Math.max(margin, 0), 25);
}

/** Devuelve la cotización a usar, o null si no se pudo obtener ninguna. Nunca lanza error. */
export async function getUsdArsQuote(): Promise<FxQuote | null> {
  const manual = Number(process.env.LECTURAS_USD_ARS_RATE);
  if (process.env.LECTURAS_USD_ARS_RATE && isSane(manual)) {
    return { rate: manual, baseRate: manual, source: "manual (LECTURAS_USD_ARS_RATE)" };
  }

  for (const source of SOURCES) {
    try {
      const value = Number(source.pick(await fetchJson(source.url)));
      if (!isSane(value)) continue;
      const margin = getMarginPercent();
      const rate = Math.round(value * (1 + margin / 100) * 100) / 100;
      return { rate, baseRate: value, source: source.name };
    } catch (error) {
      console.error(`No se pudo leer la cotización desde ${source.name}:`, error);
    }
  }
  return null;
}

/** Pasa un precio en USD a pesos, redondeando hacia arriba a la centena más cercana. */
export function usdToArs(usd: number, rate: number): number {
  return Math.ceil((usd * rate) / 100) * 100;
}
