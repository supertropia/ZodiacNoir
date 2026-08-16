import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { signs } from "@/data/signs";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXTAUTH_URL || "https://zodiacnoirweb.com";

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/articulos`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/signos`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/efemerides`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/tienda`, changeFrequency: "weekly", priority: 0.6 },
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
    where: { published: true },
    select: { slug: true, updatedAt: true },
    orderBy: { publishedAt: "desc" },
  });

  const articlePages: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${siteUrl}/articulos/${article.slug}`,
    lastModified: article.updatedAt,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticPages, ...signPages, ...articlePages];
}
