// Armado de lo que se va a importar (/admin/importar): junta el Word de instrucciones, el Word del texto y los
// archivos subidos (imágenes, PDF, video) en una lista de artículos y productos listos para revisar.
//
// No depende del navegador ni del servidor: recibe el HTML de cada Word ya leído y la lista de archivos, y
// devuelve datos. Por eso se puede probar sin abrir el panel.

import { CATEGORIES } from "@/lib/categories";
import { signs } from "@/data/signs";
import { slugify } from "@/lib/slugify";
import {
  IMAGE_TOKEN,
  applyLinkRules,
  blocksToArticleParts,
  blocksToPlainText,
  decodeEntities,
  firstLine,
  htmlToText,
  insertImageRules,
  normalizeText,
  parseBool,
  parseDateAR,
  parseFaqText,
  parseHighlights,
  parseImageRule,
  parseLinkRule,
  parseList,
  parsePriceText,
  parseSeeAlso,
  parseTemplate,
  seeAlsoHtml,
  splitBlocks,
  stripQuotes,
  type Block,
  type FaqPair,
  type Highlight,
  type ImageRule,
  type LinkRule,
} from "@/lib/import-template";

export type PickedMeta = { path: string; name: string; size: number };
export type ReadDoc = { path: string; html: string; warnings: string[] };
export type CategoryOption = { id: string; label: string };
export type FileRef = { path: string; name: string };

export type ImportItem = {
  key: string;
  /** Ruta del Word de instrucciones del que salió. */
  sourcePath: string;
  kind: "articulo" | "producto";
  title: string;
  slug: string;
  /** Artículo: valor de la categoría (por ejemplo «efemerides»). Producto: id de la categoría de la tienda. */
  category: string;
  categoryText: string;
  sign: string;
  excerpt: string;
  /** Artículo: HTML (puede traer imágenes incrustadas y marcadores de imagen). Producto: texto de la descripción. */
  body: string;
  priceUsd: string;
  isPremium: boolean;
  featuredProductSlug: string;
  /** «AAAA-MM-DDTHH:MM» en hora de Argentina, o vacío. */
  publishAt: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  coverImageAlt: string;
  tags: string[];
  faq: FaqPair[];
  highlights: Highlight[];
  audienceText: string;
  cover: FileRef | null;
  hero: FileRef | null;
  gallery: FileRef[];
  pdf: FileRef | null;
  video: FileRef | null;
  /** Imágenes que el texto pide con [imagen: archivo.jpg]. */
  bodyImages: FileRef[];
  /** Destinos internos de los enlaces (para comprobar que existan). */
  internalLinks: string[];
  /** Problemas de archivos (nombres que no se encontraron, tipos equivocados…). Bloquean la creación. */
  fileProblems: string[];
  warnings: string[];
  stats: { words: number; images: number; links: number; sections: number; faq: number };
};

// ---------------------------------------------------------------------------
// Archivos
// ---------------------------------------------------------------------------

export function dirOf(path: string): string {
  const i = path.lastIndexOf("/");
  return i === -1 ? "" : path.slice(0, i);
}

export function baseName(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1);
}

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i + 1).toLowerCase();
}

function stem(name: string): string {
  const i = name.lastIndexOf(".");
  return i === -1 ? name : name.slice(0, i);
}

export const IMAGE_EXT = ["jpg", "jpeg", "png", "webp", "gif"];
export const VIDEO_EXT = ["mp4", "m4v", "webm", "mov"];

type Resolved = { ref: FileRef | null; problem: string | null };

