import { NextResponse } from "next/server";
import { isLikelyBot } from "@/lib/views";
import { requireAdminSession } from "@/lib/require-admin";
import { isNovedadEvent, recordNovedadEvent } from "@/lib/novedad-clicks";

export const dynamic = "force-dynamic";

/**
 * Cuenta un evento de la novedad de la portada: { event: "vista" | "amazon" | "ver" }.
 * La llama el navegador de la visitante. No cuenta tus propias visitas como administradora ni a los robots,
 * y nunca devuelve un error: si algo falla, simplemente no se cuenta (el botón funciona igual).
 */
export async function POST(req: Request) {
  try {
    if (isLikelyBot(req.headers.get("user-agent"))) return NextResponse.json({ counted: false });

    const body = (await req.json().catch(() => null)) as { event?: unknown } | null;
    if (!isNovedadEvent(body?.event)) return NextResponse.json({ counted: false });

    if (await requireAdminSession()) return NextResponse.json({ counted: false });

    await recordNovedadEvent(body.event);
    return NextResponse.json({ counted: true });
  } catch (error) {
    console.error("Error contando la novedad:", error);
    return NextResponse.json({ counted: false });
  }
}
