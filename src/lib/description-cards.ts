// Convierte la descripción de un producto en una introducción corta y varias tarjetas deslizables.
// Funciona sola, sin trabajo extra al cargar el producto:
// - Si la descripción tiene subtítulos (el editor visual), cada subtítulo pasa a ser una tarjeta.
// - Si no tiene subtítulos, los párrafos se agrupan en tarjetas de largo parecido ("Detalle 1", "Detalle 2"…).
// - El primer párrafo queda como introducción, junto al título del producto.

import { htmlToLines, htmlToPlain, looksLikeHtml } from "@/lib/html-text";

export type DescriptionCard = { title: string; body: string };
export type DescriptionParts = { intro: string; cards: DescriptionCard[] };

type Block = { kind: "h" | "p"; text: string };

// Largo mínimo (en caracteres) de una tarjeta armada con párrafos sueltos.
const MIN_CARD_LENGTH = 380;
const MAX_CARDS = 8;

function htmlBlocks(html: string): Block[] {
  const blocks: Block[] = [];
  const pattern = /<(h[1-6]|p|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const text = htmlToLines(match[2]).replace(/\n+/g, " ").trim();
    if (!text) continue;
    blocks.push({ kind: tag.startsWith("h") ? "h" : "p", text });
  }
  return blocks;
}

function plainBlocks(raw: string): Block[] {
  return raw
    .replace(/\r\n?/g, "\n")
    .split(/\n[ \t]*\n/)
    .map((chunk) => chunk.split("\n").map((l) => l.trim()).filter(Boolean).join("\n"))
    .filter(Boolean)
    .map((text) => ({ kind: "p" as const, text }));
}

/** Parte la descripción. Si no hay material para al menos 2 tarjetas, devuelve cards vacío (se muestra el texto completo). */
export function splitDescription(raw: string): DescriptionParts {
  const source = raw ?? "";
  const blocks = looksLikeHtml(source) ? htmlBlocks(source) : plainBlocks(source);
  if (blocks.length === 0) return { intro: htmlToPlain(source), cards: [] };

  const rest = [...blocks];
  let intro = "";
  if (rest[0].kind === "p") intro = rest.shift()!.text;

  const hasHeadings = rest.some((b) => b.kind === "h");
  const cards: DescriptionCard[] = [];

  if (hasHeadings) {
    let current: DescriptionCard | null = null;
    for (const block of rest) {
      if (block.kind === "h") {
        if (current && current.body) cards.push(current);
        current = { title: block.text, body: "" };
      } else {
        if (!current) current = { title: "Sobre este producto", body: "" };
        current.body = current.body ? `${current.body}\n\n${block.text}` : block.text;
      }
    }
    if (current && current.body) cards.push(current);
  } else {
    const paragraphs = rest.map((b) => b.text);
    const total = paragraphs.reduce((sum, p) => sum + p.length, 0);
    if (paragraphs.length >= 2 || total >= MIN_CARD_LENGTH) {
      const target = Math.max(MIN_CARD_LENGTH, Math.ceil(total / MAX_CARDS));
      let body = "";
      for (const paragraph of paragraphs) {
        body = body ? `${body}\n\n${paragraph}` : paragraph;
        if (body.length >= target) {
          cards.push({ title: `Detalle ${cards.length + 1}`, body });
          body = "";
        }
      }
      if (body) {
        // El resto corto se suma a la última tarjeta para no dejar una tarjeta casi vacía.
        if (cards.length > 0 && body.length < target / 2) cards[cards.length - 1].body += `\n\n${body}`;
        else cards.push({ title: `Detalle ${cards.length + 1}`, body });
      }
    }
  }

  if (cards.length < 2) return { intro: intro || htmlToPlain(source), cards: [] };
  return { intro, cards: cards.slice(0, MAX_CARDS * 2) };
}
