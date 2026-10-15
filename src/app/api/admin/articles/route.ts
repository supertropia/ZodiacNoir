import { NextResponse } from "next/server";
import { prisma, safeQuery } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";
import { estimateReadingMinutes } from "@/lib/slugify";
import { sanitizeArticleHtml, htmlToPlainText } from "@/lib/sanitize-html";
import { parsePublishDate, resolvePublishedAt } from "@/lib/publication";
import { normalizeSeoFields } from "@/lib/seo";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const articles = await prisma.article.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ articles });
}

export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    const body = await req.json();
    const {
      slug, title, excerpt, content, coverImage, coverImagePosX, coverImagePosY,
      category, sign, published, publishedAt, featuredProductId, isPremium,
    } = body;

    if (!slug || !title || !excerpt || !content || !category) {
      return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
    }

    const { date: requestedDate, error: dateError } = parsePublishDate(publishedAt);
    if (dateError) {
      return NextResponse.json({ error: dateError }, { status: 400 });
    }

    const seo = normalizeSeoFields(body);
    if (!seo.ok) {
      return NextResponse.json({ error: seo.error }, { status: 400 });
    }

    const existing = await safeQuery(() => prisma.article.findUnique({ where: { slug } }));
    if (existing) {
      return NextResponse.json({ error: "Ya existe un artículo con ese slug." }, { status: 409 });
    }

    const cleanContent = sanitizeArticleHtml(content);

    // Si el motor de Prisma falla al azar (error intermitente conocido), se reintenta solo.
    const article = await safeQuery(() => prisma.article.create({
      data: {
        slug,
        title,
        excerpt,
        content: cleanContent,
        coverImage: coverImage || null,
        coverImagePosX: Number.isFinite(coverImagePosX) ? coverImagePosX : 50,
        coverImagePosY: Number.isFinite(coverImagePosY) ? coverImagePosY : 50,
        category,
        sign: sign || null,
        authorName: "Zodiac Noir",
        authorRole: "Equipo editorial",
        readingTimeMin: estimateReadingMinutes(htmlToPlainText(cleanContent)),
        published: Boolean(published),
        publishedAt: resolvePublishedAt({ published: Boolean(published), requested: requestedDate }),
        featuredProductId: featuredProductId || null,
        isPremium: Boolean(isPremium),
        ...seo.data,
      },
    }), 1);

    // Comprobación final: se vuelve a leer el artículo desde la base de datos antes de decir "guardado".
    const verified = await safeQuery(() =>
      prisma.article.findUnique({ where: { id: article.id }, select: { id: true } })
    );
    if (!verified) {
      console.error("El artículo se creó pero no se pudo leer de vuelta:", article.id);
      return NextResponse.json(
        { error: "El servidor no pudo confirmar que el artículo quedara guardado." },
        { status: 500 }
      );
    }

    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    console.error("Error creando artículo:", error);
    // P2002 = el slug ya existe. Con el reintento automático puede pasar si el primer intento sí llegó a guardarse.
    if ((error as { code?: string })?.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe un artículo con ese slug (puede que el guardado anterior sí se haya completado: revisa la lista del panel)." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "No se pudo crear el artículo." }, { status: 500 });
  }
}
