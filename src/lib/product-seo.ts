// SEO de los productos (libros y e-books) de la tienda.
// Reutiliza los límites y los tipos del SEO de artículos (src/lib/seo.ts) para que
// los dos formularios del panel de admin se comporten igual.

import { SEO_LIMITS, normalizeForMatch, type FaqItem, type SeoCheck } from "@/lib/seo";

/** Resume un texto a un largo máximo, cortando en una palabra completa y agregando «…». */
export function summarize(text: string, max: number = SEO_LIMITS.metaDescriptionIdeal): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.\-–—]+$/, "")}…`;
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

/** Palabras de la búsqueda que NO aparecen en el texto (sin importar acentos, mayúsculas ni orden). */
function missingKeywordWords(text: string, keyword: string): string[] {
  const have = new Set(wordsOf(text));
  const missing: string[] = [];
  for (const original of keyword.trim().split(/\s+/)) {
    const [normalized] = wordsOf(original);
    if (normalized && !have.has(normalized) && !missing.includes(original)) missing.push(original);
  }
  return missing;
}

// ---------------------------------------------------------------------------
// Lista de control SEO del producto (se recalcula en vivo en el panel de admin)
// ---------------------------------------------------------------------------

export type ProductSeoInput = {
  title: string;
  slug: string;
  description: string;
  audienceText: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  coverImage: string;
  coverImageAlt: string;
  galleryCount: number;
  highlightsCount: number;
  faqCount: number;
  tagsCount: number;
  hasPurchaseRoute: boolean;
};

export function analyzeProductSeo(input: ProductSeoInput): SeoCheck[] {
  const checks: SeoCheck[] = [];
  const keyword = normalizeForMatch(input.focusKeyword);
  const effectiveTitle = input.metaTitle.trim() || input.title.trim();
  const effectiveDescription = input.metaDescription.trim() || summarize(input.description);
  const firstParagraph = input.description.split(/\n\s*\n|\n/).find((p) => p.trim()) ?? input.description;
  const descriptionWords = input.description.split(/\s+/).filter(Boolean).length;

  // --- Palabra clave principal ---
  if (!keyword) {
    checks.push({
      id: "keyword",
      label: "Palabra clave principal",
      status: "todo",
      hint: "Escribí la búsqueda que querés posicionar (por ejemplo: «libro de astrología vida adulta») para activar el resto de los controles.",
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

    addKeywordCheck("kw-title", "Está en el título del producto (H1)", input.title);
    addKeywordCheck("kw-meta-title", "Está en el título que ve Google", effectiveTitle);
    addKeywordCheck("kw-meta-description", "Está en la descripción que ve Google", effectiveDescription);
    addKeywordCheck(
      "kw-slug",
      "Está en la URL (slug)",
      input.slug.replace(/-/g, " "),
      "No hace falta que sea idéntica, pero sí que incluya las palabras principales."
    );
    addKeywordCheck("kw-first-paragraph", "Está en el primer párrafo de la descripción", firstParagraph);
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

  // --- Contenido de la página del producto ---
  checks.push({
    id: "description-length",
    label: `Descripción del producto: ${descriptionWords} palabras`,
    status: descriptionWords >= 120 ? "ok" : "warn",
    hint:
      descriptionWords >= 120
        ? undefined
        : "Una descripción de 120 palabras o más le da a Google (y a quien compra) más para entender de qué trata el libro.",
  });

  checks.push({
    id: "audience",
    label: "«Para quién es esto» completo",
    status: input.audienceText.trim() ? "ok" : "warn",
    hint: input.audienceText.trim() ? undefined : "Ayuda a que la persona correcta se reconozca y a que Google entienda el público del libro.",
  });

  checks.push({
    id: "highlights",
    label: `Tarjetas «Qué vas a recibir»: ${input.highlightsCount}`,
    status: input.highlightsCount >= 3 ? "ok" : "warn",
    hint: input.highlightsCount >= 3 ? undefined : "Con al menos 3 tarjetas se ve completo qué incluye el libro.",
  });

  checks.push({
    id: "faq",
    label: `Preguntas frecuentes: ${input.faqCount}`,
    status: input.faqCount >= 3 ? "ok" : "warn",
    hint:
      input.faqCount >= 3
        ? undefined
        : "Con 3 o más preguntas reales (¿es PDF o papel?, ¿para qué nivel?) la página responde dudas de compra.",
  });

  checks.push({
    id: "tags",
    label: `Etiquetas: ${input.tagsCount}`,
    status: input.tagsCount >= 3 ? "ok" : "warn",
    hint: input.tagsCount >= 3 ? undefined : "Agregá 3 o más temas del libro (por ejemplo: Saturno, ciclos planetarios, astrología humanista).",
  });

  // --- Imágenes ---
  if (!input.coverImage.trim()) {
    checks.push({
      id: "cover",
      label: "Imagen de la tarjeta",
      status: "warn",
      hint: "Sin imagen, el producto se comparte en redes y en Google sin portada.",
    });
  } else {
    checks.push({
      id: "cover-alt",
      label: "Texto alternativo de la portada",
      status: input.coverImageAlt.trim() ? "ok" : "warn",
      hint: input.coverImageAlt.trim() ? undefined : "Describí la portada con palabras reales (si no lo completás, se usa «Portada del libro» + el título).",
    });
  }

  checks.push({
    id: "gallery",
    label: `Capturas del interior: ${input.galleryCount}`,
    status: input.galleryCount >= 3 ? "ok" : "warn",
    hint: input.galleryCount >= 3 ? undefined : "Con 3 o más capturas la persona ve qué va a leer antes de comprar.",
  });

  // --- Compra ---
  checks.push({
    id: "purchase",
    label: "Hay al menos una forma de comprar",
    status: input.hasPurchaseRoute ? "ok" : "warn",
    hint: input.hasPurchaseRoute ? undefined : "Cargá el precio en USD (PDF) o un link de Amazon (Kindle o libro físico).",
  });

  return checks;
}

// ---------------------------------------------------------------------------
// Datos estructurados (JSON-LD) de la página pública del producto
// ---------------------------------------------------------------------------

export type ProductJsonLdInput = {
  siteUrl: string;
  url: string;
  title: string;
  description: string;
  image: string | null;
  slug: string;
  priceArs: number | null;
  priceUsd?: number | null;
  keywords: string[];
  faq: FaqItem[];
};

export function buildProductJsonLd(input: ProductJsonLdInput) {
  const brand = { "@type": "Brand", name: "Zodiac Noir" };

  const product: Record<string, unknown> = {
    "@type": "Product",
    "@id": `${input.url}#producto`,
    name: input.title,
    description: input.description,
    url: input.url,
    sku: input.slug,
    image: input.image ? [input.image] : undefined,
    brand,
    category: "Libros de astrología",
    inLanguage: "es",
    keywords: input.keywords.length > 0 ? input.keywords.join(", ") : undefined,
    // Solo se declara precio cuando se vende el PDF directo (el precio de Amazon es texto libre y lo fija Amazon).
    offers:
      input.priceUsd || input.priceArs
        ? {
            "@type": "Offer",
            url: input.url,
            price: input.priceUsd ?? input.priceArs,
            priceCurrency: input.priceUsd ? "USD" : "ARS",
            availability: "https://schema.org/InStock",
            itemCondition: "https://schema.org/NewCondition",
          }
        : undefined,
  };

  const breadcrumbs = {
    "@type": "BreadcrumbList",
    "@id": `${input.url}#breadcrumbs`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: `${input.siteUrl}/` },
      { "@type": "ListItem", position: 2, name: "Tienda", item: `${input.siteUrl}/tienda` },
      { "@type": "ListItem", position: 3, name: input.title, item: input.url },
    ],
  };

  const graph: Record<string, unknown>[] = [product, breadcrumbs];

  // Las preguntas frecuentes solo se declaran si el lector las ve en la página.
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
