// Ayudas para textos que pueden estar guardados de dos maneras: texto simple (el formato de siempre)
// o HTML (lo que genera el editor visual). Sirven igual en el navegador y en el servidor.

/** ¿El texto es HTML del editor visual? (empieza con una etiqueta de bloque) */
export function looksLikeHtml(raw: string): boolean {
  return /^\s*<(p|h[1-6]|ul|ol|blockquote|figure|div)[\s>/]/i.test(raw ?? "");
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decode(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_m, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name: string) => ENTITIES[name.toLowerCase()] ?? m);
}

/** HTML → texto con un salto de línea entre cada párrafo, título o línea. */
export function htmlToLines(html: string): string {
  const withBreaks = (html ?? "")
    .replace(/<img\b[^>]*>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h[1-6]|li|blockquote|figure|figcaption|div)>/gi, "\n");
  return decode(withBreaks.replace(/<[^>]*>/g, ""))
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

/** HTML → una sola línea de texto (para tarjetas, descripciones de Google y datos estructurados). */
export function htmlToPlain(html: string): string {
  return htmlToLines(html).replace(/\n/g, " ").trim();
}
