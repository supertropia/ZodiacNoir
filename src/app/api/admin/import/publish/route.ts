import { NextResponse } from "next/server";
import { prisma, safeQuery } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";
import { DRAFT_SLUG_PREFIX, DRAFT_TITLE_PLACEHOLDER } from "@/lib/draft";
import { getPublicationStatus, parsePublishDate, resolvePublishedAt } from "@/lib/publication";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Aprueba borradores que creó el importador: los publica ahora o los programa para una fecha (solo artículos).
// Un producto aprobado se publica de inmediato.

type Item = { kind?: unknown; id?: unknown; publishAt?: unknown };

type Result =
  | { id: string; ok: true; status: "published" | "scheduled"; publishedAt: string | null; warning?: string }
  | { id: string; ok: false; error: string };

const MAX_ITEMS = 100;

export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  const body = (await req.json().catch(() => null)) as { items?: Item[] } | null;
  const items = Array.isArray(body?.items) ? body!.items!.slice(0, MAX_ITEMS) : [];
  if (items.length === 0) return NextResponse.json({ error: "No hay nada para publicar." }, { status: 400 });

  const results: Result[] = [];

  for (const item of items) {
    const id = typeof item.id === "string" ? item.id : "";
    if (!id) {
      results.push({ id: "", ok: false, error: "Falta el identificador." });
      continue;
    }
    try {
      if (item.kind === "articulo") {
        const article = await safeQuery(() => prisma.article.findUnique({ where: { id } }));
        if (!article) {
          results.push({ id, ok: false, error: "No se encontró el artículo." });
          continue;
        }
        if (article.published) {
          results.push({ id, ok: false, error: "Ya estaba publicado o programado." });
          continue;
        }
        const missing: string[] = [];
        if (!article.title.trim() || article.title === DRAFT_TITLE_PLACEHOLDER) missing.push("el título");
        if (article.slug.startsWith(DRAFT_SLUG_PREFIX)) missing.push("la dirección (slug)");
        if (!article.excerpt.trim()) missing.push("el copete");
        if (!article.content.trim()) missing.push("el texto");
        if (!article.category.trim()) missing.push("la categoría");
        if (missing.length > 0) {
          results.push({ id, ok: false, error: `Falta ${missing.join(", ")}. Complétalo en el borrador y vuelve a intentar.` });
          continue;
        }
        const { date, error } = parsePublishDate(item.publishAt);
        if (error) {
          results.push({ id, ok: false, error });
          continue;
        }
        const updated = await safeQuery(() =>
          prisma.article.update({
            where: { id },
            data: { published: true, publishedAt: resolvePublishedAt({ published: true, requested: date }) },
          })
        );
        const status = getPublicationStatus(updated) === "scheduled" ? "scheduled" : "published";
        results.push({ id, ok: true, status, publishedAt: updated.publishedAt ? updated.publishedAt.toISOString() : null });
        continue;
      }

      if (item.kind === "producto") {
        const product = await safeQuery(() => prisma.product.findUnique({ where: { id } }));
        if (!product) {
          results.push({ id, ok: false, error: "No se encontró el producto." });
          continue;
        }
        if (product.published) {
          results.push({ id, ok: false, error: "Ya estaba publicado." });
          continue;
        }
        const missing: string[] = [];
        if (!product.title.trim()) missing.push("el título");
        if (!product.description.trim()) missing.push("la descripción");
        if (!product.priceLabel.trim()) missing.push("el precio");
        if (!product.categoryId) missing.push("la categoría");
        if (missing.length > 0) {
          results.push({ id, ok: false, error: `Falta ${missing.join(", ")}. Complétalo en el borrador y vuelve a intentar.` });
          continue;
        }
        await safeQuery(() => prisma.product.update({ where: { id }, data: { published: true } }));
        results.push({
          id,
          ok: true,
          status: "published",
          publishedAt: null,
          warning: product.fileUrl ? undefined : "Se publicó sin PDF: nadie podrá descargarlo todavía.",
        });
        continue;
      }

      results.push({ id, ok: false, error: "Tipo desconocido." });
    } catch (error) {
      console.error("Error publicando desde el importador:", error);
      results.push({ id, ok: false, error: "No se pudo publicar. Inténtalo de nuevo." });
    }
  }

  return NextResponse.json({ results });
}
