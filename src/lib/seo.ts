// Todo lo relacionado con el SEO de los artículos vive en este archivo:
// - los límites de largo recomendados por Google,
// - la validación de los campos SEO que llegan desde el panel de admin,
// - la lista de control en vivo que se muestra mientras se escribe,
// - el armado de los datos estructurados (JSON-LD) de la página pública.

export const SEO_LIMITS = {
  // Google corta el título alrededor de los 580 px, que equivale a ~60 caracteres.
  metaTitleIdeal: 60,
  metaTitleHard: 120,
  // La descripción ideal se ve completa en celular y escritorio.
  metaDescriptionMin: 120,
  metaDescriptionIdeal: 155,
  metaDescriptionHard: 320,
  focusKeywordHard: 120,
  altHard: 200,
  tagHard: 40,
  tagsMaxCount: 15,
  faqMaxItems: 10,
  faqQuestionHard: 200,
  faqAnswerHard: 1500,
} as const;

export type FaqItem = { question: string; answer: string };

export type SeoFields = {
  metaTitle: string | null;
  metaDescription: string | null;
  focusKeyword: string | null;
  coverImageAlt: string | null;
  tags: string[];
  faq: FaqItem[];
};

// ---------------------------------------------------------------------------
// Lectura y validación de campos
// ---------------------------------------------------------------------------

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

/** Acepta un texto separado por comas o una lista; devuelve etiquetas limpias y sin repetir. */
export function parseTags(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(",") : [];
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const part of parts) {
    const tag = cleanText(part);
    const key = tag.toLowerCase();
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
  }
  return tags;
}

/** Convierte lo guardado en la base de datos (JSON) en una lista segura de preguntas y respuestas. */
export function parseFaq(raw: unknown): FaqItem[] {
  if (!Array.isArray(raw)) return [];
  const items: FaqItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const question = cleanText((entry as Record<string, unknown>).question);
    const answer = cleanText((entry as Record<string, unknown>).answer);
    if (question && answer) items.push({ question, answer });
  }
  return items;
}

/**
 * Valida y limpia los campos SEO que llegan desde el formulario.
 * Los vacíos se guardan como null (la web usa entonces el título y el copete).
 */
export function normalizeSeoFields(
  body: Record<string, unknown>
): { ok: true; data: SeoFields } | { ok: false; error: string } {
  const metaTitle = cleanText(body.metaTitle);
  const metaDescription = cleanText(body.metaDescription);
  const focusKeyword = cleanText(body.focusKeyword);
  const coverImageAlt = cleanText(body.coverImageAlt);
  const tags = parseTags(body.tags);
  const faq = parseFaq(body.faq);

  if (metaTitle.length > SEO_LIMITS.metaTitleHard) {
    return { ok: false, error: `El título SEO es demasiado largo (máximo ${SEO_LIMITS.metaTitleHard} caracteres).` };
  }
  if (metaDescription.length > SEO_LIMITS.metaDescriptionHard) {
    return {
      ok: false,
      error: `La descripción SEO es demasiado larga (máximo ${SEO_LIMITS.metaDescriptionHard} caracteres).`,
    };
  }
  if (focusKeyword.length > SEO_LIMITS.focusKeywordHard) {
    return { ok: false, error: "La palabra clave principal es demasiado larga." };
  }
  if (coverImageAlt.length > SEO_LIMITS.altHard) {
    return {
      ok: false,
      error: `El texto alternativo de la portada es demasiado largo (máximo ${SEO_LIMITS.altHard} caracteres).`,
    };
  }
  if (tags.length > SEO_LIMITS.tagsMaxCount) {
    return { ok: false, error: `Hay demasiadas etiquetas (máximo ${SEO_LIMITS.tagsMaxCount}).` };
  }
  if (tags.some((t) => t.length > SEO_LIMITS.tagHard)) {
    return { ok: false, error: `Cada etiqueta puede tener hasta ${SEO_LIMITS.tagHard} caracteres.` };
  }
  if (faq.length > SEO_LIMITS.faqMaxItems) {
    return { ok: false, error: `Hay demasiadas preguntas frecuentes (máximo ${SEO_LIMITS.faqMaxItems}).` };
  }
  if (faq.some((f) => f.question.length > SEO_LIMITS.faqQuestionHard || f.answer.length > SEO_LIMITS.faqAnswerHard)) {
    return { ok: false, error: "Alguna pregunta frecuente o su respuesta es demasiado larga." };
  }

  return {
    ok: true,
    data: {
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      focusKeyword: focusKeyword || null,
      coverImageAlt: coverImageAlt || null,
      tags,
      faq,
    },
  };
}

// ---------------------------------------------------------------------------
// Lista de control SEO (se usa en el panel de admin, mientras se escribe)
// ---------------------------------------------------------------------------

export type SeoCheckStatus = "ok" | "warn" | "todo";
export type SeoCheck = { id: string; label: string; status: SeoCheckStatus; hint?: string };

