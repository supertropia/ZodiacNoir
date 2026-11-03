// Opciones que necesita el formulario de producto del panel: la lista de categorías y la de colecciones.

import { prisma, safeQuery } from "@/lib/prisma";
import { buildCategoryTree, loadCategoryRows } from "@/lib/store-categories";
import type { CategoryOption, CollectionOption } from "@/components/admin/ProductForm";

export async function loadProductFormOptions(): Promise<{
  categories: CategoryOption[];
  collections: CollectionOption[];
}> {
  const rows = await loadCategoryRows();
  const labelById = new Map<string, string>();
  const categories: CategoryOption[] = [];

  // Se incluyen también las categorías ocultas: la administración puede preparar productos en una sección antes de mostrarla.
  for (const top of buildCategoryTree(rows)) {
    labelById.set(top.id, top.name);
    categories.push({ id: top.id, label: top.name });
    for (const child of top.children) {
      const label = `${top.name} › ${child.name}`;
      labelById.set(child.id, label);
      categories.push({ id: child.id, label });
    }
  }

  const collectionRows = await safeQuery(() =>
    prisma.product.findMany({
      where: { isCollection: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, categoryId: true },
    })
  );

  const collections: CollectionOption[] = collectionRows.map((row) => ({
    id: row.id,
    title: row.title,
    categoryLabel: (row.categoryId && labelById.get(row.categoryId)) || "Sin categoría",
  }));

  return { categories, collections };
}
