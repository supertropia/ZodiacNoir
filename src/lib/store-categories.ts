// Categorías de la tienda: dos niveles (categoría → subcategoría), editables desde /admin/categorias.
// Este archivo reúne todo lo que necesitan la tienda pública y el panel para leerlas y ordenarlas.

import type { StoreCategory } from "@prisma/client";
import { prisma, safeQuery } from "@/lib/prisma";

export type CategoryNode = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  sortOrder: number;
  visible: boolean;
  /** Productos que se muestran en la tienda dentro de esta categoría, contando sus subcategorías. */
  productCount: number;
  children: CategoryNode[];
};

/** Direcciones de las categorías iniciales. Los productos viejos se ubican en ellas según su tipo. */
export const EBOOKS_SLUG = "ebooks";
export const PRINTABLES_SLUG = "imprimibles";

const SEEDED_KEY = "store_categories_seeded";

const DEFAULT_TREE = [
  {
    slug: EBOOKS_SLUG,
    name: "E-books",
    description: "Libros y e-books de astrología humanista para leer en cualquier dispositivo o pedir en Amazon.",
    children: [] as { slug: string; name: string; description: string }[],
  },
  {
    slug: PRINTABLES_SLUG,
    name: "Imprimibles",
    description: "Material práctico en PDF para imprimir o usar en pantalla: calendarios, cuadernos de trabajo y más.",
    children: [
      {
        slug: "calendarios",
        name: "Calendarios",
        description: "Calendarios astrológicos con la Luna, los eclipses y los tránsitos del año, en distintos diseños.",
      },
      {
        slug: "cuadernos-de-trabajo",
        name: "Cuadernos de trabajo",
        description: "Cuadernos para completar a mano: ejercicios, preguntas y rituales para trabajar cada ciclo.",
      },
    ],
  },
];

/**
 * Crea las categorías iniciales (E-books, Imprimibles → Calendarios y Cuadernos de trabajo) la primera vez
 * y ubica en ellas los productos que ya existían, según su tipo anterior (libro o PDF). Corre una sola vez:
 * si después borras o renombras categorías, no vuelve a crearlas. Nunca rompe la página si algo falla.
 */
export async function ensureDefaultCategories(): Promise<void> {
  try {
    const done = await safeQuery(() => prisma.siteSetting.findUnique({ where: { key: SEEDED_KEY } }));
    if (done?.value === "true") return;

    const existing = await safeQuery(() => prisma.storeCategory.count());
    if (existing === 0) {
      let order = 0;
      for (const top of DEFAULT_TREE) {
        const parent = await prisma.storeCategory.upsert({
          where: { slug: top.slug },
          update: {},
          create: { slug: top.slug, name: top.name, description: top.description, sortOrder: order++ },
        });
        let childOrder = 0;
        for (const child of top.children) {
          await prisma.storeCategory.upsert({
            where: { slug: child.slug },
            update: {},
            create: {
              slug: child.slug,
              name: child.name,
              description: child.description,
              parentId: parent.id,
              sortOrder: childOrder++,
            },
          });
        }
      }

      // Los productos que ya estaban cargados pasan a su categoría según el tipo que tenían.
      const ebooks = await prisma.storeCategory.findUnique({ where: { slug: EBOOKS_SLUG } });
      const printables = await prisma.storeCategory.findUnique({ where: { slug: PRINTABLES_SLUG } });
      if (ebooks) {
        await prisma.product.updateMany({ where: { categoryId: null, kind: "book" }, data: { categoryId: ebooks.id } });
      }
      if (printables) {
        await prisma.product.updateMany({ where: { categoryId: null, kind: "pdf" }, data: { categoryId: printables.id } });
      }
    }

    await prisma.siteSetting.upsert({
      where: { key: SEEDED_KEY },
      update: { value: "true" },
      create: { key: SEEDED_KEY, value: "true" },
    });
  } catch (error) {
    // Si dos visitas llegan a la vez, una puede chocar con la otra: no es un problema, se reintenta en la siguiente.
    console.error("No se pudieron crear las categorías iniciales:", error);
  }
}

