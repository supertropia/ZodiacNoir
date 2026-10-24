import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/require-admin";
import { setReadingsEnabled } from "@/lib/site-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Muestra u oculta las lecturas personalizadas para el público. Solo la administración puede hacerlo.
export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.enabled !== "boolean") {
      return NextResponse.json({ error: "Falta indicar si las lecturas deben estar visibles." }, { status: 400 });
    }
    await setReadingsEnabled(body.enabled);
    return NextResponse.json({ ok: true, enabled: body.enabled });
  } catch (error) {
    console.error("Error cambiando la visibilidad de las lecturas:", error);
    return NextResponse.json({ error: "No se pudo guardar el cambio." }, { status: 500 });
  }
}
