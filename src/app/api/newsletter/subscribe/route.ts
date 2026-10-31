import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildNewsletterHtml,
  oneClickUnsubscribeUrl,
  textToEmailHtml,
  textToPlain,
  unsubscribeUrl,
} from "@/lib/newsletter";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const WELCOME_TEXT = `Gracias por sumarte al boletín de Zodiac Noir.

Vas a recibir las próximas lunaciones, eclipses y aspectos planetarios antes que nadie.

Puedes darte de baja cuando quieras desde el enlace que aparece al final de cada correo.`;

/**
 * Averigua de dónde viene la suscripción a partir de la página desde la que se envió el formulario (cabecera Referer).
 * Si el enlace traía ?utm_source=youtube (o instagram, etc.) se guarda esa etiqueta; si no, la parte del sitio.
 */
function detectSource(req: Request): string {
  const referer = req.headers.get("referer");
  if (!referer) return "web-otra";
  try {
    const url = new URL(referer);
    const utm = (url.searchParams.get("utm_source") || "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 30);
    if (utm) return utm;
    if (url.pathname === "/") return "web-portada";
    if (url.pathname.startsWith("/blog/")) return "web-articulo";
    if (url.pathname.startsWith("/newsletter")) return "web-newsletter";
    return "web-otra";
  } catch {
    return "web-otra";
  }
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (typeof email !== "string" || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Ingresá un email válido." }, { status: 400 });
    }

    const existing = await prisma.subscriber.findUnique({ where: { email } });
    const wasActive = Boolean(existing && !existing.unsubscribedAt);

    // Si alguien que se había dado de baja vuelve a suscribirse, se reactiva (unsubscribedAt vuelve a vacío).
    const subscriber = await prisma.subscriber.upsert({
      where: { email },
      update: { unsubscribedAt: null },
      create: { email, source: detectSource(req) },
    });

    // Correo de bienvenida solo para suscripciones nuevas o reactivadas (requiere RESEND_API_KEY).
    if (process.env.RESEND_API_KEY && !wasActive) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.NEWSLETTER_FROM || "Zodiac Noir <onboarding@resend.dev>",
          to: email,
          subject: "Bienvenido/a a Zodiac Noir",
          html: buildNewsletterHtml(textToEmailHtml(WELCOME_TEXT), subscriber.unsubscribeToken),
          text: textToPlain(WELCOME_TEXT, subscriber.unsubscribeToken),
          headers: {
            "List-Unsubscribe": `<${oneClickUnsubscribeUrl(subscriber.unsubscribeToken)}>, <${unsubscribeUrl(subscriber.unsubscribeToken)}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        });
      } catch (mailError) {
        console.error("Error enviando email de bienvenida:", mailError);
        // No bloqueamos la suscripción si falla el envío del email.
      }
    }

    return NextResponse.json({ ok: true, subscriber: { email: subscriber.email } });
  } catch (error) {
    console.error("Error en /api/newsletter/subscribe:", error);
    return NextResponse.json({ error: "No pudimos procesar la suscripción." }, { status: 500 });
  }
}
