import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/require-admin";
import { saveHomeAnnouncementContent, setHomeAnnouncementEnabled } from "@/lib/announcements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Guarda los textos, la imagen, el video y el enlace de la novedad de la portada. Solo la administración puede hacerlo.
export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  try {
    const body = await req.json().catch(() => null);
    const result = await saveHomeAnnouncementContent(body);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error guardando la novedad de la portada:", error);
    return NextResponse.json({ error: "No se pudo guardar la novedad." }, { status: 500 });
  }
}

// Muestra u oculta la novedad en la portada, sin tocar sus textos.
export async function PATCH(req: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.enabled !== "boolean") {
      return NextResponse.json({ error: "Falta indicar si la novedad debe estar visible." }, { status: 400 });
    }
    const result = await setHomeAnnouncementEnabled(body.enabled);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true, enabled: body.enabled });
  } catch (error) {
    console.error("Error cambiando la visibilidad de la novedad:", error);
    return NextResponse.json({ error: "No se pudo guardar el cambio." }, { status: 500 });
  }
}
