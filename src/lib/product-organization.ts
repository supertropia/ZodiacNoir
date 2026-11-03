// Cómo se organiza un producto en la tienda: producto único, colección con varios diseños, o diseño de una colección.
// Lo usan las rutas del panel que crean y editan productos, para aplicar las mismas reglas en las dos.

import type { Product } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PRINTABLES_SLUG } from "@/lib/store-categories";

export type ProductOrganization =
  | {
      ok: true;
      /** La colección a la que pertenece, si el producto es un diseño. */
      parent: Product | null;
      data: {
        categoryId: string | null;
        isCollection: boolean;
        parentId: string | null;
        variantLabel: string | null;
        /** Dato antiguo ("book" o "pdf"): se mantiene alineado con la categoría. */
        kind: "book" | "pdf";
      };
    }
  | { ok: false; error: string; status: number };

const VARIANT_LABEL_MAX = 80;

/**
 * Lee del formulario el tipo de producto (isCollection / parentId), la categoría y el nombre del diseño, y comprueba
 * que sean coherentes. currentId = el producto que se está editando (vacío al crear uno nuevo).
 */
export async function resolveProductOrganization(
  body: Record<string, unknown>,
  currentId?: string
): Promise<ProductOrganization> {
  const fail = (error: string, status = 400): ProductOrganization => ({ ok: false, error, status });

  const parentId = typeof body.parentId === "string" && body.parentId ? body.parentId : null;
  const wantsCollection = body.isCollection === true;

  // --- Diseño de una colección ---
  if (parentId) {
    if (currentId && parentId === currentId) return fail("Un producto no puede ser un diseño de sí mismo.");
    if (wantsCollection) return fail("Un diseño no puede ser, a la vez, una colección.");

    const parent = await prisma.product.findUnique({ where: { id: parentId } });
    if (!parent) return fail("No se encontró la colección elegida.", 404);
    if (!parent.isCollection || parent.parentId) {
      return fail("El producto elegido no es una colección con varios diseños.");
    }

    if (currentId) {
      const ownDesigns = await prisma.product.count({ where: { parentId: currentId } });
      if (ownDesigns > 0) return fail("Este producto ya tiene diseños propios, así que no puede ser un diseño de otro.");
    }

    const variantLabel = typeof body.variantLabel === "string" ? body.variantLabel.trim() : "";
    if (!variantLabel) return fail("Escribe el nombre del diseño (por ejemplo «Minimal · A4»).");
    if (variantLabel.length > VARIANT_LABEL_MAX) {
      return fail(`El nombre del diseño es demasiado largo (máximo ${VARIANT_LABEL_MAX} caracteres).`);
    }

    return {
      ok: true,
      parent,
      data: {
        // El diseño siempre queda en la misma categoría que su colección.
        categoryId: parent.categoryId,
        isCollection: false,
        parentId: parent.id,
        variantLabel,
        kind: parent.kind === "pdf" ? "pdf" : "book",
      },
    };
  }

  // --- Producto único o colección: necesitan una categoría ---
  const categoryId = typeof body.categoryId === "string" && body.categoryId ? body.categoryId : null;
  if (!categoryId) return fail("Elige la categoría en la que va el producto.");

  const category = await prisma.storeCategory.findUnique({ where: { id: categoryId }, include: { parent: true } });
  if (!category) return fail("La categoría elegida ya no existe. Actualiza la página y elige otra.");
  const root = category.parent ?? category;

  if (currentId) {
    const current = await prisma.product.findUnique({
      where: { id: currentId },
      include: { _count: { select: { designs: true, purchases: true } } },
    });
    if (current) {
      if (current.isCollection && !wantsCollection && current._count.designs > 0) {
        return fail("Esta colección ya tiene diseños. Quítalos o bórralos primero si quieres que deje de ser una colección.", 409);
      }
      if (!current.isCollection && wantsCollection && current._count.purchases > 0) {
        return fail(
          "Este producto ya tiene compras, así que no se puede convertir en colección sin perjudicar a quienes lo compraron. Crea una colección nueva y agrégale los diseños.",
          409
        );
      }
    }
  }

  return {
    ok: true,
    parent: null,
    data: {
      categoryId: category.id,
      isCollection: wantsCollection,
      parentId: null,
      variantLabel: null,
      kind: root.slug === PRINTABLES_SLUG ? "pdf" : "book",
    },
  };
}
