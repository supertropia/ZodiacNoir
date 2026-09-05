import { prisma } from "@/lib/prisma";
import { ArticleForm } from "@/components/admin/ArticleForm";

export const dynamic = "force-dynamic";

export default async function NewArticlePage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true },
  });

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl text-gold-pale">Nuevo artículo</h1>
      <ArticleForm products={products} />
    </div>
  );
}
