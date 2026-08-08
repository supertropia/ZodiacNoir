import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const events = await prisma.cosmicEvent.findMany({ orderBy: { eventDate: "asc" } });
  return NextResponse.json({ events });
}

export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    const body = await req.json();
    const { title, subtitle, description, eventDate, articleSlug, guideUrl, active } = body;

    if (!title || !eventDate) {
      return NextResponse.json({ error: "Título y fecha son obligatorios." }, { status: 400 });
    }

    const event = await prisma.cosmicEvent.create({
      data: {
        title,
        subtitle: subtitle || null,
        description: description || null,
        eventDate: new Date(eventDate),
        articleSlug: articleSlug || null,
        guideUrl: guideUrl || null,
        active: active === undefined ? true : Boolean(active),
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Error creando evento:", error);
    return NextResponse.json({ error: "No se pudo crear el evento." }, { status: 500 });
  }
}
