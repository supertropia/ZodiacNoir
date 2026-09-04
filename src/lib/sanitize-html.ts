import DOMPurify from "isomorphic-dompurify";

// El contenido de los artículos ahora se guarda como HTML generado por el
// editor visual (RichTextEditor). Antes de guardarlo en la base de datos y
// antes de mostrarlo en la web, lo pasamos por DOMPurify para evitar que se
// pueda inyectar código malicioso (XSS) a través de este campo.
//
// La lista de etiquetas permitidas es intencionalmente chica: solo lo que el
// editor puede generar hoy. Si más adelante el editor agrega, por ejemplo,
// imágenes o links, hay que sumarlos acá también.
const ALLOWED_TAGS = ["p", "strong", "em", "h2", "blockquote", "br"];

export function sanitizeArticleHtml(html: string): string {
  return DOMPurify.sanitize(html ?? "", {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ["class"],
  });
}

/** Quita las etiquetas HTML y devuelve texto plano (para TTS y cálculo de lectura). */
export function htmlToPlainText(html: string): string {
  return DOMPurify.sanitize(html ?? "", { ALLOWED_TAGS: [] })
    .replace(/\s+/g, " ")
    .trim();
}
