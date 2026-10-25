import type { Subscription } from "@prisma/client";
import { prisma } from "./prisma";
import { getPreapproval } from "./mercadopago";
import { getPaypalSubscription, mapPaypalSubscriptionStatus } from "./paypal";

const ACTIVE_STATUSES = ["active", "on_trial"];

// Una suscripción que quedó "pending" se vuelve a consultar a Mercado Pago solo durante
// este tiempo (después se asume que la persona abandonó el pago).
const PENDING_SYNC_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Unifica el status de Mercado Pago con los valores que ya usa Lemon Squeezy
 * ("active" habilita el acceso premium).
 */
export function mapPreapprovalStatus(status: string): string {
  if (status === "authorized") return "active";
  return status; // "pending" | "paused" | "cancelled"
}

/**
 * Si la suscripción de Mercado Pago sigue "pending" en nuestra base, le preguntamos
 * directamente a Mercado Pago cuál es su estado real y lo actualizamos. Esto cubre el caso
 * en que el aviso (webhook) no llegó o llegó tarde: la persona paga, vuelve a la web y
 * queda activada igual, sin depender de que Mercado Pago nos avise.
 * Nunca lanza error: si algo falla, devuelve la suscripción tal como estaba.
 */
export async function syncPendingMercadoPagoSubscription(sub: Subscription): Promise<Subscription> {
  if (sub.provider !== "mercadopago" || !sub.mercadoPagoPreapprovalId) return sub;
  if (sub.status !== "pending") return sub;
  if (Date.now() - sub.updatedAt.getTime() > PENDING_SYNC_WINDOW_MS) return sub;

  try {
    const preapproval = await getPreapproval(sub.mercadoPagoPreapprovalId);
    const status = mapPreapprovalStatus(preapproval.status);
    if (status === sub.status) return sub;

    return await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status,
        renewsAt: preapproval.next_payment_date ? new Date(preapproval.next_payment_date) : sub.renewsAt,
        endsAt: status === "cancelled" ? new Date() : null,
      },
    });
  } catch (error) {
    console.error("No se pudo verificar la suscripción pendiente con Mercado Pago:", error);
    return sub;
  }
}

/**
 * Consulta a PayPal el estado real de una suscripción y lo guarda en nuestra base.
 * Lo usan la vuelta desde PayPal, el aviso (webhook) y la verificación de suscripciones pendientes.
 * Devuelve la suscripción actualizada, o null si no la conocemos.
 */
export async function syncPaypalSubscription(paypalSubscriptionId: string): Promise<Subscription | null> {
  const known = await prisma.subscription.findUnique({ where: { paypalSubscriptionId } });
  if (!known) return null;

  const remote = await getPaypalSubscription(paypalSubscriptionId);
  const status = mapPaypalSubscriptionStatus(remote.status);
  const nextBilling = remote.billing_info?.next_billing_time ? new Date(remote.billing_info.next_billing_time) : null;

  return prisma.subscription.update({
    where: { id: known.id },
    data: {
      provider: "paypal",
      status,
      renewsAt: nextBilling ?? known.renewsAt,
      endsAt: status === "cancelled" ? known.endsAt ?? new Date() : null,
    },
  });
}

/** Igual que syncPendingMercadoPagoSubscription, pero para suscripciones de PayPal. Nunca lanza error. */
export async function syncPendingPaypalSubscription(sub: Subscription): Promise<Subscription> {
  if (sub.provider !== "paypal" || !sub.paypalSubscriptionId) return sub;
  if (sub.status !== "pending") return sub;
  if (Date.now() - sub.updatedAt.getTime() > PENDING_SYNC_WINDOW_MS) return sub;

  try {
    return (await syncPaypalSubscription(sub.paypalSubscriptionId)) ?? sub;
  } catch (error) {
    console.error("No se pudo verificar la suscripción pendiente con PayPal:", error);
    return sub;
  }
}

/** True si el email tiene una membresía paga activa (o en prueba). */
export async function hasActiveMembership(email?: string | null): Promise<boolean> {
  if (!email) return false;
  let sub = await prisma.subscription.findUnique({ where: { email } });
  if (sub && sub.status === "pending") {
    sub = sub.provider === "paypal" ? await syncPendingPaypalSubscription(sub) : await syncPendingMercadoPagoSubscription(sub);
  }
  return !!sub && ACTIVE_STATUSES.includes(sub.status);
}

/** True si el email ya compró un producto (PDF) específico. */
export async function hasPurchased(email: string | undefined | null, productId: string): Promise<boolean> {
  if (!email) return false;
  const purchase = await prisma.purchase.findFirst({
    where: { email, productId, status: "paid" },
  });
  return !!purchase;
}
