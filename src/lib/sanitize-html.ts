import sanitizeHtmlLib from "sanitize-html";

// El contenido de los artículos ahora se guarda como HTML generado por el
// editor visual (RichTextEditor). Antes de guardarlo en la base de datos y
// antes de mostrarlo en la web, lo pasamos por un sanitizador para evitar
// que se pueda inyectar código malicioso (XSS) a través de este campo.
//
// Usamos "sanitize-html" (100% JavaScript, sin dependencias nativas) en vez
// de librerías basadas en jsdom, que en el pasado dieron errores 500
// intermitentes al desplegarse como función serverless en Vercel.
//
// La lista de etiquetas permitidas es intencionalmente chica: solo lo que el
// editor puede generar hoy, más lo necesario para artículos migrados del
// formato viejo (links e imágenes). Si más adelante el editor agrega algo
// nuevo, hay que sumarlo acá también.
const ALLOWED_TAGS = ["p", "strong", "em", "h2", "blockquote", "br", "a", "img"];

export function sanitizeArticleHtml(html: string): string {
  return sanitizeHtmlLib(html ?? "", {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      blockquote: ["class"],
      a: ["href", "target", "rel"],
      img: ["src", "alt"],
    },
    allowedSchemes: ["http", "https", "mailto"],
  });
}

/** Quita las etiquetas HTML y devuelve texto plano (para TTS y cálculo de lectura). */
export function htmlToPlainText(html: string): string {
  return sanitizeHtmlLib(html ?? "", { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}
