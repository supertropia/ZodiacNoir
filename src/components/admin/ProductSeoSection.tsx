"use client";

import { SEO_LIMITS, parseTags, type FaqItem, type SeoCheck } from "@/lib/seo";
import { analyzeProductSeo, summarize } from "@/lib/product-seo";
import { toPlainText } from "@/components/store/FormattedText";

// Los campos del formulario de producto que esta sección lee y modifica.
export type ProductSeoValues = {
  title: string;
  slug: string;
  description: string;
  audienceText: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  coverImage: string;
  coverImageAlt: string;
  tags: string;
  faq: FaqItem[];
  galleryImages: string[];
  contentHighlights: { title: string; description: string }[];
  priceArs: number | null;
  amazonKindleUrl: string;
  amazonPaperbackUrl: string;
};

const inputClass =
  "w-full rounded-lg border border-gold/25 bg-transparent px-4 py-2.5 font-ui text-sm text-gold-pale placeholder:text-gold-dim/60 focus:border-gold focus:outline-none";
const labelClass = "mb-1.5 block font-ui text-xs uppercase tracking-wide text-gold-dim";

/** Pregunta frecuente vacía o incompleta: no se guarda, así que se avisa antes de enviar. */
export function hasIncompleteFaq(faq: FaqItem[]): boolean {
  return faq.some((f) => !f.question.trim() || !f.answer.trim());
}

