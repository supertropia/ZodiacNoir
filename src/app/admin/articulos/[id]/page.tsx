import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ArticleForm } from "@/components/admin/ArticleForm";

export const dynamic = "force-dynamic";

export default async function EditArticlePage({ params }: { params: { id: string } }) {
  const article = await prisma.article.findUnique({ where: { id: params.id } });
  if (!article) notFound();

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl text-gold-pale">Editar artículo</h1>
      <ArticleForm
        initial={{
          id: article.id,
          slug: article.slug,
          title: article.title,
          excerpt: article.excerpt,
          content: article.content,
          coverImage: article.coverImage ?? "",
          category: article.category,
          sign: article.sign ?? "",
          authorName: article.authorName,
          authorRole: article.authorRole,
          published: article.published,
        }}
      />
    </div>
  );
}
