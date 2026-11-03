import type { MetadataRoute } from "next";
import { prisma, safeQuery } from "@/lib/prisma";
import { livePublicationFilter } from "@/lib/publication";
import { signs } from "@/data/signs";
import { getReadingsEnabled } from "@/lib/site-settings";
import { buildCategoryTree, categoryHref, loadCategoryRows, withProductCounts, dropEmptyCategories, type CategoryNode } from "@/lib/store-categories";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXTAUTH_URL || "https://zodiacnoirweb.com";
  const readingsEnabled = await getReadingsEnabled();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    ...(readingsEnabled ? [{ url: `${siteUrl}/lecturas`, changeFrequency: "weekly" as const, priority: 0.9 }] : []),
    { url: `${siteUrl}/blog`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/signos`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/efemerides`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/tienda`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/membresia`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/sobre-nosotros`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/contacto`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/privacidad`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${siteUrl}/terminos`, changeFrequency: "yearly", priority: 0.1 },
  ];

  const signPages: MetadataRoute.Sitemap = signs.map((sign) => ({
    url: `${siteUrl}/signos/${sign.slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const articles = await prisma.article.findMany({
    where: livePublicationFilter(),
    select: { slug: true, updatedAt: true },
    orderBy: { publishedAt: "desc" },
  });

  const articlePages: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${siteUrl}/blog/${article.slug}`,
    lastModified: article.updatedAt,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  // Una página propia por cada producto publicado de la tienda. Los diseños no tienen página aparte (viven dentro de
  // su colección), y una colección sin diseños publicados no se lista.
  const products = await safeQuery(() =>
    prisma.product.findMany({
      where: { published: true },
      select: { id: true, slug: true, parentId: true, isCollection: true, categoryId: true },
      orderBy: { createdAt: "desc" },
    })
  );
  const parentsWithDesigns = new Set(products.map((p) => p.parentId).filter((id): id is string => Boolean(id)));
  const topLevel = products.filter((p) => !p.parentId && (!p.isCollection || parentsWithDesigns.has(p.id)));

  const productPages: MetadataRoute.Sitemap = topLevel.map((product) => ({
    url: `${siteUrl}/tienda/${product.slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  // Páginas de categoría: solo las visibles que tienen productos.
  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const rows = await loadCategoryRows();
    const counts = new Map<string, number>();
    for (const p of topLevel) if (p.categoryId) counts.set(p.categoryId, (counts.get(p.categoryId) ?? 0) + 1);
    const tree = dropEmptyCategories(withProductCounts(buildCategoryTree(rows, { onlyVisible: true }), counts));
    const flat = (nodes: CategoryNode[]): CategoryNode[] => nodes.flatMap((n) => [n, ...flat(n.children)]);
    categoryPages = flat(tree).map((category) => ({
      url: `${siteUrl}${categoryHref(category.slug)}`,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch {
    categoryPages = [];
  }

  return [...staticPages, ...signPages, ...articlePages, ...categoryPages, ...productPages];
}
