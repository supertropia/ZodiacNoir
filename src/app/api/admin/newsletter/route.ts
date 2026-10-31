import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";
import {
  buildNewsletterHtml,
  oneClickUnsubscribeUrl,
  textToEmailHtml,
  textToPlain,
  unsubscribeUrl,
} from "@/lib/newsletter";
import { CONTACT_EMAIL } from "@/lib/site";

export const dynamic = "force-dynamic";
// Un envío a muchas personas puede tardar unos segundos.
export const maxDuration = 60;

const BATCH_SIZE = 100; // máximo que acepta Resend por llamada

function fromAddress() {
  return process.env.NEWSLETTER_FROM || "Zodiac Noir <onboarding@resend.dev>";
}

/** Cuántas personas están suscriptas y cuántas se dieron de baja. */
export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const [active, unsubscribed] = await Promise.all([
    prisma.subscriber.count({ where: { unsubscribedAt: null } }),
    prisma.subscriber.count({ where: { unsubscribedAt: { not: null } } }),
  ]);
  return NextResponse.json({ active, unsubscribed });
}

/** mode "test": se envía solo a tu correo de administradora. mode "all": se envía a todos los suscriptores activos. */
export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Falta configurar RESEND_API_KEY en Vercel." }, { status: 500 });
  }

  try {
    const { subject, body, mode } = await req.json();
    const cleanSubject = typeof subject === "string" ? subject.trim() : "";
    const cleanBody = typeof body === "string" ? body.trim() : "";

    if (!cleanSubject || cleanSubject.length > 150) {
      return NextResponse.json({ error: "Escribe un asunto (hasta 150 caracteres)." }, { status: 400 });
    }
    if (cleanBody.length < 20) {
      return NextResponse.json({ error: "El mensaje es demasiado corto." }, { status: 400 });
    }
    if (mode !== "test" && mode !== "all") {
      return NextResponse.json({ error: "Modo de envío no válido." }, { status: 400 });
    }

    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const bodyHtml = textToEmailHtml(cleanBody);

    // --- Prueba: un solo correo a la administradora ---
    if (mode === "test") {
      const to = session.user?.email;
      if (!to) return NextResponse.json({ error: "No se pudo identificar tu correo." }, { status: 400 });
      const { error } = await resend.emails.send({
        from: fromAddress(),
        to,
        replyTo: CONTACT_EMAIL,
        subject: `[PRUEBA] ${cleanSubject}`,
        html: buildNewsletterHtml(bodyHtml, null),
        text: textToPlain(cleanBody),
      });
      if (error) {
        console.error("Error enviando prueba de newsletter:", error);
        return NextResponse.json({ error: `Resend no pudo enviar la prueba: ${error.message}` }, { status: 502 });
      }
      return NextResponse.json({ ok: true, sent: 1, to });
    }

    // --- Envío real a todos los suscriptores que no se dieron de baja ---
    const subscribers = await prisma.subscriber.findMany({
      where: { unsubscribedAt: null },
      select: { email: true, unsubscribeToken: true },
      orderBy: { createdAt: "asc" },
    });
    if (subscribers.length === 0) {
      return NextResponse.json({ error: "Todavía no hay suscriptores activos." }, { status: 400 });
    }

    let sent = 0;
    let failed = 0;
    let firstError = "";

    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const chunk = subscribers.slice(i, i + BATCH_SIZE);
      const payload = chunk.map((s: { email: string; unsubscribeToken: string }) => ({
        from: fromAddress(),
        to: s.email,
        replyTo: CONTACT_EMAIL,
        subject: cleanSubject,
        html: buildNewsletterHtml(bodyHtml, s.unsubscribeToken),
        text: textToPlain(cleanBody, s.unsubscribeToken),
        headers: {
          "List-Unsubscribe": `<${oneClickUnsubscribeUrl(s.unsubscribeToken)}>, <${unsubscribeUrl(s.unsubscribeToken)}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      }));

      try {
        const { error } = await resend.batch.send(payload);
        if (error) {
          failed += chunk.length;
          if (!firstError) firstError = error.message;
          console.error("Error en tanda de newsletter:", error);
        } else {
          sent += chunk.length;
        }
      } catch (err) {
        failed += chunk.length;
        if (!firstError) firstError = err instanceof Error ? err.message : "Error desconocido";
        console.error("Error en tanda de newsletter:", err);
      }
    }

    return NextResponse.json({ ok: failed === 0, sent, failed, firstError, total: subscribers.length });
  } catch (error) {
    console.error("Error en /api/admin/newsletter:", error);
    return NextResponse.json({ error: "No se pudo enviar el boletín." }, { status: 500 });
  }
}
