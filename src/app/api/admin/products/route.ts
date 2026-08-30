import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    const body = await req.json();
    const {
      slug, title, description, priceLabel, lemonVariantId,
      priceArs, amazonKindleUrl, amazonKindlePrice, amazonPaperbackUrl, amazonPaperbackPrice,
      coverImage, coverImagePosition,
      heroImage, heroImagePosition,
      galleryImages, contentHighlights, testimonials, audienceText,
      fileUrl, published,
    } = body;

    if (!slug || !title || !description || !priceLabel) {
      return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Ya existe un producto con ese slug." }, { status: 409 });
    }

    const product = await prisma.product.create({
      data: {
        slug, title, description, priceLabel,
        lemonVariantId: lemonVariantId || null,
        priceArs: Number.isFinite(priceArs) ? priceArs : null,
        amazonKindleUrl: amazonKindleUrl || null,
        amazonKindlePrice: amazonKindlePrice || null,
        amazonPaperbackUrl: amazonPaperbackUrl || null,
        amazonPaperbackPrice: amazonPaperbackPrice || null,
        coverImage: coverImage || null,
        coverImagePosition: Number.isFinite(coverImagePosition) ? coverImagePosition : 50,
        heroImage: heroImage || null,
        heroImagePosition: Number.isFinite(heroImagePosition) ? heroImagePosition : 50,
        galleryImages: Array.isArray(galleryImages) ? galleryImages : [],
        contentHighlights: Array.isArray(contentHighlights) ? contentHighlights : [],
        testimonials: Array.isArray(testimonials) ? testimonials : [],
        audienceText: audienceText || null,
        fileUrl: fileUrl || null,
        published: Boolean(published),
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Error creando producto:", error);
    return NextResponse.json({ error: "No se pudo crear el producto." }, { status: 500 });
  }
}