/** Busca por nombre un archivo mencionado en el Word: primero en la misma carpeta, después en todo lo subido. */
export function resolveFile(rawName: string, dir: string, files: PickedMeta[]): Resolved {
  const wanted = stripQuotes(rawName).replace(/\\/g, "/");
  if (!wanted) return { ref: null, problem: null };
  const wantedBase = normalizeText(baseName(wanted));
  const matches = (f: PickedMeta) => {
    const n = normalizeText(f.name);
    return n === wantedBase || normalizeText(stem(f.name)) === wantedBase;
  };
  const candidates = files.filter(matches);
  if (candidates.length === 0) {
    return { ref: null, problem: `No encontré el archivo «${wanted}» entre lo que subiste.` };
  }
  const sameDir = candidates.filter((f) => dirOf(f.path) === dir);
  const pool = sameDir.length > 0 ? sameDir : candidates;
  const exact = pool.filter((f) => normalizeText(f.name) === wantedBase);
  const finalPool = exact.length > 0 ? exact : pool;
  if (finalPool.length > 1) {
    return { ref: null, problem: `Hay ${finalPool.length} archivos llamados «${wanted}» y no sé cuál usar. Ponles nombres distintos.` };
  }
  const f = finalPool[0];
  return { ref: { path: f.path, name: f.name }, problem: null };
}

// ---------------------------------------------------------------------------
// Categorías y signos
// ---------------------------------------------------------------------------

function matchArticleCategory(text: string): string {
  const n = normalizeText(text);
  if (!n) return "";
  const hit = CATEGORIES.find((c) => normalizeText(c.label) === n || c.value === n || normalizeText(c.value.replace(/-/g, " ")) === n);
  return hit ? hit.value : "";
}

function matchSign(text: string): string {
  const n = normalizeText(text);
  if (!n) return "";
  return signs.find((s) => s.slug === n || normalizeText(s.name) === n)?.slug ?? "";
}

function matchStoreCategory(text: string, options: CategoryOption[]): string {
  const n = normalizeText(text.replace(/[›»/]/g, ">"));
  if (!n) return "";
  const last = n.split(">").pop()!.trim();
  const full = options.find((o) => normalizeText(o.label.replace(/[›»/]/g, ">")) === n);
  if (full) return full.id;
  const byLast = options.filter((o) => normalizeText(o.label.split("›").pop() ?? "") === last);
  return byLast.length === 1 ? byLast[0].id : byLast.length > 1 ? byLast[0].id : "";
}

// ---------------------------------------------------------------------------
// Armado
// ---------------------------------------------------------------------------

type ParsedDoc = { doc: ReadDoc; blocks: Block[]; parse: ReturnType<typeof parseTemplate> };

function oneLine(text: string | undefined): string {
  return (text ?? "").replace(/\s*\n\s*/g, " ").replace(/\s+/g, " ").trim();
}

function countWords(html: string): number {
  return htmlToText(html).split(/\s+/).filter(Boolean).length;
}

