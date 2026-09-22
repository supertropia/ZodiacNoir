import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";

// Buscador usado por el botón "+ Enlace interno" del editor de artículos.
// Devuelve artículos y productos cuyo título coincide con lo que se está
// escribiendo, junto con la URL real a la que hay que enlazar cada uno.
export async function GET(req: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (q.length < 2) return NextResponse.json({ results: [] });

  const [articles, products] = await Promise.all([
    prisma.article.findMany({
      where: { title: { contains: q, mode: "insensitive" } },
      select: { title: true, slug: true },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.product.findMany({
      where: { title: { contains: q, mode: "insensitive" } },
      select: { title: true, slug: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const results = [
    ...articles.map((a) => ({
      type: "articulo" as const,
      title: a.title,
      href: `/articulos/${a.slug}`,
    })),
    ...products.map((p) => ({
      type: "producto" as const,
      title: p.title,
      href: `/tienda?producto=${p.slug}`,
    })),
  ];

  return NextResponse.json({ results });
}
