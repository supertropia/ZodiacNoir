import { formatUsdAmount } from "@/lib/pricing";

/**
 * Texto de precio de un plan de membresía, siempre con moneda.
 *
 * - Si el plan tiene precio en USD, se muestra "USD 3 / mes" (es el precio oficial).
 * - Si no, y el "Precio a mostrar" ya trae moneda o símbolo ("ARS 2.500/mes"), se respeta tal cual.
 * - Si es solo un número ("2500") y el plan tiene precio en ARS, se muestra "ARS 2.500 / mes".
 */
export function formatPlanPrice(plan: {
  priceLabel: string;
  priceArs: number | null;
  priceUsd?: number | null;
  interval: string;
}): string {
  if (plan.priceUsd && plan.priceUsd > 0) {
    return `${formatUsdAmount(plan.priceUsd)} / ${plan.interval}`;
  }

  const label = plan.priceLabel.trim();
  if (/[A-Za-z$€£]/.test(label)) return label;

  if (plan.priceArs && plan.priceArs > 0) {
    // Separador de miles con punto, escrito a mano: así sale "2.500" siempre,
    // sin depender de la configuración regional del servidor.
    const amount = String(Math.round(plan.priceArs)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `ARS ${amount} / ${plan.interval}`;
  }

  return label;
}
