import { NextResponse } from "next/server";
import { prisma, safeQuery } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const articles = await safeQuery(() =>
    prisma.article.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      select: {
        slug: true,
        title: true,
        excerpt: true,
        category: true,
        sign: true,
      },
    })
  );

  return NextResponse.json({ articles });
}