export function ProductSeoSection({
  values,
  onChange,
}: {
  values: ProductSeoValues;
  onChange: (patch: Partial<ProductSeoValues>) => void;
}) {
  const plainDescription = toPlainText(values.description);
  const fallbackDescription = summarize(plainDescription);
  const tags = parseTags(values.tags);

  const checks = analyzeProductSeo({
    title: values.title,
    slug: values.slug,
    description: plainDescription,
    audienceText: values.audienceText,
    metaTitle: values.metaTitle,
    metaDescription: values.metaDescription,
    focusKeyword: values.focusKeyword,
    coverImage: values.coverImage,
    coverImageAlt: values.coverImageAlt,
    galleryCount: values.galleryImages.length,
    highlightsCount: values.contentHighlights.filter((h) => h.title.trim()).length,
    faqCount: values.faq.filter((f) => f.question.trim() && f.answer.trim()).length,
    tagsCount: tags.length,
    hasPurchaseRoute: Boolean(values.priceArs) || Boolean(values.amazonKindleUrl.trim()) || Boolean(values.amazonPaperbackUrl.trim()),
  });

  const shownTitleLength = (values.metaTitle || values.title).length;
  const shownDescriptionLength = (values.metaDescription || fallbackDescription).length;

  const setFaqItem = (index: number, field: keyof FaqItem, value: string) =>
    onChange({ faq: values.faq.map((item, i) => (i === index ? { ...item, [field]: value } : item)) });
  const addFaqItem = () => {
    if (values.faq.length >= SEO_LIMITS.faqMaxItems) return;
    onChange({ faq: [...values.faq, { question: "", answer: "" }] });
  };
  const removeFaqItem = (index: number) => onChange({ faq: values.faq.filter((_, i) => i !== index) });

  return (
    <section aria-labelledby="product-seo-heading" className="space-y-6 rounded-xl border border-gold/25 bg-noir-surface2/30 p-5">
      <div>
        <h2 id="product-seo-heading" className="font-display text-xl text-gold-pale">
          Posicionamiento en Google (SEO)
        </h2>
        <p className="mt-1 font-ui text-xs text-gold-dim">
          Todo lo de esta sección es opcional: si algo queda vacío, la web usa el título y la descripción del producto.
          Estos campos no se ven dentro de la ficha; son lo que lee Google y lo que aparece al compartir el libro en redes.
          Cada libro tiene su propia página en <strong>/tienda/{values.slug || "nombre-del-libro"}</strong>, que es la que Google muestra.
        </p>
      </div>

      <div>
        <label className={labelClass} htmlFor="focusKeyword">Palabra clave principal</label>
        <input
          id="focusKeyword"
          className={inputClass}
          maxLength={SEO_LIMITS.focusKeywordHard}
          placeholder="Ej.: libro de astrología vida adulta"
          value={values.focusKeyword}
          onChange={(e) => onChange({ focusKeyword: e.target.value })}
        />
        <p className="mt-1.5 font-ui text-xs text-gold-dim">
          La búsqueda exacta que querés posicionar. No se publica: solo activa la lista de control de más abajo.
        </p>
      </div>

      <div>
        <label className={labelClass} htmlFor="metaTitle">Título SEO (lo que se ve en Google)</label>
        <input
          id="metaTitle"
          className={inputClass}
          maxLength={SEO_LIMITS.metaTitleHard}
          placeholder={values.title || "Si lo dejás vacío se usa el título del producto"}
          value={values.metaTitle}
          onChange={(e) => onChange({ metaTitle: e.target.value })}
        />
        <p className={`mt-1.5 font-ui text-xs ${shownTitleLength > SEO_LIMITS.metaTitleIdeal ? "text-wine-bright" : "text-gold-dim"}`}>
          {shownTitleLength} / {SEO_LIMITS.metaTitleIdeal} caracteres recomendados. Si lo completás, se usa tal cual
          (no se agrega «· Zodiac Noir» al final).
        </p>
      </div>

      <div>
        <label className={labelClass} htmlFor="metaDescription">Descripción SEO (el texto bajo el título en Google)</label>
        <textarea
          id="metaDescription"
          rows={3}
          className={inputClass}
          maxLength={SEO_LIMITS.metaDescriptionHard}
          placeholder={fallbackDescription || "Si la dejás vacía se usa el comienzo de la descripción del producto"}
          value={values.metaDescription}
          onChange={(e) => onChange({ metaDescription: e.target.value })}
        />
        <p
          className={`mt-1.5 font-ui text-xs ${
            shownDescriptionLength > SEO_LIMITS.metaDescriptionIdeal ? "text-wine-bright" : "text-gold-dim"
          }`}
        >
          {shownDescriptionLength} caracteres. Ideal: entre {SEO_LIMITS.metaDescriptionMin} y {SEO_LIMITS.metaDescriptionIdeal}.
        </p>
      </div>

      <GooglePreview
        slug={values.slug}
        title={values.metaTitle || values.title}
        description={values.metaDescription || fallbackDescription}
      />

      <div>
        <label className={labelClass} htmlFor="coverImageAlt">Texto alternativo de la portada</label>
        <input
          id="coverImageAlt"
          className={inputClass}
          maxLength={SEO_LIMITS.altHard}
          placeholder="Ej.: Portada del libro Astrología de la Vida Adulta, con un atardecer sobre órbitas planetarias"
          value={values.coverImageAlt}
          onChange={(e) => onChange({ coverImageAlt: e.target.value })}
        />
        <p className="mt-1.5 font-ui text-xs text-gold-dim">
          Describe la imagen con palabras reales. Lo leen Google (búsqueda de imágenes) y los lectores de pantalla.
          Si lo dejás vacío se usa «Portada del libro» + el título.
        </p>
      </div>

      <div>
        <label className={labelClass} htmlFor="tags">Etiquetas (separadas por coma)</label>
        <input
          id="tags"
          className={inputClass}
          placeholder="Ej.: astrología humanista, retorno de Saturno, ciclos planetarios, vida adulta"
          value={values.tags}
          onChange={(e) => onChange({ tags: e.target.value })}
        />
        <p className="mt-1.5 font-ui text-xs text-gold-dim">
          Hasta {SEO_LIMITS.tagsMaxCount}. Se publican como palabras clave del libro en los datos estructurados.
          {tags.length > 0 && ` Llevás ${tags.length}.`}
        </p>
      </div>

      <div>
        <p className={labelClass}>Preguntas frecuentes (opcional)</p>
        <p className="mb-3 font-ui text-xs text-gold-dim">
          Se muestran en la página del libro, visibles para quien compra, y se declaran a Google como FAQPage.
          Usá dudas reales de compra: «¿Es PDF o papel?», «¿Necesito saber astrología?». Máximo {SEO_LIMITS.faqMaxItems}.
        </p>
        <div className="space-y-4">
          {values.faq.map((item, index) => (
            <div key={index} className="space-y-2 rounded-lg border border-gold/20 p-3">
              <label className="block font-ui text-xs text-gold-dim" htmlFor={`faq-q-${index}`}>
                Pregunta {index + 1}
              </label>
              <input
                id={`faq-q-${index}`}
                className={inputClass}
                maxLength={SEO_LIMITS.faqQuestionHard}
                value={item.question}
                onChange={(e) => setFaqItem(index, "question", e.target.value)}
              />
              <label className="block font-ui text-xs text-gold-dim" htmlFor={`faq-a-${index}`}>
                Respuesta
              </label>
              <textarea
                id={`faq-a-${index}`}
                rows={3}
                className={inputClass}
                maxLength={SEO_LIMITS.faqAnswerHard}
                value={item.answer}
                onChange={(e) => setFaqItem(index, "answer", e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeFaqItem(index)}
                className="font-ui text-xs uppercase tracking-wide text-wine-bright underline hover:text-gold"
              >
                Quitar esta pregunta
              </button>
            </div>
          ))}
        </div>
        {values.faq.length < SEO_LIMITS.faqMaxItems && (
          <button
            type="button"
            onClick={addFaqItem}
            className="focus-ring mt-3 rounded-full border border-dashed border-gold/40 px-4 py-2 font-ui text-xs uppercase tracking-wide text-gold transition hover:bg-gold/10"
          >
            + Agregar pregunta
          </button>
        )}
        {hasIncompleteFaq(values.faq) && (
          <p className="mt-2 font-ui text-xs text-wine-bright">
            Hay preguntas sin pregunta o sin respuesta: las incompletas no se guardan.
          </p>
        )}
      </div>

      <SeoChecklist checks={checks} />
    </section>
  );
}

/** Simulación de cómo se verá el resultado en Google (los textos largos se cortan con «…»). */
function GooglePreview({ slug, title, description }: { slug: string; title: string; description: string }) {
  const shownTitle =
    title.length > SEO_LIMITS.metaTitleIdeal ? `${title.slice(0, SEO_LIMITS.metaTitleIdeal).trimEnd()}…` : title;
  const shownDescription =
    description.length > SEO_LIMITS.metaDescriptionIdeal
      ? `${description.slice(0, SEO_LIMITS.metaDescriptionIdeal).trimEnd()}…`
      : description;

  return (
    <div className="rounded-lg border border-gold/20 bg-noir-bg/60 p-4">
      <p className="mb-3 font-ui text-xs uppercase tracking-wide text-gold-dim">Así se vería en Google</p>
      <p className="truncate font-ui text-xs text-gold-dim">zodiacnoirweb.com › tienda › {slug || "…"}</p>
      <p className="mt-1 font-ui text-lg leading-snug text-[#8AB4F8]">{shownTitle || "Título del producto"}</p>
      <p className="mt-1 font-ui text-sm leading-snug text-gold-pale/80">
        {shownDescription || "Acá aparecerá la descripción del producto."}
      </p>
    </div>
  );
}

const CHECK_MARK: Record<SeoCheck["status"], { symbol: string; className: string; label: string }> = {
  ok: { symbol: "✓", className: "text-green-400", label: "Correcto" },
  warn: { symbol: "!", className: "text-gold", label: "Mejorable" },
  todo: { symbol: "○", className: "text-gold-dim", label: "Pendiente" },
};

/** Lista de control en vivo: se recalcula en cada cambio del formulario. */
function SeoChecklist({ checks }: { checks: SeoCheck[] }) {
  const okCount = checks.filter((c) => c.status === "ok").length;
  return (
    <div className="rounded-lg border border-gold/20 bg-noir-bg/60 p-4">
      <p className="font-ui text-xs uppercase tracking-wide text-gold-dim">
        Lista de control SEO · {okCount} de {checks.length} en orden
      </p>
      <ul className="mt-3 space-y-2">
        {checks.map((check) => {
          const mark = CHECK_MARK[check.status];
          return (
            <li key={check.id} className="flex gap-3 font-ui text-sm text-gold-pale/90">
              <span aria-label={mark.label} role="img" className={`w-4 shrink-0 text-center font-semibold ${mark.className}`}>
                {mark.symbol}
              </span>
              <span>
                {check.label}
                {check.hint && <span className="block text-xs text-gold-dim">{check.hint}</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
