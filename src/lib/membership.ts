import { prisma } from "./prisma";

const ACTIVE_STATUSES = ["active", "on_trial"];

/** True si el email tiene una membresía paga activa (o en prueba). */
export async function hasActiveMembership(email?: string | null): Promise<boolean> {
  if (!email) return false;
  const sub = await prisma.subscription.findUnique({ where: { email } });
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
