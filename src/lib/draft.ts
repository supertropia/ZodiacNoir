/**
 * Borradores de artículos.
 *
 * Un borrador se puede guardar con campos vacíos (título, copete, contenido…).
 * Para que la base de datos siempre tenga un valor, el servidor completa lo que
 * falte con estos textos provisorios. Al abrir el borrador para editarlo, el
 * formulario los muestra como campos vacíos, así que nunca se ven como si fueran
 * texto real. Al publicar, todo se exige completo.
 */

/** Título provisorio de un borrador que se guardó sin título. */
export const DRAFT_TITLE_PLACEHOLDER = "Borrador sin título";

/** Los slugs automáticos de borradores sin título empiezan con este prefijo. */
export const DRAFT_SLUG_PREFIX = "borrador-";

/** Categoría que se usa si un borrador llega sin categoría. */
export const DRAFT_DEFAULT_CATEGORY = "efemerides";

/** Slug único para un borrador sin título (por ejemplo: borrador-m3x9k2a7). */
export function makeDraftSlug(): string {
  const stamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 6);
  return `${DRAFT_SLUG_PREFIX}${stamp}${random}`;
}
