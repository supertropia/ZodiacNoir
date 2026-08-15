import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) notFound();

  const initial = {
    ...product,
    coverImage: product.coverImage ?? "",
    fileUrl: product.fileUrl ?? "",
  };

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl text-gold-pale">Editar producto</h1>
      <ProductForm initial={initial} />
    </div>
  );
}
