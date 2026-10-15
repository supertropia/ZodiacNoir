// Convierte el texto que se escribe en el panel de admin (descripción, «Para quién es esto»,
// tarjetas de contenido) en párrafos y listas con viñetas bien separados.
//
// Reglas, pensadas para que quien carga el producto no tenga que saber nada técnico:
// - Una línea en blanco separa párrafos.
// - Una línea que empieza con «•», «-», «*» o «1.» es un ítem de lista.
// - Varios «•» en una misma línea ("Sirve para: • A • B • C") también se separan en ítems.
// - Si un texto largo viene todo seguido, sin ningún salto de línea, se parte solo en párrafos cortos.

export type TextBlock = { type: "p"; text: string } | { type: "ul"; items: string[] };

// Marcas de viñeta al comienzo de una línea: • · ▪ ● ◦ ‣ - – — * o numeración «1.» / «1)»
const LINE_BULLET = /^\s*(?:[•·▪●◦‣▫■*\-–—]|\d{1,2}[.)])\s+/;
// Viñetas que aparecen en medio de una línea, separadas por espacios
const INLINE_BULLET = /\s*[•▪●◦]\s+/;

const AUTO_SPLIT_MIN_LENGTH = 380;
const AUTO_SPLIT_TARGET_LENGTH = 320;

/** Parte un texto en oraciones (conserva el punto final de cada una). */
function splitSentences(text: string): string[] {
  const found = text.match(/[^.!?…]+(?:[.!?…]+["»”)]*|$)\s*/g);
  return (found ?? [text]).map((s) => s.trim()).filter(Boolean);
}

/** Agrupa oraciones en párrafos de largo parecido, sin cortar ninguna oración al medio. */
function groupSentences(text: string): string[] {
  const paragraphs: string[] = [];
  let current = "";
  for (const sentence of splitSentences(text)) {
    if (current && current.length + sentence.length + 1 > AUTO_SPLIT_TARGET_LENGTH) {
      paragraphs.push(current);
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }
  if (current) paragraphs.push(current);
  return paragraphs;
}

export function parseRichText(raw: string, options?: { autoParagraphs?: boolean }): TextBlock[] {
  const text = (raw ?? "").replace(/\r\n?/g, "\n").trim();
  if (!text) return [];

  const blocks: TextBlock[] = [];

  for (const chunk of text.split(/\n[ \t]*\n/)) {
    const lines = chunk
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    let paragraph: string[] = [];
    let items: string[] = [];

    const flushParagraph = () => {
      if (paragraph.length > 0) blocks.push({ type: "p", text: paragraph.join("\n") });
      paragraph = [];
    };
    const flushList = () => {
      if (items.length > 0) blocks.push({ type: "ul", items });
      items = [];
    };

    for (const line of lines) {
      const inlineParts = line.split(INLINE_BULLET);
      const startsWithBullet = LINE_BULLET.test(line);

      // «Intro: • A • B • C» (o una línea que empieza con «•» y trae más viñetas adentro)
      if (inlineParts.length >= 3 || (startsWithBullet && inlineParts.length >= 2 && /[•▪●◦]/.test(line.slice(1)))) {
        const [intro, ...rest] = inlineParts;
        if (intro.trim() && !LINE_BULLET.test(intro)) {
          flushList();
          paragraph.push(intro.trim());
          flushParagraph();
        } else if (intro.trim()) {
          items.push(intro.replace(LINE_BULLET, "").trim());
        }
        for (const part of rest) {
          const item = part.trim();
          if (item) items.push(item);
        }
        continue;
      }

      if (startsWithBullet) {
        flushParagraph();
        items.push(line.replace(LINE_BULLET, "").trim());
        continue;
      }

      flushList();
      paragraph.push(line);
    }

    flushParagraph();
    flushList();
  }

  // Texto largo escrito de corrido (sin ningún salto de línea): lo partimos en párrafos cortos.
  if (
    options?.autoParagraphs &&
    !text.includes("\n") &&
    blocks.length === 1 &&
    blocks[0].type === "p" &&
    text.length > AUTO_SPLIT_MIN_LENGTH
  ) {
    return groupSentences(text).map((p) => ({ type: "p", text: p }) as TextBlock);
  }

  return blocks;
}

/** Mismo texto, sin saltos ni viñetas: para tarjetas, descripciones de Google y datos estructurados. */
export function toPlainText(raw: string): string {
  return (raw ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim().replace(LINE_BULLET, "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s*[•▪●◦]\s+/g, ". ")
    .replace(/\s+/g, " ")
    .trim();
}

export function FormattedText({
  text,
  autoParagraphs = false,
  className = "",
}: {
  text: string;
  autoParagraphs?: boolean;
  className?: string;
}) {
  const blocks = parseRichText(text, { autoParagraphs });
  if (blocks.length === 0) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      {blocks.map((block, i) =>
        block.type === "p" ? (
          <p key={i} className="whitespace-pre-line">
            {block.text}
          </p>
        ) : (
          <ul key={i} role="list" className="space-y-2.5">
            {block.items.map((item, j) => (
              <li key={j} className="flex gap-3">
                <span aria-hidden="true" className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
