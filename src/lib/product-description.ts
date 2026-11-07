import { parseRichText } from "@/components/store/FormattedText";
import { htmlToLines, looksLikeHtml } from "@/lib/html-text";

// La descripción de un producto puede estar guardada como texto simple (productos cargados antes) o como HTML
// del editor visual (el mismo que usan los artículos). Estas ayudas pasan de un formato al otro.

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Lo que se carga en el editor visual: si ya es HTML se deja igual; si es texto simple, se arma con párrafos. */
export function descriptionToEditorHtml(raw: string): string {
  const text = raw ?? "";
  if (!text.trim()) return "";
  if (looksLikeHtml(text)) return text;
  const html = parseRichText(text, { autoParagraphs: true })
    .map((block) =>
      block.type === "p"
        ? `<p>${escapeHtml(block.text).replace(/\n/g, "<br>")}</p>`
        : // El editor no tiene listas: los ítems quedan como líneas con «•» dentro de un mismo bloque.
          `<p>${block.items.map((item) => `• ${escapeHtml(item)}`).join("<br>")}</p>`
    )
    .join("");
  return html;
}

/** ¿El editor quedó sin texto ni imágenes? (por ejemplo «<p></p>») */
export function isDescriptionEmpty(html: string): boolean {
  if (/<img\b/i.test(html ?? "")) return false;
  return htmlToLines(html ?? "").length === 0;
}
