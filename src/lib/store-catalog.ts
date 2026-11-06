// Catálogo público de la tienda: qué productos se muestran y en qué categoría.
// Lo usan /tienda y /tienda/categoria/[slug], para que las dos páginas apliquen exactamente las mismas reglas.

import type { Product } from "@prisma/client";
import { prisma, safeQuery } from "@/lib/prisma";
import { toProductViewModel, type ProductViewModel } from "@/lib/store-products";
import type { PaypalVisibility } from "@/lib/paypal-access";
import {
  EBOOKS_SLUG,
  PRINTABLES_SLUG,
  buildCategoryTree,
  categoryIdsOf,
  dropEmptyCategories,
  ensureDefaultCategories,
  loadCategoryRows,
  withProductCounts,
  type CategoryNode,
} from "@/lib/store-categories";

export type StoreCatalog = {
  /** Categorías visibles que tienen al menos un producto, con la cantidad de productos de cada una. */
  tree: CategoryNode[];
  /** Productos que se muestran en la tienda, los más nuevos primero. Los diseños van dentro de su colección. */
  products: ProductViewModel[];
  /** Productos que no pertenecen a ninguna categoría (por ejemplo, si se borró su categoría). */
  uncategorized: ProductViewModel[];
};

/**
 * Reglas del catálogo:
 * - Solo se muestran productos publicados. Un diseño no aparece suelto: aparece dentro de su colección.
 * - Una colección sin ningún diseño publicado no se muestra (no habría nada para comprar).
 * - Si la categoría del producto está oculta (o su categoría principal lo está), el producto no se muestra en la
 *   tienda. Su enlace directo sigue funcionando.
 * - Un producto sin categoría se ubica según su tipo anterior (libro o PDF); si tampoco hay, va a «Otros productos».
 */
export async function loadStoreCatalog(
  email: string | null,
  extras: { fxRate?: number | null; paypal?: PaypalVisibility } = {}
): Promise<StoreCatalog> {
  await ensureDefaultCategories();

  const [rows, products] = await Promise.all([
    loadCategoryRows(),
    safeQuery(() => prisma.product.findMany({ where: { published: true }, orderBy: { createdAt: "desc" } })),
  ]);

  const byId = new Map(rows.map((row) => [row.id, row]));
  const bySlug = new Map(rows.map((row) => [row.slug, row]));

  const designsByParent = new Map<string, Product[]>();
  for (const product of products) {
    if (!product.parentId) continue;
    const list = designsByParent.get(product.parentId) ?? [];
    list.push(product);
    designsByParent.set(product.parentId, list);
  }
  // Los diseños se muestran en el orden en que se cargaron.
  Array.from(designsByParent.values()).forEach((list) =>
    list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  );

  const effectiveCategoryId = (product: Product): string | null => {
    if (product.categoryId && byId.has(product.categoryId)) return product.categoryId;
    const legacy = bySlug.get(product.kind === "pdf" ? PRINTABLES_SLUG : EBOOKS_SLUG);
    return legacy?.id ?? null;
  };

  const isCategoryVisible = (id: string): boolean => {
    const row = byId.get(id);
    if (!row || !row.visible) return false;
    if (!row.parentId) return true;
    const parent = byId.get(row.parentId);
    return Boolean(parent && parent.visible);
  };

  const listed = products.filter((product) => {
    if (product.parentId) return false;
    if (product.isCollection && !designsByParent.has(product.id)) return false;
    const categoryId = effectiveCategoryId(product);
    return categoryId === null || isCategoryVisible(categoryId);
  });

  const viewModels = await Promise.all(
    listed.map(async (product) => {
      const model = await toProductViewModel(product, email, "/tienda?compra=1", extras, designsByParent.get(product.id) ?? []);
      return { ...model, categoryId: effectiveCategoryId(product) };
    })
  );

  const counts = new Map<string, number>();
  for (const model of viewModels) {
    if (model.categoryId) counts.set(model.categoryId, (counts.get(model.categoryId) ?? 0) + 1);
  }

  const baseTree = dropEmptyCategories(withProductCounts(buildCategoryTree(rows, { onlyVisible: true }), counts));

  // Una categoría sin imagen propia usa la portada de su producto más nuevo (o de uno de sus diseños),
  // así las tarjetas nunca quedan con el adorno vacío. Si subes una imagen en Admin › Categorías, esa manda.
  const productImage = (model: ProductViewModel): string | null => {
    const own = model.coverImage ?? model.heroImage;
    if (own) return own;
    const design = model.designs.find((d) => d.coverImage ?? d.heroImage);
    return design ? (design.coverImage ?? design.heroImage ?? null) : null;
  };
  const withFallbackImages = (nodes: CategoryNode[]): CategoryNode[] =>
    nodes.map((node) => {
      const children = withFallbackImages(node.children);
      if (node.image) return { ...node, children };
      const ids = new Set(categoryIdsOf(node));
      const match = viewModels.find((model) => model.categoryId !== null && ids.has(model.categoryId) && productImage(model));
      return { ...node, children, image: match ? productImage(match) : null };
    });
  const tree = withFallbackImages(baseTree);

  return {
    tree,
    products: viewModels,
    uncategorized: viewModels.filter((model) => model.categoryId === null),
  };
}
