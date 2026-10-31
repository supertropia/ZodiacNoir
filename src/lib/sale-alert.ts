// Aviso por correo a Zodiac Noir cada vez que entra una venta nueva (producto, membresía).
// Nunca lanza error: si Resend no está configurado o falla, el cobro y la entrega siguen igual.
// (Las lecturas ya tienen su propio aviso en lecturas-email.ts.)

import { CONTACT_EMAIL } from "./site";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type SaleAlert = {
  kind: "producto" | "membresía";
  /** Nombre del producto o del plan. */
  title: string;
  /** Correo de quien compró. */
  buyer: string;
  /** "paypal" | "mercadopago" | otro. */
  provider: string;
};

function providerName(provider: string): string {
  if (provider === "paypal") return "PayPal";
  if (provider === "mercadopago") return "Mercado Pago";
  return provider;
}

/** True si la suscripción pasó a estar activa (o en prueba) y antes no lo estaba. */
export function becameActive(previousStatus: string | null | undefined, nextStatus: string): boolean {
  const active = ["active", "on_trial"];
  return active.includes(nextStatus) && !active.includes(previousStatus ?? "");
}

export async function sendSaleAlert(sale: SaleAlert): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const what = sale.kind === "membresía" ? "Nueva membresía" : "Nueva venta";
    const title = escapeHtml(sale.title);
    const siteUrl = (process.env.NEXTAUTH_URL || "https://zodiacnoirweb.com").replace(/\/$/, "");
    await resend.emails.send({
      from: process.env.NEWSLETTER_FROM || "Zodiac Noir <onboarding@resend.dev>",
      to: CONTACT_EMAIL,
      subject: `${what}: ${sale.title} (${providerName(sale.provider)})`,
      html: `
        <p><strong>${what} en Zodiac Noir ✦</strong></p>
        <p>${sale.kind === "membresía" ? "Plan" : "Producto"}: <strong>${title}</strong><br>
        Pagó con: ${escapeHtml(providerName(sale.provider))}<br>
        Correo de quien compró: ${escapeHtml(sale.buyer)}</p>
        <p>El detalle y los totales están en <a href="${siteUrl}/admin/ventas">Panel → Ventas</a>.</p>
      `,
    });
  } catch (error) {
    console.error("Error enviando el aviso de venta:", error);
  }
}
