import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/require-admin";
import { setPaypalEnabled } from "@/lib/site-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Muestra u oculta los botones de PayPal para el público. Solo la administración puede hacerlo.
export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.enabled !== "boolean") {
      return NextResponse.json({ error: "Falta indicar si PayPal debe estar visible." }, { status: 400 });
    }
    await setPaypalEnabled(body.enabled);
    return NextResponse.json({ ok: true, enabled: body.enabled });
  } catch (error) {
    console.error("Error cambiando la visibilidad de PayPal:", error);
    return NextResponse.json({ error: "No se pudo guardar el cambio." }, { status: 500 });
  }
}
