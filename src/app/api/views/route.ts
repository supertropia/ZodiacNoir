import { NextResponse } from "next/server";
import { prisma, safeQuery } from "@/lib/prisma";
import { isArticleLive } from "@/lib/publication";
import { requireAdminSession } from "@/lib/require-admin";
import { isLikelyBot, recordView } from "@/lib/views";

export const dynamic = "force-dynamic";

/**
 * Registra una vista de un artículo. La llama el navegador de la lectora cuando se abre un
 * artículo (componente ViewTracker). No cuenta:
 * - tus propias visitas como administradora,
 * - robots y servicios automáticos,
 * - artículos que no existen o todavía no están publicados.
 * Nunca devuelve un error a la visitante: si algo falla, simplemente no se cuenta.
 */
export async function POST(req: Request) {
  try {
    if (isLikelyBot(req.headers.get("user-agent"))) {
      return NextResponse.json({ counted: false });
    }

    const body = (await req.json().catch(() => null)) as { slug?: unknown } | null;
    const slug = typeof body?.slug === "string" ? body.slug.slice(0, 200) : "";
    if (!slug) return NextResponse.json({ counted: false });

    if (await requireAdminSession()) {
      return NextResponse.json({ counted: false });
    }

    const article = await safeQuery(() =>
      prisma.article.findUnique({
        where: { slug },
        select: { id: true, published: true, publishedAt: true },
      })
    );
    if (!article || !isArticleLive(article)) {
      return NextResponse.json({ counted: false });
    }

    await recordView(article.id);
    return NextResponse.json({ counted: true });
  } catch (error) {
    console.error("Error registrando vista:", error);
    return NextResponse.json({ counted: false });
  }
}
