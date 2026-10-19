import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPayment, getPreapproval } from "@/lib/mercadopago";
import { mapPreapprovalStatus } from "@/lib/membership";

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

// Alta/cambio de estado de una membresía (Suscripciones / Preapproval).
// Primero buscamos la suscripción por su ID de Mercado Pago (la guardamos como "pending"
// al crearla, junto con el email de la cuenta de la web). Así queda asociada a la cuenta
// correcta aunque la persona haya pagado con otro email en Mercado Pago. Si no la
// conocemos (suscripciones creadas antes de este cambio), usamos el email del pagador.
async function handlePreapprovalNotification(preapprovalId: string) {
  try {
    const preapproval = await getPreapproval(preapprovalId);
    const email = preapproval.payer_email;
    const planId = preapproval.external_reference || undefined;
    const status = mapPreapprovalStatus(preapproval.status);
    const renewsAt = preapproval.next_payment_date ? new Date(preapproval.next_payment_date) : null;

    console.log("Webhook de suscripción:", String(preapproval.id), preapproval.status, "->", status);

    const known = await prisma.subscription.findUnique({
      where: { mercadoPagoPreapprovalId: String(preapproval.id) },
    });

    if (known) {
      await prisma.subscription.update({
        where: { id: known.id },
        data: {
          provider: "mercadopago",
          status,
          renewsAt: renewsAt ?? known.renewsAt,
          endsAt: status === "cancelled" ? known.endsAt ?? new Date() : null,
        },
      });
    } else if (email) {
      await prisma.subscription.upsert({
        where: { email },
        update: {
          provider: "mercadopago",
          status,
          mercadoPagoPreapprovalId: String(preapproval.id),
          renewsAt,
          planId,
        },
        create: {
          email,
          provider: "mercadopago",
          mercadoPagoPreapprovalId: String(preapproval.id),
          status,
          renewsAt,
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
  let type = url.searchParams.get("type") ?? url.searchParams.get("topic");
  let resourceId = url.searchParams.get("data.id") ?? url.searchParams.get("id");

  // Algunos avisos (sobre todo los de Suscripciones) llegan con los datos en el cuerpo JSON
  // y no en la URL. Si no los encontramos arriba, los buscamos ahí.
  if ((!type || !resourceId) && req.method === "POST") {
    try {
      const body = await req.json();
      type = type ?? body?.type ?? body?.topic ?? null;
      resourceId = resourceId ?? (body?.data?.id != null ? String(body.data.id) : null);
    } catch {
      // Cuerpo vacío o que no es JSON: seguimos con lo que haya.
    }
  }

  console.log("Webhook de Mercado Pago recibido:", type, resourceId);

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