/** Minúsculas y sin acentos, para comparar "Astrología" con "astrologia". */
export function normalizeForMatch(text: string): string {
  return text
    .normalize("NFD")
    .split("")
    // Quita las marcas de acento que separó normalize("NFD").
    .filter((ch) => ch.charCodeAt(0) < 0x300 || ch.charCodeAt(0) > 0x36f)
    .join("")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// Palabras vacías que no cuentan al comparar una búsqueda con un texto.
const STOPWORDS = new Set([
  "de", "del", "la", "las", "el", "los", "y", "e", "o", "u", "en", "a", "al", "un", "una", "unos", "unas",
  "que", "para", "con", "por", "se", "su", "sus", "lo", "es",
]);

function wordsOf(text: string): string[] {
  return normalizeForMatch(text)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w));
}

/**
 * Devuelve las palabras de la búsqueda que NO aparecen en el texto (sin importar acentos,
 * mayúsculas ni el orden). Lista vacía = el texto contiene toda la búsqueda.
 */
function missingKeywordWords(text: string, keyword: string): string[] {
  const have = new Set(wordsOf(text));
  const missing: string[] = [];
  for (const original of keyword.trim().split(/\s+/)) {
    const [normalized] = wordsOf(original);
    if (normalized && !have.has(normalized) && !missing.includes(original)) missing.push(original);
  }
  return missing;
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function matchAll(html: string, re: RegExp): string[] {
  return Array.from(html.matchAll(re)).map((m) => m[1] ?? "");
}

export type SeoAnalysisInput = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  coverImage: string;
  coverImageAlt: string;
};

export function analyzeArticleSeo(input: SeoAnalysisInput): SeoCheck[] {
  const checks: SeoCheck[] = [];
  const keyword = normalizeForMatch(input.focusKeyword);
  const effectiveTitle = input.metaTitle.trim() || input.title.trim();
  const effectiveDescription = input.metaDescription.trim() || input.excerpt.trim();
  const html = input.content || "";

  const h2Texts = matchAll(html, /<h2[^>]*>([\s\S]*?)<\/h2>/gi).map(stripTags);
  const paragraphs = matchAll(html, /<p[^>]*>([\s\S]*?)<\/p>/gi).map(stripTags).filter(Boolean);
  const firstParagraph = paragraphs[0] ?? "";
  const hrefs = matchAll(html, /href="([^"]+)"/gi);
  const internalLinks = hrefs.filter((h) => h.startsWith("/") || h.includes("zodiacnoirweb.com"));
  const imgTags = html.match(/<img\b[^>]*>/gi) ?? [];
  const imgsWithoutAlt = imgTags.filter((tag) => {
    const alt = tag.match(/\balt="([^"]*)"/i);
    return !alt || alt[1].trim() === "";
  });
  const wordCount = stripTags(html).split(/\s+/).filter(Boolean).length;

  // --- Palabra clave principal ---
  if (!keyword) {
    checks.push({
      id: "keyword",
      label: "Palabra clave principal",
      status: "todo",
      hint: "Escribí la búsqueda que querés posicionar (por ejemplo: «elecciones brasil 2026») para activar el resto de los controles.",
    });
  } else {
    checks.push({ id: "keyword", label: "Palabra clave principal definida", status: "ok" });

    const addKeywordCheck = (id: string, label: string, text: string, extraHint?: string) => {
      const missing = missingKeywordWords(text, input.focusKeyword);
      checks.push({
        id,
        label,
        status: missing.length === 0 ? "ok" : "warn",
        hint: missing.length === 0 ? undefined : `Falta: ${missing.join(", ")}.${extraHint ? ` ${extraHint}` : ""}`,
      });
    };

    addKeywordCheck(
      "kw-title",
      "Está en el título del artículo (H1)",
      input.title,
      "Conviene que el título empiece con la búsqueda y deje el enfoque astrológico para después."
    );
    addKeywordCheck("kw-meta-title", "Está en el título que ve Google", effectiveTitle);
    addKeywordCheck("kw-meta-description", "Está en la descripción que ve Google", effectiveDescription);
    addKeywordCheck(
      "kw-slug",
      "Está en la URL (slug)",
      input.slug.replace(/-/g, " "),
      "No hace falta que sea idéntica, pero sí que incluya las palabras principales."
    );
    addKeywordCheck("kw-first-paragraph", "Está en el primer párrafo", firstParagraph);
    addKeywordCheck(
      "kw-h2",
      "Aparece en algún subtítulo (H2)",
      h2Texts.join(" "),
      "Usá la búsqueda, o una variante cercana, en al menos un subtítulo."
    );
  }

  // --- Lo que ve Google ---
  const titleLength = effectiveTitle.length;
  checks.push({
    id: "meta-title-length",
    label: `Título SEO: ${titleLength} caracteres`,
    status: titleLength === 0 ? "todo" : titleLength <= SEO_LIMITS.metaTitleIdeal ? "ok" : "warn",
    hint:
      titleLength > SEO_LIMITS.metaTitleIdeal
        ? `Pasa de ${SEO_LIMITS.metaTitleIdeal}: Google lo va a cortar con «…». Dejá la búsqueda al principio.`
        : undefined,
  });

  const descLength = effectiveDescription.length;
  checks.push({
    id: "meta-description-length",
    label: `Descripción SEO: ${descLength} caracteres`,
    status:
      descLength === 0
        ? "todo"
        : descLength >= SEO_LIMITS.metaDescriptionMin && descLength <= SEO_LIMITS.metaDescriptionIdeal
          ? "ok"
          : "warn",
    hint:
      descLength > SEO_LIMITS.metaDescriptionIdeal
        ? `Pasa de ${SEO_LIMITS.metaDescriptionIdeal}: Google la va a cortar.`
        : descLength > 0 && descLength < SEO_LIMITS.metaDescriptionMin
          ? `Es corta: aprovechá hasta ${SEO_LIMITS.metaDescriptionIdeal} caracteres para convencer de hacer clic.`
          : undefined,
  });

  // --- Estructura y contenido ---
  checks.push({
    id: "h2-count",
    label: `Subtítulos (H2): ${h2Texts.length}`,
    status: h2Texts.length >= 3 ? "ok" : "warn",
    hint: h2Texts.length >= 3 ? undefined : "Un artículo largo se entiende mejor con al menos 3 secciones tituladas.",
  });

  checks.push({
    id: "word-count",
    label: `Extensión: ${wordCount} palabras`,
    status: wordCount >= 800 ? "ok" : "warn",
    hint: wordCount >= 800 ? undefined : "Los artículos de menos de ~800 palabras suelen tener más dificultad para posicionar.",
  });

  checks.push({
    id: "internal-links",
    label: `Enlaces internos: ${internalLinks.length}`,
    status: internalLinks.length >= 1 ? "ok" : "warn",
    hint: internalLinks.length >= 1 ? undefined : "Enlazá a otro artículo o producto con «+ Enlace interno»: ayuda a Google a entender el sitio.",
  });

  // --- Imágenes ---
  if (!input.coverImage.trim()) {
    checks.push({
      id: "cover",
      label: "Imagen de portada",
      status: "warn",
      hint: "Sin portada, el artículo se comparte en redes sin imagen.",
    });
  } else {
    checks.push({
      id: "cover-alt",
      label: "Texto alternativo de la portada",
      status: input.coverImageAlt.trim() ? "ok" : "warn",
      hint: input.coverImageAlt.trim() ? undefined : "Describí la imagen con palabras reales (si no lo completás, se usa el título).",
    });
  }

  if (imgTags.length > 0) {
    checks.push({
      id: "body-img-alt",
      label: `Imágenes dentro del texto con descripción: ${imgTags.length - imgsWithoutAlt.length} de ${imgTags.length}`,
      status: imgsWithoutAlt.length === 0 ? "ok" : "warn",
      hint:
        imgsWithoutAlt.length === 0
          ? undefined
          : "Escribí un pie de foto debajo de la imagen, o usá el botón «Descripción de imagen (alt)» de la barra del editor.",
    });
  }

  return checks;
}