export function planImport(
  docs: ReadDoc[],
  files: PickedMeta[],
  storeCategories: CategoryOption[]
): { items: ImportItem[]; notes: string[] } {
  const parsed: ParsedDoc[] = docs.map((doc) => {
    const blocks = splitBlocks(doc.html);
    return { doc, blocks, parse: parseTemplate(blocks) };
  });
  const templates = parsed.filter((p) => p.parse.isTemplate);
  const others = parsed.filter((p) => !p.parse.isTemplate);
  const claimed = new Set<string>();
  const notes: string[] = [];
  const items: ImportItem[] = [];

  if (templates.length === 0) {
    notes.push(
      docs.length === 0
        ? "No encontré ningún archivo Word (.docx) entre lo que subiste."
        : "No encontré ningún Word de instrucciones. Debe tener líneas como «Tipo: Artículo» y «Título: …». Usa la plantilla."
    );
  }

  for (const t of templates) {
    const f = t.parse.fields;
    const warnings: string[] = [...t.parse.warnings, ...t.doc.warnings.map((w) => `${baseName(t.doc.path)}: ${w}`)];
    const fileProblems: string[] = [];
    const dir = dirOf(t.doc.path);
    const kind: ImportItem["kind"] = t.parse.kind ?? "articulo";
    if (!t.parse.kind) warnings.push("No encontré el tipo. Agrega la línea «Tipo: Artículo» o «Tipo: Producto».");

    const title = oneLine(f.titulo?.text);
    const slug = oneLine(f.slug?.text) ? slugify(oneLine(f.slug?.text)) : slugify(title);

    const findFile = (name: string, what: string, allowed?: string[]): FileRef | null => {
      const r = resolveFile(name, dir, files);
      if (r.problem) {
        fileProblems.push(`${what}: ${r.problem}`);
        return null;
      }
      if (r.ref && allowed && !allowed.includes(extOf(r.ref.name))) {
        fileProblems.push(`${what}: «${r.ref.name}» no es un archivo ${allowed.map((e) => e.toUpperCase()).join("/")}.`);
        return null;
      }
      return r.ref;
    };

    const cover = f.portada ? findFile(firstLine(f.portada), "Portada", IMAGE_EXT) : null;
    const hero = f.imagen_principal ? findFile(firstLine(f.imagen_principal), "Imagen principal", IMAGE_EXT) : null;
    const gallery = parseList(f.galeria?.text)
      .map((n) => findFile(n, "Galería", IMAGE_EXT))
      .filter((r): r is FileRef => r !== null);
    const pdf = f.pdf ? findFile(firstLine(f.pdf), "PDF", ["pdf"]) : null;
    const video = f.video ? findFile(firstLine(f.video), "Video", VIDEO_EXT) : null;

    // Texto principal: campo «Contenido»/«Descripción», o el otro Word (citado en «Texto:» o el único de la carpeta).
    const inlineField = kind === "articulo" ? f.contenido : f.descripcion ?? f.contenido;
    let bodyBlocks: Block[] = inlineField && inlineField.blocks.length > 0 ? inlineField.blocks : [];
    let textDocDir = dir;
    if (bodyBlocks.length === 0) {
      let textDoc: ParsedDoc | undefined;
      if (f.texto) {
        const wanted = normalizeText(baseName(stripQuotes(firstLine(f.texto)).replace(/\\/g, "/")));
        const cands = others.filter((o) => {
          const n = normalizeText(baseName(o.doc.path));
          return n === wanted || normalizeText(stem(baseName(o.doc.path))) === wanted;
        });
        textDoc = cands.find((o) => dirOf(o.doc.path) === dir) ?? cands[0];
        if (!textDoc) fileProblems.push(`Texto: no encontré el Word «${firstLine(f.texto)}» entre lo que subiste.`);
      } else {
        const sameDir = others.filter((o) => dirOf(o.doc.path) === dir && !claimed.has(o.doc.path));
        if (sameDir.length === 1) textDoc = sameDir[0];
        else if (sameDir.length > 1) fileProblems.push("Hay varios Word de texto en la carpeta: indica cuál con la línea «Texto: nombre.docx».");
      }
      if (textDoc) {
        claimed.add(textDoc.doc.path);
        bodyBlocks = textDoc.blocks;
        textDocDir = dirOf(textDoc.doc.path);
        for (const w of textDoc.doc.warnings) warnings.push(`${baseName(textDoc.doc.path)}: ${w}`);
      }
    }

    const internalLinks: string[] = [];
    const bodyImages: FileRef[] = [];
    let body = "";
    let stats = { words: 0, images: 0, links: 0, sections: 0, faq: 0 };

    if (kind === "articulo") {
      const conv = blocksToArticleParts(bodyBlocks);
      if (conv.tables > 0) {
        warnings.push(
          `El texto tiene ${conv.tables} tabla${conv.tables === 1 ? "" : "s"} escrita${conv.tables === 1 ? "" : "s"} en Word, y la web no las muestra. Conviértelas en imagen (como haces con las demás tablas).`
        );
      }
      const imageRules: ImageRule[] = [];
      for (const line of t.parse.repeated.imagen) {
        const rule = parseImageRule(line);
        if (rule) imageRules.push(rule);
        else warnings.push(`No entendí la línea «Imagen: ${line}».`);
      }
      const inserted = insertImageRules(conv.parts, imageRules);
      for (const r of inserted.atEnd) warnings.push(`La imagen «${r.file}» no dice dónde va: quedó al final del texto.`);
      for (const r of inserted.notFound) warnings.push(`No encontré la frase «${r.phrase}» para colocar la imagen «${r.file}»: quedó al final del texto.`);

      let html = inserted.parts.join("\n");

      const linkRules: LinkRule[] = [];
      for (const line of t.parse.repeated.enlace) {
        const rule = parseLinkRule(line);
        if (rule) linkRules.push(rule);
        else warnings.push(`No entendí la línea «Enlace: ${line}». Debe ser: «Enlace: frase del texto -> /destino».`);
      }
      const linked = applyLinkRules(html, linkRules);
      html = linked.html;
      for (const nf of linked.notFound) warnings.push(`No encontré la frase «${nf.anchor}» en el texto, así que no se agregó ese enlace.`);
      for (const r of linkRules) {
        if (r.href.startsWith("/") && !linked.notFound.includes(r)) internalLinks.push(r.href);
      }

      const seeAlso = parseSeeAlso(f.ver_tambien?.text);
      for (const bad of seeAlso.invalid) warnings.push(`No entendí la línea de «Ver también»: «${bad}».`);
      if (seeAlso.items.length > 0) {
        html = `${html}\n${seeAlsoHtml(seeAlso.items)}`;
        for (const i of seeAlso.items) if (i.href.startsWith("/")) internalLinks.push(i.href);
      }

      // Imágenes que el texto pide por nombre.
      const seen = new Set<string>();
      for (const m of html.matchAll(IMAGE_TOKEN)) {
        const name = decodeEntities(m[1]).trim();
        const key = normalizeText(name);
        if (seen.has(key)) continue;
        seen.add(key);
        const r = resolveFile(name, textDocDir, files).problem ? resolveFile(name, dir, files) : resolveFile(name, textDocDir, files);
        if (r.problem || !r.ref) {
          fileProblems.push(`Imagen del texto: ${r.problem ?? `no encontré «${name}».`}`);
        } else if (!IMAGE_EXT.includes(extOf(r.ref.name))) {
          fileProblems.push(`Imagen del texto: «${r.ref.name}» no es una imagen (JPG, PNG, WEBP o GIF).`);
        } else {
          bodyImages.push(r.ref);
        }
      }

      body = html;
      stats = {
        words: countWords(html),
        images: (html.match(/<img\b/gi) ?? []).length + (html.match(IMAGE_TOKEN) ?? []).length,
        links: (html.match(/<a\s/gi) ?? []).length,
        sections: (html.match(/<h2\b/gi) ?? []).length,
        faq: 0,
      };
      if (stats.words === 0) fileProblems.push("Texto: el artículo no tiene texto.");
    } else {
      body = blocksToPlainText(bodyBlocks);
      stats = { words: countWords(body), images: 0, links: 0, sections: 0, faq: 0 };
    }

    const faq = parseFaqText(f.faq?.text);
    stats.faq = faq.length;
    if (f.faq?.text?.trim() && faq.length === 0) warnings.push("No pude leer las preguntas frecuentes. Escríbelas como «P: …» y «R: …».");

    const publishText = oneLine(f.fecha?.text);
    const publishAt = parseDateAR(publishText) ?? "";
    if (publishText && !publishAt) warnings.push(`No entendí la fecha «${publishText}». Usa 2026-11-10 08:00 o 10/11/2026 08:00.`);

    const categoryText = oneLine(f.categoria?.text);
    let category = "";
    if (kind === "articulo") {
      category = matchArticleCategory(categoryText);
      if (categoryText && !category) warnings.push(`No reconocí la categoría «${categoryText}»: elígela en la lista.`);
      if (!categoryText) warnings.push("Falta la categoría: elígela en la lista.");
    } else {
      category = matchStoreCategory(categoryText, storeCategories);
      if (categoryText && !category) warnings.push(`No reconocí la categoría «${categoryText}»: elígela en la lista.`);
    }

    const signText = oneLine(f.signo?.text);
    const sign = matchSign(signText);
    if (signText && !sign) warnings.push(`No reconocí el signo «${signText}».`);

    const excerptRaw = oneLine(f.copete?.text);
    const excerpt = kind === "articulo" ? excerptRaw || oneLine(f.descripcion_seo?.text) : "";
    if (kind === "articulo" && !excerptRaw) {
      warnings.push(
        excerpt
          ? "No había copete: usé la descripción SEO. Cámbialo en el borrador si quieres."
          : "Falta el copete (el resumen que aparece bajo el título). Podrás escribirlo en el borrador."
      );
    }

    if (!cover) warnings.push("Sin portada: se compartirá en redes sin imagen.");
    if (kind === "articulo" && !oneLine(f.descripcion_seo?.text)) warnings.push("Sin descripción SEO: Google usará el copete.");
    if (kind === "producto" && !pdf && !f.pdf) warnings.push("Sin PDF: el producto se crea, pero nadie podrá descargarlo hasta que lo cargues.");

    items.push({
      key: t.doc.path,
      sourcePath: t.doc.path,
      kind,
      title,
      slug,
      category,
      categoryText,
      sign,
      excerpt,
      body,
      priceUsd: parsePriceText(firstLine(f.precio)),
      isPremium: parseBool(firstLine(f.premium)),
      featuredProductSlug: slugify(oneLine(f.producto_destacado?.text)),
      publishAt,
      metaTitle: oneLine(f.titulo_seo?.text),
      metaDescription: oneLine(f.descripcion_seo?.text),
      focusKeyword: oneLine(f.palabra_clave?.text),
      coverImageAlt: oneLine(f.alt_portada?.text),
      tags: parseList(f.etiquetas?.text),
      faq,
      highlights: parseHighlights(f.que_incluye?.text),
      audienceText: f.para_quien ? blocksToPlainText(f.para_quien.blocks) : "",
      cover,
      hero,
      gallery,
      pdf,
      video,
      bodyImages,
      internalLinks: Array.from(new Set(internalLinks)),
      fileProblems,
      warnings,
      stats,
    });
  }

  for (const o of others) {
    if (!claimed.has(o.doc.path) && templates.length > 0) {
      notes.push(`El Word «${baseName(o.doc.path)}» no se usó: no tiene instrucciones y ninguna instrucción lo cita.`);
    }
  }

  return { items, notes };
}

/** Direcciones (slugs) que aparecen en más de un elemento de la misma importación, separadas por tipo. */
export function findDuplicateSlugs(items: ImportItem[]): Set<string> {
  const seen = new Map<string, number>();
  const dup = new Set<string>();
  for (const it of items) {
    const key = `${it.kind}:${it.slug}`;
    if (!it.slug) continue;
    seen.set(key, (seen.get(key) ?? 0) + 1);
    if ((seen.get(key) ?? 0) > 1) dup.add(key);
  }
  return dup;
}

/** Qué le falta a un elemento para poder crearse como borrador. Se vuelve a calcular cada vez que se edita algo. */
export function validateItem(item: ImportItem): string[] {
  const errors = [...item.fileProblems];
  if (!item.title.trim()) errors.push("Falta el título.");
  if (!item.slug.trim()) errors.push("Falta la dirección (slug).");
  if (item.kind === "producto") {
    if (!item.body.trim()) errors.push("Falta la descripción del producto.");
    if (!item.priceUsd.trim() || !(Number(item.priceUsd.replace(",", ".")) > 0)) errors.push("Falta el precio en dólares.");
    if (!item.category) errors.push("Elige la categoría de la tienda.");
  }
  return errors;
}
