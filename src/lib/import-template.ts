// Lectura de los Word de instrucciones del importador (/admin/importar).
//
// Un Word de instrucciones es un documento con líneas del estilo «Campo: valor» (por ejemplo «Título: ...»,
// «Precio: 12»). Cuando un campo es largo (descripción, copete, preguntas frecuentes…), se escribe el nombre del
// campo solo en una línea y el texto en los párrafos de abajo; el campo termina donde empieza el siguiente.
//
// Este archivo no depende de nada del servidor ni del navegador: solo trabaja con texto y HTML, así que se usa
// igual en el panel (navegador) y en las pruebas.

export type Block = { html: string; text: string; tag: string };

export type FieldKey =
  | "tipo" | "titulo" | "slug" | "categoria" | "signo" | "copete" | "texto" | "contenido"
  | "portada" | "alt_portada" | "imagen_principal" | "galeria" | "premium" | "producto_destacado"
  | "fecha" | "titulo_seo" | "descripcion_seo" | "palabra_clave" | "etiquetas" | "faq"
  | "enlace" | "imagen" | "ver_tambien" | "precio" | "descripcion" | "que_incluye" | "para_quien"
  | "pdf" | "video";

const LABELS: Record<FieldKey, string[]> = {
  tipo: ["tipo", "tipo de contenido"],
  titulo: ["titulo", "titulo del articulo", "titulo del producto", "nombre", "nombre del producto"],
  slug: ["slug", "url amigable", "direccion web"],
  categoria: ["categoria"],
  signo: ["signo"],
  copete: ["copete", "resumen", "extracto"],
  texto: ["texto", "archivo de texto", "word del texto", "documento del texto"],
  contenido: ["contenido", "cuerpo", "cuerpo del articulo"],
  portada: ["portada", "imagen de portada"],
  alt_portada: ["alt portada", "alt de la portada", "texto alternativo portada", "texto alternativo de la portada"],
  imagen_principal: ["imagen principal", "imagen hero", "hero"],
  galeria: ["galeria", "imagenes de galeria", "imagenes del producto"],
  premium: ["premium", "solo miembros", "articulo premium"],
  producto_destacado: ["producto destacado", "producto relacionado"],
  fecha: ["fecha de publicacion", "fecha", "publicar el", "programar para"],
  titulo_seo: ["titulo seo", "meta titulo", "meta title"],
  descripcion_seo: ["descripcion seo", "meta descripcion", "meta description"],
  palabra_clave: ["palabra clave", "palabra clave principal", "keyword", "focus keyword"],
  etiquetas: ["etiquetas", "tags"],
  faq: ["preguntas frecuentes", "faq"],
  enlace: ["enlace", "enlace interno", "link", "link interno"],
  imagen: ["imagen", "imagen en el texto", "foto"],
  ver_tambien: ["ver tambien", "te puede interesar", "sigue leyendo", "enlaces al final"],
  precio: ["precio", "precio usd", "precio en usd", "precio en dolares"],
  descripcion: ["descripcion", "descripcion del producto"],
  que_incluye: ["que incluye", "contenido del producto", "incluye"],
  para_quien: ["para quien es", "para quien es esto", "publico"],
  pdf: ["pdf", "archivo pdf", "archivo del producto", "archivo"],
  video: ["video", "video de presentacion"],
};

const LABEL_LOOKUP = new Map<string, FieldKey>();
for (const [key, names] of Object.entries(LABELS) as [FieldKey, string[]][]) {
  for (const name of names) LABEL_LOOKUP.set(name, key);
}

/** Campos que se pueden repetir en varias líneas (cada línea es una regla). */
const REPEATABLE: FieldKey[] = ["enlace", "imagen"];

// ---------------------------------------------------------------------------
// Utilidades de texto y HTML
// ---------------------------------------------------------------------------

/** Minúsculas, sin acentos y con espacios simples: sirve para comparar nombres y frases. */
export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&");
}

export function htmlToText(html: string): string {
  return decodeEntities(html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, "")).replace(/[ \t]+/g, " ").trim();
}

