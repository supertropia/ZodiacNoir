import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    const body = await req.json();
    const { title, subtitle, description, eventDate, articleSlug, guideUrl, active } = body;

    if (!title || !eventDate) {
      return NextResponse.json({ error: "Título y fecha son obligatorios." }, { status: 400 });
    }

    const event = await prisma.cosmicEvent.update({
      where: { id: params.id },
      data: {
        title,
        subtitle: subtitle || null,
        description: description || null,
        eventDate: new Date(eventDate),
        articleSlug: articleSlug || null,
        guideUrl: guideUrl || null,
        active: Boolean(active),
      },
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Error actualizando evento:", error);
    return NextResponse.json({ error: "No se pudo actualizar el evento." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    await prisma.cosmicEvent.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error eliminando evento:", error);
    return NextResponse.json({ error: "No se pudo eliminar el evento." }, { status: 500 });
  }
}