type CategoryRow = StoreCategory;

/**
 * Arma el árbol a partir de la lista plana. Con onlyVisible, deja afuera las categorías ocultas y todo
 * lo que hay dentro de una categoría oculta. El orden es el que se eligió en el panel.
 */
export function buildCategoryTree(rows: CategoryRow[], opts: { onlyVisible?: boolean } = {}): CategoryNode[] {
  const sorted = [...rows].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "es"));
  const toNode = (row: CategoryRow): CategoryNode => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    image: row.image,
    parentId: row.parentId,
    sortOrder: row.sortOrder,
    visible: row.visible,
    productCount: 0,
    children: [],
  });

  const nodes = new Map<string, CategoryNode>();
  for (const row of sorted) nodes.set(row.id, toNode(row));

  const top: CategoryNode[] = [];
  for (const row of sorted) {
    const node = nodes.get(row.id)!;
    const parent = row.parentId ? nodes.get(row.parentId) : undefined;
    if (parent) parent.children.push(node);
    else if (!row.parentId) top.push(node);
    // Una subcategoría cuya categoría principal ya no existe queda fuera del árbol.
  }

  if (!opts.onlyVisible) return top;
  return top
    .filter((node) => node.visible)
    .map((node) => ({ ...node, children: node.children.filter((child) => child.visible) }));
}

export async function loadCategoryRows(): Promise<CategoryRow[]> {
  return safeQuery(() => prisma.storeCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }));
}

/** El id de la categoría y de todas sus subcategorías (para filtrar productos). */
export function categoryIdsOf(node: CategoryNode): string[] {
  return [node.id, ...node.children.flatMap((child) => categoryIdsOf(child))];
}

/** Busca una categoría por su dirección. Devuelve también su categoría principal (si es una subcategoría). */
export function findCategoryBySlug(
  tree: CategoryNode[],
  slug: string
): { node: CategoryNode; parent: CategoryNode | null } | null {
  for (const top of tree) {
    if (top.slug === slug) return { node: top, parent: null };
    for (const child of top.children) {
      if (child.slug === slug) return { node: child, parent: top };
    }
  }
  return null;
}

/**
 * Suma a cada categoría los productos que se muestran dentro de ella (contando las subcategorías).
 * productsByCategory: id de categoría → cantidad de productos de la tienda que están directamente en ella.
 */
export function withProductCounts(tree: CategoryNode[], productsByCategory: Map<string, number>): CategoryNode[] {
  const count = (node: CategoryNode): CategoryNode => {
    const children = node.children.map(count);
    const own = productsByCategory.get(node.id) ?? 0;
    return { ...node, children, productCount: own + children.reduce((sum, c) => sum + c.productCount, 0) };
  };
  return tree.map(count);
}

/** Solo las categorías que tienen al menos un producto (las vacías no se muestran al público). */
export function dropEmptyCategories(tree: CategoryNode[]): CategoryNode[] {
  return tree
    .map((node) => ({ ...node, children: node.children.filter((child) => child.productCount > 0) }))
    .filter((node) => node.productCount > 0);
}

/** Dirección pública de una categoría. */
export function categoryHref(slug: string): string {
  return `/tienda/categoria/${slug}`;
}

/**
 * La ruta de categorías de un producto, de la principal a la subcategoría, para el recorrido de migas de pan.
 * Si alguna de las categorías está oculta devuelve una lista vacía (no se enlaza a páginas que no existen).
 */
export async function getVisibleCategoryChain(categoryId: string | null): Promise<{ slug: string; name: string }[]> {
  if (!categoryId) return [];
  try {
    const rows = await loadCategoryRows();
    const byId = new Map(rows.map((row) => [row.id, row]));
    const chain: CategoryRow[] = [];
    let current = byId.get(categoryId);
    while (current && chain.length < 3) {
      chain.unshift(current);
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
    if (chain.length === 0 || chain.some((row) => !row.visible)) return [];
    return chain.map((row) => ({ slug: row.slug, name: row.name }));
  } catch {
    return [];
  }
}
