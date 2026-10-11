import { NextResponse } from "next/server";
import { prisma, safeQuery } from "@/lib/prisma";
import { livePublicationFilter } from "@/lib/publication";

export const dynamic = "force-dynamic";

/**
 * Datos para el buscador del encabezado. Es pública a propósito: la ve cualquier
 * visitante, así que devuelve SOLO artículos ya visibles (ni borradores ni
 * programados) y SOLO los campos necesarios para buscar. Nunca el contenido.
 */
export async function GET() {
  const articles = await safeQuery(() =>
    prisma.article.findMany({
      where: livePublicationFilter(),
      orderBy: { publishedAt: "desc" },
      take: 500,
      select: { slug: true, title: true, excerpt: true, category: true, sign: true },
    })
  );

  return NextResponse.json(
    { articles },
    // Se guarda 60 segundos en la red de Vercel: alivia la base de datos (el buscador
    // se consulta en cada página) y un artículo recién publicado aparece en menos de 2 min.
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
