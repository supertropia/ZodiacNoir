/**
 * Texto de precio de un plan de membresía, siempre con moneda.
 *
 * - Si el "Precio a mostrar" cargado en el panel ya trae moneda o símbolo
 *   ("ARS 2.500/mes", "USD 6,99", "$2.500"), se respeta tal cual.
 * - Si es solo un número ("2500") y el plan tiene precio en ARS, se muestra
 *   "ARS 2.500 / mes" a partir de los datos del plan.
 */
export function formatPlanPrice(plan: {
  priceLabel: string;
  priceArs: number | null;
  interval: string;
}): string {
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
