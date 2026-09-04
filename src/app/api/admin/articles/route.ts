import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";
import { estimateReadingMinutes } from "@/lib/slugify";
import { sanitizeArticleHtml, htmlToPlainText } from "@/lib/sanitize-html";

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
    const { slug, title, excerpt, content, coverImage, category, sign, published } = body;

    if (!slug || !title || !excerpt || !content || !category) {
      return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
    }

    const existing = await prisma.article.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Ya existe un artículo con ese slug." }, { status: 409 });
    }

    const cleanContent = sanitizeArticleHtml(content);

    const article = await prisma.article.create({
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
        publishedAt: published ? new Date() : null,
      },
    });

    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    console.error("Error creando artículo:", error);
    return NextResponse.json({ error: "No se pudo crear el artículo." }, { status: 500 });
  }
}
