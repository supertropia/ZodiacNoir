import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";
import { normalizeSeoFields } from "@/lib/seo";
import { formatUsdAmount, parseUsdInput } from "@/lib/pricing";
import { parseOptionalUrl } from "@/lib/media";
import { slugify } from "@/lib/slugify";
import { resolveProductOrganization } from "@/lib/product-organization";
import { sanitizeArticleHtml } from "@/lib/sanitize-html";
import { looksLikeHtml } from "@/lib/html-text";
import { isDescriptionEmpty } from "@/lib/product-description";

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
      priceArs, priceUsd, amazonKindleUrl, amazonKindlePrice, amazonPaperbackUrl, amazonPaperbackPrice,
      coverImage, coverImagePosition,
      heroImage, heroImagePosition,
      galleryImages, contentHighlights, testimonials, audienceText,
      salesCount, fileUrl, videoUrl, published,
    } = body;

    const current = await prisma.product.findUnique({ where: { id: params.id } });
    if (!current) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    // Tipo de producto (único, colección o diseño) y categoría.
    const org = await resolveProductOrganization(body, params.id);
    if (!org.ok) return NextResponse.json({ error: org.error }, { status: org.status });
    const isDesign = Boolean(org.data.parentId);
    const isCollection = org.data.isCollection;

    const usd = parseUsdInput(priceUsd);
    // Si no se escribió un texto de precio, se arma solo con el precio en USD.
    const label =
      (typeof priceLabel === "string" ? priceLabel.trim() : "") ||
      (usd ? formatUsdAmount(usd) : "") ||
      (isDesign ? "Ver en Amazon" : "");

    const finalTitle =
      (typeof title === "string" ? title.trim() : "") || (isDesign ? `${org.parent!.title} · ${org.data.variantLabel}` : "");
    const finalSlug = (typeof slug === "string" ? slug.trim() : "") || slugify(finalTitle);
    // La descripción puede venir del editor visual (HTML): se limpia antes de guardarla. Un editor vacío cuenta como sin texto.
    const rawDescription = typeof description === "string" ? description : "";
    const finalDescription = looksLikeHtml(rawDescription)
      ? isDescriptionEmpty(rawDescription)
        ? ""
        : sanitizeArticleHtml(rawDescription)
      : rawDescription;

    if (!finalSlug || !finalTitle) {
      return NextResponse.json({ error: "Faltan campos obligatorios (revisa el título y el slug)." }, { status: 400 });
    }
    // La descripción y el precio los define la colección: sus diseños heredan la descripción, y la colección en sí no se compra.
    if (!isDesign && !finalDescription.trim()) {
      return NextResponse.json({ error: "Escribe la descripción del producto." }, { status: 400 });
    }
    if (!isDesign && !isCollection && !label) {
      return NextResponse.json({ error: "Falta el precio (en dólares o como texto)." }, { status: 400 });
    }
    if (isDesign && !usd && !amazonKindleUrl && !amazonPaperbackUrl) {
      return NextResponse.json({ error: "Cada diseño necesita un precio en dólares (o un enlace de Amazon)." }, { status: 400 });
    }

    const seo = normalizeSeoFields(body);
    if (!seo.ok) {
      return NextResponse.json({ error: seo.error }, { status: 400 });
    }

    const video = parseOptionalUrl(videoUrl);
    if (!video.ok) {
      return NextResponse.json({ error: "La dirección del video no es válida." }, { status: 400 });
    }

    if (finalSlug !== current.slug) {
      const clashing = await prisma.product.findUnique({ where: { slug: finalSlug } });
      if (clashing) return NextResponse.json({ error: "Ya existe otro producto con ese slug." }, { status: 409 });
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        slug: finalSlug, title: finalTitle, description: finalDescription, priceLabel: label,
        lemonVariantId: lemonVariantId || null,
        priceArs: Number.isFinite(priceArs) ? priceArs : null,
        priceUsd: isCollection ? null : usd,
        categoryId: org.data.categoryId,
        isCollection,
        parentId: org.data.parentId,
        variantLabel: org.data.variantLabel,
        kind: org.data.kind,
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
        fileUrl: isCollection ? null : fileUrl || null,
        ...(videoUrl === undefined ? {} : { videoUrl: video.url }),
        ...seo.data,
        published: Boolean(published),
      },
    });

    // Los diseños siempre viven en la categoría de su colección: si se la cambia, se mueven todos juntos.
    if (isCollection) {
      await prisma.product.updateMany({
        where: { parentId: params.id },
        data: { categoryId: org.data.categoryId, kind: org.data.kind },
      });
    }

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
    // Una colección con diseños no se borra de un golpe: primero se borran sus diseños, así no se pierde nada por error.
    const designs = await prisma.product.count({ where: { parentId: params.id } });
    if (designs > 0) {
      return NextResponse.json(
        { error: `Esta colección tiene ${designs} ${designs === 1 ? "diseño" : "diseños"}. Bórralos primero (o usa «Despublicar» si solo quieres ocultarla).` },
        { status: 409 }
      );
    }

    await prisma.product.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error eliminando producto:", error);
    return NextResponse.json({ error: "No se pudo eliminar el producto." }, { status: 500 });
  }
}
