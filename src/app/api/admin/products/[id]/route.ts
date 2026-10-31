import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";
import { normalizeSeoFields } from "@/lib/seo";
import { formatUsdAmount, parseUsdInput } from "@/lib/pricing";
import { parseOptionalUrl } from "@/lib/media";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    const body = await req.json();
    const {
      slug, title, description, priceLabel, lemonVariantId,
      priceArs, priceUsd, kind, amazonKindleUrl, amazonKindlePrice, amazonPaperbackUrl, amazonPaperbackPrice,
      coverImage, coverImagePosition,
      heroImage, heroImagePosition,
      galleryImages, contentHighlights, testimonials, audienceText,
      salesCount, fileUrl, videoUrl, published,
    } = body;

    const usd = parseUsdInput(priceUsd);
    // Si no se escribió un texto de precio, se arma solo con el precio en USD.
    const label = (typeof priceLabel === "string" ? priceLabel.trim() : "") || (usd ? formatUsdAmount(usd) : "");
    if (!slug || !title || !description || !label) {
      return NextResponse.json({ error: "Faltan campos obligatorios (revisa el título, el slug, la descripción y el precio)." }, { status: 400 });
    }

    const seo = normalizeSeoFields(body);
    if (!seo.ok) {
      return NextResponse.json({ error: seo.error }, { status: 400 });
    }

    const video = parseOptionalUrl(videoUrl);
    if (!video.ok) {
      return NextResponse.json({ error: "La dirección del video no es válida." }, { status: 400 });
    }

    const current = await prisma.product.findUnique({ where: { id: params.id } });
    if (!current) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    if (slug !== current.slug) {
      const clashing = await prisma.product.findUnique({ where: { slug } });
      if (clashing) return NextResponse.json({ error: "Ya existe otro producto con ese slug." }, { status: 409 });
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        slug, title, description, priceLabel: label,
        lemonVariantId: lemonVariantId || null,
        priceArs: Number.isFinite(priceArs) ? priceArs : null,
        priceUsd: usd,
        kind: kind === "pdf" ? "pdf" : "book",
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
        salesCount: Number.isFinite(salesCount) ? salesCount : null,
        fileUrl: fileUrl || null,
        ...(videoUrl === undefined ? {} : { videoUrl: video.url }),
        ...seo.data,
        published: Boolean(published),
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Error actualizando producto:", error);
    return NextResponse.json({ error: "No se pudo actualizar el producto." }, { status: 500 });
  }
}

// Cambia solo el estado publicado/borrador, sin tocar el resto de los campos del producto.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    const body = await req.json();
    if (typeof body.published !== "boolean") {
      return NextResponse.json({ error: "Valor de publicación inválido." }, { status: 400 });
    }

    const current = await prisma.product.findUnique({ where: { id: params.id } });
    if (!current) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const product = await prisma.product.update({
      where: { id: params.id },
      data: { published: body.published },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Error cambiando estado de publicación:", error);
    return NextResponse.json({ error: "No se pudo cambiar el estado del producto." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    await prisma.product.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error eliminando producto:", error);
    return NextResponse.json({ error: "No se pudo eliminar el producto." }, { status: 500 });
  }
}
