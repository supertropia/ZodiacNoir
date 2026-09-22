import { slugify } from "./slugify";

export type TocHeading = { id: string; text: string };

/**
 * Recorre el HTML ya sanitizado de un artículo, le agrega un id único a
 * cada subtítulo (<h2>) para poder saltar directo a esa sección desde el
 * índice, y devuelve tanto la lista de subtítulos (para armar el índice)
 * como el HTML final con los ids ya insertados (para renderizar el cuerpo).
 *
 * Nota técnica: usa una expresión regular en vez de un parser de HTML
 * completo. Es seguro acá porque el contenido ya pasó por sanitizeArticleHtml
 * (etiquetas permitidas muy acotadas, sin H2 anidados ni HTML roto), pero si
 * el editor visual (RichTextEditor) llegara a permitir estructuras más
 * complejas en el futuro, esto habría que revisarlo.
 */
export function buildTableOfContents(html: string): { headings: TocHeading[]; html: string } {
  const headings: TocHeading[] = [];
  const usedIds = new Set<string>();

  const htmlWithIds = html.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (match, attrs: string, inner: string) => {
    const text = inner.replace(/<[^>]*>/g, "").trim();
    if (!text) return match;

    const base = slugify(text) || "seccion";
    let id = base;
    let n = 2;
    while (usedIds.has(id)) {
      id = `${base}-${n}`;
      n += 1;
    }
    usedIds.add(id);
    headings.push({ id, text });

    return `<h2 id="${id}"${attrs}>${inner}</h2>`;
  });

  return { headings, html: htmlWithIds };
}
