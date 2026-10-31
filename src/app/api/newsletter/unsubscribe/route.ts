import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function unsubscribe(token: string) {
  if (!token || token.length > 100) return { ok: false as const, status: 400 };
  const subscriber = await prisma.subscriber.findUnique({ where: { unsubscribeToken: token } });
  if (!subscriber) return { ok: false as const, status: 404 };
  if (!subscriber.unsubscribedAt) {
    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: { unsubscribedAt: new Date() },
    });
  }
  return { ok: true as const, status: 200 };
}

// Un GET nunca da de baja a nadie (los antivirus y Gmail abren los enlaces sin que la persona lo pida):
// solo lleva a la página de confirmación.
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") || "";
  return NextResponse.redirect(new URL(`/baja?token=${encodeURIComponent(token)}`, req.url));
}

// La baja se hace con POST: desde el botón de la página /baja o desde el botón
// "Cancelar suscripción" de Gmail/Outlook (baja de un solo clic).
export async function POST(req: Request) {
  try {
    let token = new URL(req.url).searchParams.get("token") || "";
    if (!token) {
      try {
        const body = await req.json();
        if (typeof body?.token === "string") token = body.token;
      } catch {
        // sin cuerpo JSON
      }
    }
    const result = await unsubscribe(token);
    if (!result.ok) {
      return NextResponse.json({ error: "Enlace de baja no válido." }, { status: result.status });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error en /api/newsletter/unsubscribe:", error);
    return NextResponse.json({ error: "No pudimos procesar la baja." }, { status: 500 });
  }
}
