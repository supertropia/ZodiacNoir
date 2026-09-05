import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { ensureHtmlContent } from "@/lib/legacy-content";

export const dynamic = "force-dynamic";

export default async function EditArticlePage({ params }: { params: { id: string } }) {
  const article = await prisma.article.findUnique({ where: { id: params.id } });
  if (!article) notFound();

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true },
  });

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl text-gold-pale">Editar artículo</h1>
      <ArticleForm
        products={products}
        initial={{
          id: article.id,
          slug: article.slug,
          title: article.title,
          excerpt: article.excerpt,
          content: ensureHtmlContent(article.content),
          coverImage: article.coverImage ?? "",
          category: article.category,
          sign: article.sign ?? "",
          published: article.published,
          featuredProductId: article.featuredProductId ?? "",
        }}
      />
    </div>
  );
}
