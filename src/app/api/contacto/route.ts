import { NextResponse } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Envía el mensaje del formulario de contacto a CONTACT_TO_EMAIL usando Resend.
// Requiere RESEND_API_KEY y CONTACT_TO_EMAIL configuradas en las variables de entorno.
export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();

    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Ingresá tu nombre." }, { status: 400 });
    }
    if (typeof email !== "string" || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Ingresá un email válido." }, { status: 400 });
    }
    if (typeof message !== "string" || message.trim().length < 5) {
      return NextResponse.json({ error: "Contanos un poco más en el mensaje." }, { status: 400 });
    }

    const to = process.env.CONTACT_TO_EMAIL;

    if (process.env.RESEND_API_KEY && to) {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.NEWSLETTER_FROM || "Zodiac Noir <onboarding@resend.dev>",
        to,
        replyTo: email,
        subject: `Nuevo mensaje de contacto — ${name}`,
        html: `<p><strong>Nombre:</strong> ${name}</p>
               <p><strong>Email:</strong> ${email}</p>
               <p><strong>Mensaje:</strong></p>
               <p>${message.replace(/\n/g, "<br/>")}</p>`,
      });
    } else {
      // Sin Resend/CONTACT_TO_EMAIL configurados: dejamos registro en los logs para no perder el mensaje.
      console.log("Mensaje de contacto (Resend no configurado):", { name, email, message });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error en /api/contacto:", error);
    return NextResponse.json({ error: "No pudimos enviar tu mensaje." }, { status: 500 });
  }
}
