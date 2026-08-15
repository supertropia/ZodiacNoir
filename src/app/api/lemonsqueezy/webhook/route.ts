import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyLemonSignature } from "@/lib/lemonsqueezy";

export const runtime = "nodejs";

// Lemon Squeezy manda el evento en meta.event_name. Documentación:
// https://docs.lemonsqueezy.com/help/webhooks
export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature");

  if (!verifyLemonSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const eventName: string = payload?.meta?.event_name;
  const data = payload?.data;
  const attrs = data?.attributes ?? {};
  const email: string | undefined = attrs.user_email ?? attrs.customer_email;

  try {
    if (eventName?.startsWith("subscription_")) {
      const variantId = String(attrs.variant_id ?? "");
      const plan = await prisma.membershipPlan.findFirst({ where: { lemonVariantId: variantId } });

      if (email) {
        await prisma.subscription.upsert({
          where: { lemonSubscriptionId: String(data.id) },
          update: {
            status: attrs.status,
            renewsAt: attrs.renews_at ? new Date(attrs.renews_at) : null,
            endsAt: attrs.ends_at ? new Date(attrs.ends_at) : null,
            planId: plan?.id,
          },
          create: {
            email,
            lemonSubscriptionId: String(data.id),
            lemonCustomerId: String(attrs.customer_id ?? ""),
            status: attrs.status,
            renewsAt: attrs.renews_at ? new Date(attrs.renews_at) : null,
            endsAt: attrs.ends_at ? new Date(attrs.ends_at) : null,
            planId: plan?.id,
          },
        });
      }
    }

    if (eventName === "order_created") {
      const orderItems = attrs.first_order_item ? [attrs.first_order_item] : [];
      for (const item of orderItems) {
        const variantId = String(item.variant_id ?? "");
        const product = await prisma.product.findFirst({ where: { lemonVariantId: variantId } });
        if (product && email) {
          await prisma.purchase.upsert({
            where: { lemonOrderId: String(data.id) },
            update: { status: "paid" },
            create: {
              email,
              productId: product.id,
              lemonOrderId: String(data.id),
              status: "paid",
            },
          });
        }
      }
    }

    if (eventName === "order_refunded") {
      await prisma.purchase.updateMany({
        where: { lemonOrderId: String(data.id) },
        data: { status: "refunded" },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error procesando webhook de Lemon Squeezy:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
