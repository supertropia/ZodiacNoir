import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { capturePaypalOrder, getSiteUrl, readCompletedCapture } from "@/lib/paypal";
import { sendDownloadEmail } from "@/lib/purchase-email";
import { sendSaleAlert } from "@/lib/sale-alert";
import { sendReadingPaidEmails } from "@/lib/lecturas-email";
import { READING_DELIVERY_MAX_BUSINESS_DAYS, addBusinessDays } from "@/lib/lecturas";
import { syncPaypalSubscription } from "@/lib/membership";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Acá vuelve la persona después de aprobar el pago en PayPal. El servidor cobra (captura) la orden o
// consulta la suscripción, verifica contra nuestra base que el monto y el producto coincidan, y recién
// entonces da el pago por bueno. Nada de lo que viene en la URL se toma como cierto sin verificarlo.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind");
  const ref = url.searchParams.get("ref") ?? "";
  const siteUrl = getSiteUrl();
  const go = (path: string) => NextResponse.redirect(new URL(path, siteUrl));

  try {
    if (kind === "product") return await handleProduct(url, ref, go);
    if (kind === "reading") return await handleReading(url, ref, go);
    if (kind === "subscription") return await handleSubscription(url, ref, go);
  } catch (error) {
    console.error("Error al volver de PayPal:", error);
    if (kind === "reading") return go("/lecturas?pago=error");
    if (kind === "subscription") return go("/membresia?pago=error");
    return go("/tienda?compra=error");
  }
  return go("/");
}

type Go = (path: string) => NextResponse;

async function handleProduct(url: URL, productId: string, go: Go) {
  const token = url.searchParams.get("token");
  if (!token) return go("/tienda?compra=error");

  const order = await capturePaypalOrder(token);
  const capture = readCompletedCapture(order);
  if (!capture || capture.customId !== `product:${productId}`) {
    console.error("Pago de PayPal no confirmado o con datos que no coinciden:", { token, productId });
    return go("/tienda?compra=error");
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.priceUsd || capture.amountUsd + 0.001 < product.priceUsd) {
    console.error("Pago de PayPal con monto inesperado, revisar en PayPal:", {
      token,
      expected: product?.priceUsd,
      received: capture.amountUsd,
    });
    return go("/tienda?compra=error");
  }

  // El PDF queda asociado a la cuenta con la que se inició sesión; si no hay sesión, al correo de PayPal.
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? order.payer?.email_address ?? null;
  if (!email) {
    console.error("Pago de PayPal sin correo para asociar la compra:", { token });
    return go("/tienda?compra=error");
  }

  const already = await prisma.purchase.findUnique({ where: { paypalOrderId: order.id } });
  await prisma.purchase.upsert({
    where: { paypalOrderId: order.id },
    update: { status: "paid" },
    create: { email, productId: product.id, provider: "paypal", paypalOrderId: order.id, status: "paid" },
  });
  if (already?.status !== "paid") {
    await sendDownloadEmail(email, product.title, product.fileUrl);
    await sendSaleAlert({ kind: "producto", title: product.title, buyer: email, provider: "paypal" });
  }

  return go("/tienda?compra=1");
}

async function handleReading(url: URL, readingOrderId: string, go: Go) {
  const token = url.searchParams.get("token");
  if (!token) return go("/lecturas?pago=error");

  const reading = await prisma.readingOrder.findUnique({ where: { id: readingOrderId } });
  if (!reading || reading.provider !== "paypal") return go("/lecturas?pago=error");

  const order = await capturePaypalOrder(token);
  const capture = readCompletedCapture(order);
  if (!capture || capture.customId !== `reading:${reading.id}` || capture.amountUsd + 0.001 < reading.priceUsd) {
    console.error("Pago de PayPal de una lectura no confirmado o con monto inesperado:", {
      token,
      readingOrderId,
      expected: reading.priceUsd,
      received: capture?.amountUsd,
    });
    return go("/lecturas?pago=error");
  }

  // Se confirma una sola vez: si la persona vuelve a abrir este enlace, no se repite el correo.
  const paidAt = new Date();
  const claimed = await prisma.readingOrder.updateMany({
    where: { id: reading.id, status: { in: ["pending", "cancelled"] } },
    data: {
      status: "paid",
      paidAt,
      deliverBy: addBusinessDays(paidAt, READING_DELIVERY_MAX_BUSINESS_DAYS),
      paypalOrderId: order.id,
    },
  });
  if (claimed.count === 1) {
    const paid = await prisma.readingOrder.findUnique({ where: { id: reading.id } });
    if (paid) await sendReadingPaidEmails(paid);
  }

  return go(`/lecturas/gracias?pedido=${encodeURIComponent(reading.id)}`);
}

async function handleSubscription(url: URL, planId: string, go: Go) {
  const subscriptionId = url.searchParams.get("subscription_id");
  if (!subscriptionId) return go("/membresia?pago=error");

  const known = await prisma.subscription.findUnique({ where: { paypalSubscriptionId: subscriptionId } });
  if (!known || known.planId !== planId) {
    console.error("Suscripción de PayPal desconocida al volver:", { subscriptionId, planId });
    return go("/membresia?pago=error");
  }

  await syncPaypalSubscription(subscriptionId);
  return go("/membresia?bienvenido=1");
}
