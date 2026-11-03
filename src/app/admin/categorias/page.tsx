import { prisma, safeQuery } from "@/lib/prisma";
import { CategoriesManager, type AdminCategory } from "@/components/admin/CategoriesManager";
import {
  buildCategoryTree,
  ensureDefaultCategories,
  loadCategoryRows,
  type CategoryNode,
} from "@/lib/store-categories";

export const metadata = { title: "Categorías de la tienda · Panel" };
export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await ensureDefaultCategories();

  const rows = await loadCategoryRows();

  // Cuántos productos (de primer nivel: una colección cuenta como uno) hay directamente en cada categoría.
  const grouped = await safeQuery(() =>
    prisma.product.groupBy({ by: ["categoryId"], where: { parentId: null }, _count: { _all: true } })
  );
  const own = new Map<string, number>();
  for (const group of grouped) {
    if (group.categoryId) own.set(group.categoryId, group._count._all);
  }

  const toAdmin = (node: CategoryNode): AdminCategory => {
    const children = node.children.map(toAdmin);
    const ownProducts = own.get(node.id) ?? 0;
    return {
      id: node.id,
      slug: node.slug,
      name: node.name,
      description: node.description,
      image: node.image,
      parentId: node.parentId,
      visible: node.visible,
      ownProducts,
      totalProducts: ownProducts + children.reduce((sum, child) => sum + child.totalProducts, 0),
      children,
    };
  };

  const categories = buildCategoryTree(rows).map(toAdmin);

  return (
    <div>
      <h1 className="font-display text-3xl text-gold-pale">Categorías de la tienda</h1>
      <p className="mb-8 mt-2 max-w-2xl font-body text-lg text-gold-pale/85">
        Aquí decides cómo se ordena la tienda: crea categorías (por ejemplo «E-books» o «Imprimibles»), agrégales
        subcategorías (por ejemplo «Calendarios» dentro de «Imprimibles»), cámbiales el orden y muéstralas u ocúltalas
        cuando quieras. Para ubicar un producto en una categoría, elígela en la ficha del producto.
      </p>
      <CategoriesManager categories={categories} />
    </div>
  );
}