/** Divide el HTML que genera mammoth en sus bloques de primer nivel (párrafos, títulos, listas, tablas…). */
export function splitBlocks(html: string): Block[] {
  const blocks: Block[] = [];
  const re = /<(p|h[1-6]|ul|ol|blockquote|table)(?:\s[^>]*)?>[\s\S]*?<\/\1>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    blocks.push({ html: match[0], text: htmlToText(match[0]), tag: match[1] });
  }
  return blocks;
}

/** Quita comillas de cualquier estilo (rectas, curvas o angulares) alrededor de un texto. */
export function stripQuotes(text: string): string {
  return text.trim().replace(/^["'“”‘’«»]+/, "").replace(/["'“”‘’«»]+$/, "").trim();
}

// ---------------------------------------------------------------------------
// Lectura del Word de instrucciones
// ---------------------------------------------------------------------------

export type Field = { text: string; blocks: Block[] };

export type TemplateParse = {
  /** true si el documento parece un Word de instrucciones (tiene varios campos reconocidos). */
  isTemplate: boolean;
  kind: "articulo" | "producto" | null;
  fields: Partial<Record<FieldKey, Field>>;
  /** Líneas de los campos repetibles («Enlace», «Imagen»), una por línea. */
  repeated: { enlace: string[]; imagen: string[] };
  warnings: string[];
};

function detectLabel(text: string): { key: FieldKey; rest: string } | null {
  const m = text.match(/^\s*([^:：\n]{2,40}?)\s*[:：]\s*([\s\S]*)$/);
  if (!m) return null;
  const key = LABEL_LOOKUP.get(normalizeText(m[1]));
  if (!key) return null;
  return { key, rest: m[2].trim() };
}

export function parseTemplate(blocks: Block[]): TemplateParse {
  const fields: Partial<Record<FieldKey, Field>> = {};
  const repeated = { enlace: [] as string[], imagen: [] as string[] };
  const warnings: string[] = [];
  let current: FieldKey | null = null;
  let recognized = 0;

  for (const block of blocks) {
    const found = block.tag === "table" ? null : detectLabel(block.text);
    if (found) {
      recognized += 1;
      current = found.key;
      if (REPEATABLE.includes(found.key)) {
        if (found.rest) (repeated as Record<string, string[]>)[found.key].push(found.rest);
        else warnings.push(`La línea «${block.text}» no tiene contenido.`);
        // Las líneas siguientes sin campo no se agregan a un campo repetible.
        current = null;
        continue;
      }
      if (fields[found.key]) {
        warnings.push(`El campo «${found.key.replace(/_/g, " ")}» aparece más de una vez: se usó la primera.`);
        current = null;
        continue;
      }
      const first: Block[] = found.rest ? [{ html: `<p>${escapeHtml(found.rest)}</p>`, text: found.rest, tag: "p" }] : [];
      fields[found.key] = { text: found.rest, blocks: first };
      continue;
    }
    if (current && fields[current]) {
      const f = fields[current]!;
      f.blocks.push(block);
      f.text = f.text ? `${f.text}\n${block.text}` : block.text;
    }
    // Lo que está antes del primer campo (indicaciones de la plantilla) se ignora.
  }

  const tipoText = normalizeText(fields.tipo?.text ?? "");
  let kind: TemplateParse["kind"] = null;
  if (/^(articulo|blog|nota|entrada)/.test(tipoText)) kind = "articulo";
  else if (/^(producto|pdf|ebook|e-book|libro|imprimible)/.test(tipoText)) kind = "producto";
  else if (!tipoText) {
    if (fields.precio || fields.pdf || fields.que_incluye) kind = "producto";
    else if (fields.copete || fields.texto || fields.contenido || fields.signo) kind = "articulo";
  } else {
    warnings.push(`No entendí el tipo «${fields.tipo?.text}». Escribe «Artículo» o «Producto».`);
  }

  const isTemplate = recognized >= 2 && Boolean(fields.titulo || fields.tipo);
  return { isTemplate, kind, fields, repeated, warnings };
}

// ---------------------------------------------------------------------------
// Conversión de valores
// ---------------------------------------------------------------------------

export function firstLine(field: Field | undefined): string {
  return (field?.text ?? "").split("\n").map((l) => l.trim()).find(Boolean) ?? "";
}

/** Lista separada por comas, punto y coma o saltos de línea. */
export function parseList(text: string | undefined): string[] {
  return (text ?? "")
    .split(/[,;\n]/)
    .map((s) => stripQuotes(s))
    .filter(Boolean);
}

export function parseBool(text: string | undefined): boolean {
  return /^(si|yes|true|1|x|premium)\b/.test(normalizeText(text ?? ""));
}

/**
 * Acepta «2026-11-10», «2026-11-10 08:00», «10/11/2026» o «10/11/2026 08:00» (siempre día/mes/año, hora de Argentina).
 * Devuelve «AAAA-MM-DDTHH:MM» o null si no se entiende. Sin hora, usa las 08:00.
 */
export function parseDateAR(text: string | undefined): string | null {
  const raw = (text ?? "").trim();
  if (!raw) return null;
  let y: number, mo: number, d: number;
  let m = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T]+(\d{1,2}):(\d{2}))?/);
  let hh = 8, mm = 0;
  if (m) {
    y = +m[1]; mo = +m[2]; d = +m[3];
    if (m[4] !== undefined) { hh = +m[4]; mm = +m[5]; }
  } else {
    m = raw.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})(?:[ T]+(\d{1,2}):(\d{2}))?/);
    if (!m) return null;
    d = +m[1]; mo = +m[2]; y = +m[3];
    if (m[4] !== undefined) { hh = +m[4]; mm = +m[5]; }
  }
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || hh > 23 || mm > 59 || y < 2000) return null;
  const check = new Date(Date.UTC(y, mo - 1, d));
  if (check.getUTCMonth() !== mo - 1) return null;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${y}-${p(mo)}-${p(d)}T${p(hh)}:${p(mm)}`;
}

/** Precio en dólares: acepta «12», «12,50», «USD 12», «$12.50». */
export function parsePriceText(text: string | undefined): string {
  const cleaned = (text ?? "").replace(/usd|us\$|u\$s|dolares?|\$/gi, "").replace(/\s/g, "");
  if (!cleaned) return "";
  const n = Number(cleaned.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? String(n) : "";
}

export type FaqPair = { question: string; answer: string };

/** Preguntas frecuentes: «P: ... / R: ...», «Pregunta: ... / Respuesta: ...» o «¿...?» seguida de su respuesta. */
export function parseFaqText(text: string | undefined): FaqPair[] {
  const lines = (text ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  const pairs: FaqPair[] = [];
  let q = "";
  let a: string[] = [];
  let mode: "q" | "a" | null = null;
  const flush = () => {
    if (q && a.length) pairs.push({ question: q.trim(), answer: a.join(" ").trim() });
    q = "";
    a = [];
  };
  const qLabel = /^(?:p|pregunta)\s*\d*\s*[:.)-]\s*/i;
  const aLabel = /^(?:r|respuesta)\s*\d*\s*[:.)-]\s*/i;
  for (const line of lines) {
    if (qLabel.test(line)) { flush(); q = line.replace(qLabel, ""); mode = "q"; continue; }
    if (aLabel.test(line)) { a.push(line.replace(aLabel, "")); mode = "a"; continue; }
    if (/^¿/.test(line) && (mode !== "q" || a.length > 0 || /\?$/.test(q))) {
      flush(); q = line; mode = "q";
      continue;
    }
    if (mode === "q" && !a.length && !/\?$/.test(q)) q += ` ${line}`;
    else if (q) { a.push(line); mode = "a"; }
  }
  flush();
  return pairs;
}

export type LinkRule = { anchor: string; href: string };

const ARROW = /\s*(?:->|→|=>|➜|➔|⇒)\s*/;

/** Destino de un enlace: ruta interna («/blog/algo») o dirección completa. Las del propio sitio pasan a ruta interna. */
export function normalizeHref(raw: string): string | null {
  let href = stripQuotes(raw).replace(/\s+/g, "");
  if (!href) return null;
  const own = href.match(/^https?:\/\/(?:www\.)?zodiacnoirweb\.com(\/.*)?$/i);
  if (own) href = own[1] || "/";
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  if (/^https?:\/\/[^\s]+\.[^\s]+/i.test(href)) return href;
  return null;
}

/** «frase del texto -> destino» (también acepta flecha →). */
export function parseLinkRule(line: string): LinkRule | null {
  const parts = line.split(ARROW);
  if (parts.length < 2) return null;
  const anchor = stripQuotes(parts[0]);
  const href = normalizeHref(parts.slice(1).join("->"));
  if (!anchor || !href) return null;
  return { anchor, href };
}

export type ImageRule = { file: string; caption: string; mode: "after" | "before" | null; phrase: string };

/** «archivo.jpg | pie de foto | después de: "frase"». El pie y la posición son opcionales. */
export function parseImageRule(line: string): ImageRule | null {
  const parts = line.split("|").map((p) => p.trim());
  const file = stripQuotes(parts[0] ?? "");
  if (!file) return null;
  let caption = "";
  let mode: ImageRule["mode"] = null;
  let phrase = "";
  for (const part of parts.slice(1)) {
    const pos = part.match(/^(despu[eé]s|antes)\s+de\s*[:：]?\s*(.+)$/i);
    if (pos) {
      mode = /^antes/i.test(pos[1]) ? "before" : "after";
      phrase = stripQuotes(pos[2]);
    } else if (part) {
      caption = part;
    }
  }
  return { file, caption, mode, phrase };
}

export type SeeAlso = { label: string; href: string };

export function parseSeeAlso(text: string | undefined): { items: SeeAlso[]; invalid: string[] } {
  const items: SeeAlso[] = [];
  const invalid: string[] = [];
  for (const line of (text ?? "").split("\n").map((l) => l.trim()).filter(Boolean)) {
    const rule = parseLinkRule(line);
    if (rule) items.push({ label: rule.anchor, href: rule.href });
    else invalid.push(line);
  }
  return { items, invalid };
}

export type Highlight = { title: string; description: string };

/** «Título | descripción» (la descripción es opcional), una por línea. */
export function parseHighlights(text: string | undefined): Highlight[] {
  const out: Highlight[] = [];
  for (const line of (text ?? "").split("\n").map((l) => l.trim()).filter(Boolean)) {
    const clean = line.replace(/^[•·▪●◦\-–—*]\s+/, "");
    const [title, ...rest] = clean.split("|");
    if (title.trim()) out.push({ title: title.trim(), description: rest.join("|").trim() });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Armado del texto del artículo
// ---------------------------------------------------------------------------

export type BodyResult = { parts: string[]; tables: number };

/**
 * Pasa los bloques de Word a las etiquetas que acepta el editor de artículos (títulos, párrafos, negritas,
 * enlaces, imágenes). Devuelve una lista de bloques de HTML (uno por párrafo, título o figura).
 */
export function blocksToArticleParts(blocks: Block[]): BodyResult {
  const out: string[] = [];
  let tables = 0;
  for (const block of blocks) {
    const inner = block.html.replace(/^<[^>]+>/, "").replace(/<\/[a-z0-9]+>$/i, "");
    if (block.tag === "table") {
      tables += 1;
      continue;
    }
    if (block.tag === "ul" || block.tag === "ol") {
      const items = Array.from(block.html.matchAll(/<li(?:\s[^>]*)?>([\s\S]*?)<\/li>/g)).map((m) => m[1]);
      items.forEach((item, i) => {
        const bullet = block.tag === "ol" ? `${i + 1}.` : "•";
        out.push(`<p>${bullet} ${item}</p>`);
      });
      continue;
    }
    if (/^h[1-2]$/.test(block.tag)) {
      out.push(`<h2>${inner}</h2>`);
      continue;
    }
    if (/^h[3-6]$/.test(block.tag)) {
      out.push(`<h3>${inner}</h3>`);
      continue;
    }
    if (block.tag === "blockquote") {
      out.push(block.html);
      continue;
    }
    // Un párrafo que solo contiene imágenes pasa a ser una figura propia.
    const onlyImages = inner.replace(/<img\b[^>]*>/gi, "").replace(/&nbsp;|\s/g, "") === "" && /<img\b/i.test(inner);
    if (onlyImages) {
      for (const img of inner.match(/<img\b[^>]*>/gi) ?? []) out.push(`<figure>${img}</figure>`);
      continue;
    }
    if (inner.replace(/<[^>]*>|&nbsp;|\s/g, "") === "" && !/<img\b/i.test(inner)) continue;
    out.push(`<p>${inner}</p>`);
  }
  return { parts: out, tables };
}

/** Texto plano para la descripción de un producto: párrafos separados por línea en blanco y viñetas «•». */
export function blocksToPlainText(blocks: Block[]): string {
  const parts: string[] = [];
  for (const block of blocks) {
    if (block.tag === "table") continue;
    if (block.tag === "ul" || block.tag === "ol") {
      const items = Array.from(block.html.matchAll(/<li(?:\s[^>]*)?>([\s\S]*?)<\/li>/g)).map((m) => htmlToText(m[1]));
      parts.push(items.filter(Boolean).map((t, i) => `${block.tag === "ol" ? `${i + 1}.` : "•"} ${t}`).join("\n"));
      continue;
    }
    if (block.text) parts.push(block.text);
  }
  return parts.join("\n\n").trim();
}

/**
 * Convierte en enlaces las frases indicadas, usando la primera vez que aparece cada una en el texto
 * (sin tocar lo que ya es un enlace ni los marcadores de imagen). Devuelve las frases que no se encontraron.
 */
export function applyLinkRules(html: string, rules: LinkRule[]): { html: string; notFound: LinkRule[] } {
  let result = html;
  const notFound: LinkRule[] = [];
  for (const rule of rules) {
    const needle = escapeHtml(rule.anchor);
    const tokens = result.split(/(<[^>]+>)/);
    let inAnchor = 0;
    let inToken = false;
    let done = false;
    for (let i = 0; i < tokens.length && !done; i++) {
      const t = tokens[i];
      if (t.startsWith("<")) {
        if (/^<a[\s>]/i.test(t)) inAnchor += 1;
        else if (/^<\/a>/i.test(t)) inAnchor = Math.max(0, inAnchor - 1);
        else if (/^<p[\s>]/i.test(t)) inToken = false;
        continue;
      }
      if (inAnchor > 0 || inToken) continue;
      if (/^\s*\[imagen:/i.test(t)) { inToken = true; continue; }
      const idx = t.toLowerCase().indexOf(needle.toLowerCase());
      if (idx === -1) continue;
      const original = t.slice(idx, idx + needle.length);
      tokens[i] = `${t.slice(0, idx)}<a href="${escapeHtml(rule.href)}">${original}</a>${t.slice(idx + needle.length)}`;
      done = true;
    }
    if (done) result = tokens.join("");
    else notFound.push(rule);
  }
  return { html: result, notFound };
}

export const IMAGE_TOKEN = /<p>\s*\[imagen:\s*([^\]|]+?)\s*(?:\|\s*([^\]]*?))?\s*\]\s*<\/p>/gi;

export function imageToken(file: string, caption: string): string {
  return `<p>[imagen: ${escapeHtml(file)}${caption ? ` | ${escapeHtml(caption)}` : ""}]</p>`;
}

/**
 * Inserta, antes o después del párrafo que contiene cierta frase, el marcador de una imagen.
 * Si la regla no dice dónde, o no se encuentra la frase, la imagen queda al final y se avisa.
 */
export function insertImageRules(
  parts: string[],
  rules: ImageRule[]
): { parts: string[]; atEnd: ImageRule[]; notFound: ImageRule[] } {
  const blocks = [...parts];
  const atEnd: ImageRule[] = [];
  const notFound: ImageRule[] = [];
  for (const rule of rules) {
    const token = imageToken(rule.file, rule.caption);
    if (!rule.mode || !rule.phrase) {
      blocks.push(token);
      atEnd.push(rule);
      continue;
    }
    const wanted = normalizeText(rule.phrase);
    const at = blocks.findIndex((b) => normalizeText(htmlToText(b)).includes(wanted));
    if (at === -1) {
      blocks.push(token);
      notFound.push(rule);
      continue;
    }
    blocks.splice(rule.mode === "before" ? at : at + 1, 0, token);
  }
  return { parts: blocks, atEnd, notFound };
}

export function seeAlsoHtml(items: SeeAlso[]): string {
  if (items.length === 0) return "";
  const links = items.map((i) => `<p><a href="${escapeHtml(i.href)}">${escapeHtml(i.label)}</a></p>`);
  return `<h3>Sigue leyendo</h3>\n${links.join("\n")}`;
}
