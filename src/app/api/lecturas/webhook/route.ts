import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getReadingPayment } from "@/lib/lecturas-mp";
import { READING_DELIVERY_MAX_BUSINESS_DAYS, addBusinessDays } from "@/lib/lecturas";
import { sendReadingPaidEmails } from "@/lib/lecturas-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Aviso de Mercado Pago por un pago de una lectura. El aviso solo trae el número de pago:
// lo consultamos nosotros contra la API de Mercado Pago y recién ahí decidimos qué hacer.
async function handleNotification(req: Request) {
  const url = new URL(req.url);
  let type = url.searchParams.get("type") ?? url.searchParams.get("topic");
  let paymentId = url.searchParams.get("data.id") ?? url.searchParams.get("id");

  // Algunos avisos llegan con los datos en el cuerpo JSON y no en la URL.
  if ((!type || !paymentId) && req.method === "POST") {
    try {
      const body = await req.json();
      type = type ?? body?.type ?? body?.topic ?? null;
      paymentId = paymentId ?? (body?.data?.id != null ? String(body.data.id) : null);
    } catch {
      // Cuerpo vacío o que no es JSON: seguimos con lo que haya.
    }
  }

  if (type !== "payment" || !paymentId) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    const payment = await getReadingPayment(paymentId);
    const orderId = payment.external_reference;
    if (!orderId) return NextResponse.json({ ok: true, skipped: true });

    const order = await prisma.readingOrder.findUnique({ where: { id: orderId } });
    if (!order) return NextResponse.json({ ok: true, skipped: true });

    if (payment.status === "approved") {
      // El monto cobrado tiene que ser el que fijamos al crear el pedido, en pesos.
      if (payment.currency_id !== "ARS" || payment.transaction_amount < order.priceArs) {
        console.error("Pago de lectura con monto inesperado, no se confirma el pedido:", {
          orderId,
          paymentId,
          expected: order.priceArs,
          received: payment.transaction_amount,
          currency: payment.currency_id,
        });
        return NextResponse.json({ ok: true, skipped: true });
      }

      // Se confirma una sola vez: si Mercado Pago repite el aviso, esta actualización no encuentra
      // el pedido en "pending" y no se vuelve a mandar ningún correo.
      const paidAt = new Date();
      const claimed = await prisma.readingOrder.updateMany({
        where: { id: order.id, status: { in: ["pending", "cancelled"] } },
        data: {
          status: "paid",
          paidAt,
          deliverBy: addBusinessDays(paidAt, READING_DELIVERY_MAX_BUSINESS_DAYS),
          mercadoPagoPaymentId: String(payment.id),
        },
      });

      if (claimed.count === 1) {
        const paidOrder = await prisma.readingOrder.findUnique({ where: { id: order.id } });
        if (paidOrder) await sendReadingPaidEmails(paidOrder);
      } else if (order.mercadoPagoPaymentId && order.mercadoPagoPaymentId !== String(payment.id)) {
        // Dos pagos aprobados para el mismo pedido (la persona pagó dos veces): hay que devolver uno a mano.
        console.error("Pago duplicado para un pedido de lectura, revisar en Mercado Pago:", {
          orderId,
          firstPayment: order.mercadoPagoPaymentId,
          secondPayment: String(payment.id),
        });
      }
    } else if (["refunded", "cancelled", "charged_back"].includes(payment.status)) {
      await prisma.readingOrder.updateMany({
        where: { id: order.id, mercadoPagoPaymentId: String(payment.id) },
        data: { status: "refunded" },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error procesando el aviso de pago de una lectura:", error);
    // Respondemos con error a propósito: así Mercado Pago vuelve a avisar y no se pierde un pago real.
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return handleNotification(req);
}

// Mercado Pago a veces manda el aviso como GET.
export async function GET(req: Request) {
  return handleNotification(req);
}
