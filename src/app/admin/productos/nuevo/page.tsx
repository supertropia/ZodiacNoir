import { ProductForm } from "@/components/admin/ProductForm";
import { ensureDefaultCategories } from "@/lib/store-categories";
import { loadProductFormOptions } from "@/lib/product-form-options";

export const dynamic = "force-dynamic";

export default async function NewProductPage({ searchParams }: { searchParams: { coleccion?: string } }) {
  await ensureDefaultCategories();
  const { categories, collections } = await loadProductFormOptions();
  const isDesign = Boolean(searchParams?.coleccion);

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl text-gold-pale">{isDesign ? "Nuevo diseño" : "Nuevo producto"}</h1>
      <ProductForm categories={categories} collections={collections} defaultParentId={searchParams?.coleccion} />
    </div>
  );
}
