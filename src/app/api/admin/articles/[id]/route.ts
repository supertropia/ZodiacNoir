
import { NextResponse } from "next/server";
import { prisma, safeQuery } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";
import { estimateReadingMinutes } from "@/lib/slugify";
import { sanitizeArticleHtml, htmlToPlainText } from "@/lib/sanitize-html";
import { parsePublishDate, resolvePublishedAt } from "@/lib/publication";
import { normalizeSeoFields } from "@/lib/seo";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const article = await prisma.article.findUnique({ where: { id: params.id } });
  if (!article) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ article });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
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

    const current = await safeQuery(() => prisma.article.findUnique({ where: { id: params.id } }));
    if (!current) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    if (slug !== current.slug) {
      const clashing = await safeQuery(() => prisma.article.findUnique({ where: { slug } }));
      if (clashing) return NextResponse.json({ error: "Ya existe otro artículo con ese slug." }, { status: 409 });
    }

    const cleanContent = sanitizeArticleHtml(content);

    // Si el motor de Prisma falla al azar (error intermitente conocido), se reintenta solo.
    const article = await safeQuery(() => prisma.article.update({
      where: { id: params.id },
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
        publishedAt: resolvePublishedAt({
          published: Boolean(published),
          requested: requestedDate,
          current: current.publishedAt,
        }),
        featuredProductId: featuredProductId || null,
        isPremium: Boolean(isPremium),
        ...seo.data,
      },
    }));

    // Comprobación final: se vuelve a leer el artículo desde la base de datos antes de decir "guardado".
    const verified = await safeQuery(() =>
      prisma.article.findUnique({ where: { id: params.id }, select: { id: true } })
    );
    if (!verified) {
      console.error("El artículo se actualizó pero no se pudo leer de vuelta:", params.id);
      return NextResponse.json(
        { error: "El servidor no pudo confirmar que los cambios quedaran guardados." },
        { status: 500 }
      );
    }

    return NextResponse.json({ article });
  } catch (error) {
    console.error("Error actualizando artículo:", error);
    return NextResponse.json({ error: "No se pudo actualizar el artículo." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    await prisma.article.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error eliminando artículo:", error);
    return NextResponse.json({ error: "No se pudo eliminar el artículo." }, { status: 500 });
  }
}
