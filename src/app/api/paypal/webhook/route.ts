import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaypalCapture } from "@/lib/paypal";
import { syncPaypalSubscription } from "@/lib/membership";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Avisos (webhooks) de PayPal: renovaciones, cancelaciones y devoluciones.
//
// No confiamos en el contenido del aviso: lo usamos solo para saber QUÉ consultar, y el estado real se
// pide directamente a PayPal con nuestras credenciales (igual que con Mercado Pago). Por eso un aviso
// falso no puede activar una membresía ni marcar un pago.
export async function POST(req: Request) {
  try {
    const event = await req.json().catch(() => null);
    const type: string = event?.event_type ?? "";
    const resource = event?.resource ?? {};

    // Cambios en una suscripción (activada, cancelada, suspendida, vencida, cobro fallido).
    if (type.startsWith("BILLING.SUBSCRIPTION.") && typeof resource.id === "string") {
      await syncPaypalSubscription(resource.id);
    }

    // Cobro mensual de una suscripción: sirve para actualizar la próxima fecha de renovación.
    if (type === "PAYMENT.SALE.COMPLETED" && typeof resource.billing_agreement_id === "string") {
      await syncPaypalSubscription(resource.billing_agreement_id);
    }

    // Devolución de un pago único: marca la compra o la lectura como devuelta.
    if (type === "PAYMENT.CAPTURE.REFUNDED" || type === "PAYMENT.CAPTURE.REVERSED") {
      const up = Array.isArray(resource.links) ? resource.links.find((l: any) => l?.rel === "up")?.href : null;
      const captureId = typeof up === "string" ? up.split("/").pop() : null;
      if (captureId) {
        const capture = await getPaypalCapture(captureId);
        if (capture.orderId && ["REFUNDED", "REVERSED"].includes(capture.status)) {
          await prisma.purchase.updateMany({ where: { paypalOrderId: capture.orderId }, data: { status: "refunded" } });
          await prisma.readingOrder.updateMany({ where: { paypalOrderId: capture.orderId }, data: { status: "refunded" } });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error procesando el aviso de PayPal:", error);
    // Error a propósito: así PayPal vuelve a avisar y no se pierde un cambio real.
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
