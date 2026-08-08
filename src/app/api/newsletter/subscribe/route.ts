import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (typeof email !== "string" || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Ingresá un email válido." }, { status: 400 });
    }

    const subscriber = await prisma.subscriber.upsert({
      where: { email },
      update: {},
      create: { email },
    });

    // Envío de email de bienvenida (opcional, requiere RESEND_API_KEY).
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.NEWSLETTER_FROM || "Zodiac Noir <onboarding@resend.dev>",
          to: email,
          subject: "Bienvenido/a a Zodiac Noir",
          html: `<p>Gracias por sumarte al boletín de Zodiac Noir. Vas a recibir las próximas lunaciones, eclipses y aspectos planetarios antes que nadie.</p>
                 <p style="color:#8A733B;font-size:12px">Si querés darte de baja en cualquier momento, respondé este correo.</p>`,
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
