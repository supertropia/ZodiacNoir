// Única fuente de verdad para las categorías de artículos. Se usa en:
// - el desplegable del panel de admin (ArticleForm)
// - la etiqueta visible en las tarjetas de artículo (ArticleCard)
// - la etiqueta visible arriba del título dentro del artículo
// Agregar una categoría nueva acá alcanza para que aparezca en todo el sitio.
export const CATEGORIES = [
  { value: "efemerides", label: "Efemérides" },
  { value: "signos", label: "Signos" },
  { value: "tarot", label: "Tarot" },
  { value: "psicologia-astrologica", label: "Psicología astrológica" },
  { value: "astrologia-mundial", label: "Astrología mundial" },
] as const;

export const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label])
);

export function getCategoryLabel(value: string): string {
  return CATEGORY_LABEL[value] ?? value;
}
