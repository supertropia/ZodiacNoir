import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPayment, getPreapproval } from "@/lib/mercadopago";

export const runtime = "nodejs";

// Manda el email con el link de descarga usando Resend, siguiendo el mismo patrón
// que /api/contacto. Si Resend todavía no tiene un dominio verificado (modo sandbox),
// esto va a fallar en silencio para emails que no sean el de la propia cuenta — no
// rompe el webhook, solo no llega el mail hasta que se resuelva esa configuración.
async function sendDownloadEmail(to: string, productTitle: string, fileUrl: string | null) {
  if (!process.env.RESEND_API_KEY || !fileUrl) return;
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.NEWSLETTER_FROM || "Zodiac Noir <onboarding@resend.dev>",
      to,
      subject: `Tu PDF ya está listo: ${productTitle}`,
      html: `
        <p>¡Gracias por tu compra en Zodiac Noir!</p>
        <p>Tu PDF <strong>${productTitle}</strong> ya está disponible. Podés descargarlo desde este link:</p>
        <p><a href="${fileUrl}">${fileUrl}</a></p>
        <p>Guardá este email por si querés volver a descargarlo más adelante.</p>
        <p>Que lo disfrutes ✦</p>
      `,
    });
  } catch (error) {
    console.error("Error enviando email de descarga:", error);
  }
}

// Sin cambios respecto de antes: pago único de un PDF de la tienda.
async function handlePaymentNotification(paymentId: string) {
  try {
    const payment = await getPayment(paymentId);
    const productId = payment.external_reference;
    const email = payment.payer?.email;

    if (payment.status === "approved" && productId && email) {
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (product) {
        const already = await prisma.purchase.findUnique({
          where: { mercadoPagoPaymentId: String(payment.id) },
        });
        const wasAlreadyPaid = already?.status === "paid";

        await prisma.purchase.upsert({
          where: { mercadoPagoPaymentId: String(payment.id) },
          update: { status: "paid" },
          create: {
            email,
            productId: product.id,
            provider: "mercadopago",
            mercadoPagoPaymentId: String(payment.id),
            status: "paid",
          },
        });

        // Solo mandamos el mail la primera vez que este pago puntual queda "paid"
        // (Mercado Pago a veces reenvía la misma notificación más de una vez).
        if (!wasAlreadyPaid) {
          await sendDownloadEmail(email, product.title, product.fileUrl);
        }
      }
    }

    if (payment.status === "refunded" || payment.status === "cancelled") {
      await prisma.purchase.updateMany({
        where: { mercadoPagoPaymentId: String(payment.id) },
        data: { status: "refunded" },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error procesando webhook de pago de Mercado Pago:", error);
    // Devolvemos 200 igual para que Mercado Pago no reintente indefinidamente
    // un evento que ya sabemos que no vamos a poder procesar (ej. producto borrado).
    return NextResponse.json({ ok: false });
  }
}

// Unifica el status de Mercado Pago con los mismos valores que ya usa Lemon Squeezy
// en hasActiveMembership() ("active" habilita el acceso premium).
function mapPreapprovalStatus(status: string): string {
  if (status === "authorized") return "active";
  return status; // "pending" | "paused" | "cancelled"
}

// Alta/cambio de estado de una membresía (Suscripciones / Preapproval).
async function handlePreapprovalNotification(preapprovalId: string) {
  try {
    const preapproval = await getPreapproval(preapprovalId);
    const email = preapproval.payer_email;
    const planId = preapproval.external_reference || undefined;

    if (email) {
      await prisma.subscription.upsert({
        where: { email },
        update: {
          provider: "mercadopago",
          status: mapPreapprovalStatus(preapproval.status),
          mercadoPagoPreapprovalId: String(preapproval.id),
          renewsAt: preapproval.next_payment_date ? new Date(preapproval.next_payment_date) : null,
          planId,
        },
        create: {
          email,
          provider: "mercadopago",
          mercadoPagoPreapprovalId: String(preapproval.id),
          status: mapPreapprovalStatus(preapproval.status),
          renewsAt: preapproval.next_payment_date ? new Date(preapproval.next_payment_date) : null,
          planId,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error procesando webhook de suscripción de Mercado Pago:", error);
    return NextResponse.json({ ok: false });
  }
}

// Mercado Pago avisa los eventos como query params en la URL (type=payment&data.id=XXXX,
// o en el formato viejo topic=payment&id=XXXX). No confiamos en el contenido del aviso:
// lo usamos solo para saber qué recurso consultar directamente contra la API de Mercado Pago.
// Documentación: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/notifications/webhooks
async function handleNotification(req: Request) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? url.searchParams.get("topic");
  const resourceId = url.searchParams.get("data.id") ?? url.searchParams.get("id");

  if (!resourceId) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  if (type === "payment") {
    return handlePaymentNotification(resourceId);
  }

  if (type === "subscription_preapproval") {
    return handlePreapprovalNotification(resourceId);
  }

  // Puede ser otro tipo de evento (ej. "merchant_order", "subscription_authorized_payment")
  // que no procesamos por ahora.
  return NextResponse.json({ ok: true, skipped: true });
}

export async function POST(req: Request) {
  return handleNotification(req);
}

// Mercado Pago a veces manda la notificación como GET en vez de POST.
export async function GET(req: Request) {
  return handleNotification(req);
}
