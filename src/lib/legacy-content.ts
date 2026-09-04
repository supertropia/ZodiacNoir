// Migración automática y silenciosa del formato viejo (texto plano con
// **negrita**, *cursiva*, [links](url) e ![imágenes](url)) al HTML que
// produce el editor visual nuevo (RichTextEditor).
//
// Por qué existe este archivo: se cargaron artículos reales con el sistema
// viejo antes de activar el editor nuevo. En vez de perder ese contenido o
// pedir que se reescriba a mano, esta función lo "traduce" automáticamente
// cada vez que se muestra o se edita. No hace falta correrla manualmente ni
// una sola vez: apenas alguien vuelve a guardar ese artículo desde el editor
// nuevo, se guarda ya como HTML real y esta conversión deja de ser necesaria
// para ese artículo en particular.

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const INLINE_RE = /(\*\*(.+?)\*\*|\*(.+?)\*|\[(.+?)\]\((.+?)\)|!\[(.*?)\]\((.+?)\))/;

export function convertInline(text: string): string {
  let remaining = text;
  let html = "";

  while (remaining.length) {
    const match = remaining.match(INLINE_RE);
    if (!match || match.index === undefined) {
      html += escapeHtml(remaining);
      break;
    }
    if (match.index > 0) html += escapeHtml(remaining.slice(0, match.index));

    if (match[2] !== undefined) {
      html += `<strong>${escapeHtml(match[2])}</strong>`;
    } else if (match[3] !== undefined) {
      html += `<em>${escapeHtml(match[3])}</em>`;
    } else if (match[4] !== undefined) {
      html += `<a href="${escapeHtml(match[5])}">${escapeHtml(match[4])}</a>`;
    } else if (match[7] !== undefined) {
      html += `<img src="${escapeHtml(match[7])}" alt="${escapeHtml(match[6] || "")}">`;
    }

    remaining = remaining.slice(match.index + match[0].length);
  }

  return html;
}

/** Un artículo del sistema nuevo siempre empieza con una etiqueta HTML real. */
export function isLegacyPlainTextContent(content: string): boolean {
  const trimmed = (content ?? "").trim();
  return trimmed.length > 0 && !trimmed.startsWith("<");
}

export function legacyContentToHtml(content: string): string {
  const blocks = content.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);

  return blocks
    .map((block) => {
      const soloImagen = block.match(/^!\[(.*?)\]\((.+?)\)$/);
      if (soloImagen) {
        return `<img src="${escapeHtml(soloImagen[2])}" alt="${escapeHtml(soloImagen[1] || "")}">`;
      }
      return `<p>${convertInline(block)}</p>`;
    })
    .join("");
}

/** Devuelve el contenido ya en HTML, migrando desde el formato viejo si hace falta. */
export function ensureHtmlContent(content: string): string {
  if (!content) return "";
  return isLegacyPlainTextContent(content) ? legacyContentToHtml(content) : content;
}

// --- Reparación de texto pegado desde afuera (ej: ChatGPT, Word) ---
// Cuando alguien pega un artículo entero dentro del editor visual, este
// inserta el texto tal cual, sin interpretar **negrita** ni separar
// párrafos por los saltos de línea originales (que se pierden al pegar).
// Esta función es una reconstrucción automática, no perfecta: conviene que
// la persona revise el resultado antes de guardar.

const ZODIAC_SIGNS =
  "Aries|Tauro|Géminis|Geminis|Cáncer|Cancer|Leo|Virgo|Libra|Escorpio|Sagitario|Capricornio|Acuario|Piscis";
const ZODIAC_EMOJI = "♈♉♊♋♌♍♎♏♐♑♒♓";

/**
 * Detecta el patrón típico de los artículos "por signo" (ej: "♌ Leo — Casa XI: comunidad...")
 * y separa cada signo en su propio párrafo. No lo marca como subtítulo H2 porque no hay forma
 * confiable de saber automáticamente dónde termina el título y empieza la descripción.
 */
function promoteZodiacSignSections(text: string): string {
  const signRe = new RegExp(`([${ZODIAC_EMOJI}]\\s*)?\\b(${ZODIAC_SIGNS})\\b\\s*(—|-)`, "g");
  return text.replace(signRe, (match) => `\n\n${match}`);
}

function isHeadingCandidate(inner: string): boolean {
  const words = inner.trim().split(/\s+/).filter(Boolean);
  return words.length >= 4 || inner.includes(":");
}

/** Promueve a "## subtítulo" las frases largas en **negrita** o *cursiva* (probables encabezados). */
function promoteLikelyHeadings(text: string): string {
  let result = text.replace(/\*\*(.+?)\*\*/g, (match, inner: string) =>
    isHeadingCandidate(inner) ? `\n\n##${inner}\n\n` : match
  );
  result = result.replace(/\*(.+?)\*/g, (match, inner: string) =>
    isHeadingCandidate(inner) ? `\n\n##${inner}\n\n` : match
  );
  return result;
}

/** Corta un bloque largo de texto corrido en párrafos de ~4 oraciones, para que no quede todo pegado. */
function splitIntoReadableParagraphs(block: string, sentencesPerParagraph = 4): string[] {
  const sentences = block.match(/[^.!?]+[.!?]+(\s+|$)/g) ?? [block];
  const paragraphs: string[] = [];
  for (let i = 0; i < sentences.length; i += sentencesPerParagraph) {
    const chunk = sentences.slice(i, i + sentencesPerParagraph).join("").trim();
    if (chunk) paragraphs.push(chunk);
  }
  return paragraphs.length ? paragraphs : [block];
}

/** Reconstruye HTML legible a partir de un texto pegado sin formato. Devuelve HTML listo para el editor. */
export function repairPastedPlainText(rawText: string): string {
  const withSignSections = promoteZodiacSignSections(rawText);
  const withHeadings = promoteLikelyHeadings(withSignSections);
  const blocks = withHeadings.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);

  const html = blocks
    .map((block) => {
      if (block.startsWith("##")) {
        return `<h2>${convertInline(block.replace(/^##\s*/, ""))}</h2>`;
      }
      return splitIntoReadableParagraphs(block)
        .map((p) => `<p>${convertInline(p)}</p>`)
        .join("");
    })
    .join("");

  return html || "<p></p>";
}
