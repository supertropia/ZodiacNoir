import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/ProductForm";
import { parseFaq } from "@/lib/seo";
import { loadProductFormOptions } from "@/lib/product-form-options";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) notFound();

  const { categories, collections } = await loadProductFormOptions();

  const initial = {
    ...product,
    categoryId: product.categoryId ?? "",
    parentId: product.parentId ?? "",
    variantLabel: product.variantLabel ?? "",
    coverImage: product.coverImage ?? "",
    heroImage: product.heroImage ?? "",
    audienceText: product.audienceText ?? "",
    fileUrl: product.fileUrl ?? "",
    videoUrl: product.videoUrl ?? "",
    amazonKindleUrl: product.amazonKindleUrl ?? "",
    amazonKindlePrice: product.amazonKindlePrice ?? "",
    amazonPaperbackUrl: product.amazonPaperbackUrl ?? "",
    amazonPaperbackPrice: product.amazonPaperbackPrice ?? "",
    lemonVariantId: product.lemonVariantId ?? "",
    galleryImages: (product.galleryImages ?? []) as string[],
    contentHighlights: (product.contentHighlights ?? []) as { title: string; description: string }[],
    testimonials: (product.testimonials ?? []) as { name: string; stars: number; text: string; shared: number }[],
    salesCount: product.salesCount ?? null,
    metaTitle: product.metaTitle ?? "",
    metaDescription: product.metaDescription ?? "",
    focusKeyword: product.focusKeyword ?? "",
    coverImageAlt: product.coverImageAlt ?? "",
    tags: product.tags.join(", "),
    faq: parseFaq(product.faq),
  };

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl text-gold-pale">
        {product.parentId ? "Editar diseño" : product.isCollection ? "Editar colección" : "Editar producto"}
      </h1>
      <ProductForm
        // Al cambiar de producto el formulario arranca de cero con sus datos.
        key={product.id}
        initial={initial}
        categories={categories}
        collections={collections.filter((c) => c.id !== product.id)}
      />
    </div>
  );
}
