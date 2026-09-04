import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";
import { estimateReadingMinutes } from "@/lib/slugify";
import { sanitizeArticleHtml, htmlToPlainText } from "@/lib/sanitize-html";

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
    const { slug, title, excerpt, content, coverImage, category, sign, published } = body;

    if (!slug || !title || !excerpt || !content || !category) {
      return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
    }

    const current = await prisma.article.findUnique({ where: { id: params.id } });
    if (!current) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    if (slug !== current.slug) {
      const clashing = await prisma.article.findUnique({ where: { slug } });
      if (clashing) return NextResponse.json({ error: "Ya existe otro artículo con ese slug." }, { status: 409 });
    }

    const cleanContent = sanitizeArticleHtml(content);

    const article = await prisma.article.update({
      where: { id: params.id },
      data: {
        slug,
        title,
        excerpt,
        content: cleanContent,
        coverImage: coverImage || null,
        category,
        sign: sign || null,
        authorName: "Zodiac Noir",
        authorRole: "Equipo editorial",
        readingTimeMin: estimateReadingMinutes(htmlToPlainText(cleanContent)),
        published: Boolean(published),
        publishedAt: published ? current.publishedAt ?? new Date() : null,
      },
    });

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