// ---------------------------------------------------------------------------
// Datos estructurados (JSON-LD) de la página pública del artículo
// ---------------------------------------------------------------------------

export type ArticleJsonLdInput = {
  siteUrl: string;
  url: string;
  title: string;
  description: string;
  image: string | null;
  datePublished: Date;
  dateModified: Date;
  categoryLabel: string;
  keywords: string[];
  wordCount: number;
  isPremium: boolean;
  faq: FaqItem[];
};

export function buildArticleJsonLd(input: ArticleJsonLdInput) {
  const brand = { "@type": "Organization", name: "Zodiac Noir", url: input.siteUrl };

  const article: Record<string, unknown> = {
    "@type": "Article",
    "@id": `${input.url}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": input.url },
    // Google recomienda titulares de hasta 110 caracteres.
    headline: input.title.length > 110 ? `${input.title.slice(0, 107).trimEnd()}…` : input.title,
    description: input.description,
    image: input.image ? [input.image] : undefined,
    datePublished: input.datePublished.toISOString(),
    dateModified: input.dateModified.toISOString(),
    author: brand,
    publisher: brand,
    inLanguage: "es",
    articleSection: input.categoryLabel,
    keywords: input.keywords.length > 0 ? input.keywords.join(", ") : undefined,
    wordCount: input.wordCount > 0 ? input.wordCount : undefined,
    isAccessibleForFree: !input.isPremium,
  };

  const breadcrumbs = {
    "@type": "BreadcrumbList",
    "@id": `${input.url}#breadcrumbs`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: `${input.siteUrl}/` },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${input.siteUrl}/blog` },
      { "@type": "ListItem", position: 3, name: input.title, item: input.url },
    ],
  };

  const graph: Record<string, unknown>[] = [article, breadcrumbs];

  // Las preguntas frecuentes solo se declaran si el lector las puede ver en la página.
  if (input.faq.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${input.url}#faq`,
      mainEntity: input.faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

/** JSON listo para ir dentro de <script type="application/ld+json">; escapa "<" para que nada cierre la etiqueta. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\" + "u003c");
}
