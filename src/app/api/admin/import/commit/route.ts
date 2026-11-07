import { NextResponse } from "next/server";
import { prisma, safeQuery } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";
import { CATEGORIES } from "@/lib/categories";
import { signs } from "@/data/signs";
import { estimateReadingMinutes, slugify } from "@/lib/slugify";
import { htmlToPlainText, sanitizeArticleHtml } from "@/lib/sanitize-html";
import { normalizeSeoFields } from "@/lib/seo";
import { DRAFT_DEFAULT_CATEGORY } from "@/lib/draft";
import { formatUsdAmount, parseUsdInput } from "@/lib/pricing";
import { parseOptionalUrl } from "@/lib/media";
import { resolveProductOrganization } from "@/lib/product-organization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Crea UN borrador (artículo o producto) a partir de lo que leyó el importador. Nunca publica: todo queda oculto
// hasta que se apruebe desde /admin/importar o desde la lista de artículos o productos.

const str = (value: unknown) => (typeof value === "string" ? value : "");

function fail(status: number, error: string, code: "invalid" | "duplicate" | "error" = "invalid") {
  return NextResponse.json({ ok: false, status: code, error }, { status });
}

/** Revisa que los enlaces internos del artículo apunten a algo que existe, para no publicar enlaces rotos. */
async function checkInternalLinks(links: unknown): Promise<string[]> {
  const warnings: string[] = [];
  const list = Array.isArray(links) ? links.filter((l): l is string => typeof l === "string").slice(0, 40) : [];
  for (const link of Array.from(new Set(list))) {
    const path = link.split(/[?#]/)[0];
    const blog = path.match(/^\/blog\/([^/]+)\/?$/);
    const shop = path.match(/^\/tienda\/([^/]+)\/?$/);
    if (blog) {
      const a = await safeQuery(() => prisma.article.findUnique({ where: { slug: blog[1] }, select: { published: true } }));
      if (!a) warnings.push(`El enlace ${path} apunta a un artículo que no existe todavía.`);
      else if (!a.published) warnings.push(`El enlace ${path} apunta a un artículo que sigue en borrador.`);
    } else if (shop) {
      const p = await safeQuery(() => prisma.product.findUnique({ where: { slug: shop[1] }, select: { published: true } }));
      if (!p) warnings.push(`El enlace ${path} apunta a un producto que no existe todavía.`);
      else if (!p.published) warnings.push(`El enlace ${path} apunta a un producto que sigue en borrador.`);
    }
  }
  return warnings;
}

export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session) return fail(403, "No autorizado.", "error");

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return fail(400, "Solicitud inválida.");

  try {
    const kind = body.kind === "producto" ? "producto" : body.kind === "articulo" ? "articulo" : null;
    if (!kind) return fail(400, "Falta el tipo (artículo o producto).");

    const title = str(body.title).trim();
    if (!title) return fail(400, "Falta el título.");
    const slug = slugify(str(body.slug).trim() || title);
    if (!slug) return fail(400, "Falta la dirección (slug).");

    const seo = normalizeSeoFields(body);
    if (!seo.ok) return fail(400, seo.error);

    const cover = parseOptionalUrl(body.coverImage);
    if (!cover.ok) return fail(400, "La dirección de la portada no es válida.");

    const warnings: string[] = [];

    // ------------------------------------------------------------------ Artículo
    if (kind === "articulo") {
      const existing = await safeQuery(() => prisma.article.findUnique({ where: { slug }, select: { id: true } }));
      if (existing) return fail(409, "Ya existe un artículo con esa dirección.", "duplicate");

      const content = sanitizeArticleHtml(str(body.content));
      if (!htmlToPlainText(content) && !/<img\b/i.test(content)) return fail(400, "El artículo no tiene texto.");

      const requestedCategory = str(body.category);
      let category = DRAFT_DEFAULT_CATEGORY;
      if (CATEGORIES.some((c) => c.value === requestedCategory)) category = requestedCategory;
      else warnings.push("No tenía una categoría válida: quedó en «Efemérides». Cámbiala antes de publicar.");

      const sign = signs.some((s) => s.slug === str(body.sign)) ? str(body.sign) : null;

      let featuredProductId: string | null = null;
      const featuredSlug = str(body.featuredProductSlug).trim();
      if (featuredSlug) {
        const product = await safeQuery(() => prisma.product.findUnique({ where: { slug: featuredSlug }, select: { id: true } }));
        if (product) featuredProductId = product.id;
        else warnings.push(`No encontré el producto destacado «${featuredSlug}».`);
      }

      warnings.push(...(await checkInternalLinks(body.internalLinks)));

      const article = await safeQuery(
        () =>
          prisma.article.create({
            data: {
              slug,
              title,
              excerpt: str(body.excerpt).trim(),
              content,
              coverImage: cover.url,
              category,
              sign,
              authorName: "Zodiac Noir",
              authorRole: "Equipo editorial",
              readingTimeMin: estimateReadingMinutes(htmlToPlainText(content)),
              published: false,
              publishedAt: null,
              featuredProductId,
              isPremium: body.isPremium === true,
              ...seo.data,
            },
            select: { id: true },
          }),
        1
      );
      return NextResponse.json({ ok: true, kind, id: article.id, slug, warnings }, { status: 201 });
    }

    // ------------------------------------------------------------------ Producto
    const existing = await safeQuery(() => prisma.product.findUnique({ where: { slug }, select: { id: true } }));
    if (existing) return fail(409, "Ya existe un producto con esa dirección.", "duplicate");

    const description = str(body.description).trim();
    if (!description) return fail(400, "Falta la descripción del producto.");
    const usd = parseUsdInput(body.priceUsd);
    if (!usd) return fail(400, "Falta el precio en dólares.");

    const org = await resolveProductOrganization({ categoryId: str(body.categoryId) });
    if (!org.ok) return fail(org.status, org.error);

    const hero = parseOptionalUrl(body.heroImage);
    const pdf = parseOptionalUrl(body.fileUrl);
    const video = parseOptionalUrl(body.videoUrl);
    if (!hero.ok || !pdf.ok || !video.ok) return fail(400, "Alguna dirección de archivo no es válida.");

    const gallery = (Array.isArray(body.galleryImages) ? body.galleryImages : [])
      .map((u) => parseOptionalUrl(u))
      .flatMap((r) => (r.ok && r.url ? [r.url] : []));

    const highlights = (Array.isArray(body.highlights) ? body.highlights : [])
      .map((h) => ({
        title: str((h as Record<string, unknown>)?.title).trim(),
        description: str((h as Record<string, unknown>)?.description).trim(),
      }))
      .filter((h) => h.title);

    if (!pdf.url) warnings.push("No tiene PDF cargado: nadie podrá descargarlo hasta que lo agregues.");

    const product = await safeQuery(
      () =>
        prisma.product.create({
          data: {
            slug,
            title,
            description,
            priceLabel: formatUsdAmount(usd),
            priceUsd: usd,
            categoryId: org.data.categoryId,
            isCollection: false,
            parentId: null,
            variantLabel: null,
            kind: org.data.kind,
            coverImage: cover.url,
            heroImage: hero.url,
            galleryImages: gallery,
            contentHighlights: highlights,
            audienceText: str(body.audienceText).trim() || null,
            fileUrl: pdf.url,
            videoUrl: video.url,
            published: false,
            ...seo.data,
          },
          select: { id: true },
        }),
      1
    );
    return NextResponse.json({ ok: true, kind, id: product.id, slug, warnings }, { status: 201 });
  } catch (error) {
    console.error("Error creando borrador desde el importador:", error);
    // P2002 = la dirección ya existe (por ejemplo, si el reintento automático encontró el borrador ya guardado).
    if ((error as { code?: string })?.code === "P2002") {
      return fail(409, "Ya existe algo con esa dirección. Revisa la lista del panel.", "duplicate");
    }
    return fail(500, "No se pudo crear el borrador.", "error");
  }
}
