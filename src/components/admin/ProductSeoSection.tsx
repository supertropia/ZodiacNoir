"use client";

import type { ReactNode } from "react";
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

// Campos de la sección SEO: más grandes, con fondo propio y borde marcado para distinguirlos a simple vista
// (el mismo estilo que la sección SEO de los artículos del blog).
const seoInputClass =
  "w-full rounded-lg border-2 border-gold/60 bg-noir-bg px-4 py-3 font-ui text-base text-gold-pale placeholder:text-gold-dim/70 focus:border-gold-bright focus:outline-none focus:ring-4 focus:ring-gold/25";

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

  const setFaqItem = (index: number, field: keyof FaqItem, value: string) =>
    onChange({ faq: values.faq.map((item, i) => (i === index ? { ...item, [field]: value } : item)) });
  const addFaqItem = () => {
    if (values.faq.length >= SEO_LIMITS.faqMaxItems) return;
    onChange({ faq: [...values.faq, { question: "", answer: "" }] });
  };
  const removeFaqItem = (index: number) => onChange({ faq: values.faq.filter((_, i) => i !== index) });

  return (
    <section
      aria-labelledby="product-seo-heading"
      className="overflow-hidden rounded-2xl border-2 border-gold/60 bg-noir-surface2/40 shadow-sm"
    >
      <div className="border-b-2 border-gold/40 bg-noir-surface2 px-5 py-5 sm:px-6">
        <p className="font-ui text-xs font-semibold uppercase tracking-widest text-gold">Datos para Google y redes</p>
        <h2 id="product-seo-heading" className="mt-1 font-display text-2xl text-gold-pale">
          Posicionamiento en Google (SEO)
        </h2>
        <p className="mt-2 font-ui text-sm leading-relaxed text-gold-pale/85">
          Todo lo de esta sección es opcional: si algo queda vacío, la web usa el título y la descripción del producto.
          Estos campos no se ven dentro de la ficha; son lo que lee Google y lo que aparece al compartir el libro en redes.
          Cada libro tiene su propia página en <strong>/tienda/{values.slug || "nombre-del-libro"}</strong>, que es la que Google muestra.
        </p>
      </div>

      <div className="space-y-5 p-4 sm:p-6">
        <SeoField
          step={1}
          htmlFor="focusKeyword"
          label="Palabra clave principal"
          help="La búsqueda exacta que querés posicionar. No se publica: solo activa la lista de control de más abajo."
        >
          <input
            id="focusKeyword"
            className={seoInputClass}
            maxLength={SEO_LIMITS.focusKeywordHard}
            placeholder="Ej.: libro de astrología vida adulta"
            value={values.focusKeyword}
            onChange={(e) => onChange({ focusKeyword: e.target.value })}
          />
        </SeoField>

        <SeoField
          step={2}
          htmlFor="metaTitle"
          label="Título SEO (lo que se ve en Google)"
          help="Es el título azul que aparece en los resultados de búsqueda."
        >
          <input
            id="metaTitle"
            className={seoInputClass}
            maxLength={SEO_LIMITS.metaTitleHard}
            placeholder={values.title || "Si lo dejás vacío se usa el título del producto"}
            value={values.metaTitle}
            onChange={(e) => onChange({ metaTitle: e.target.value })}
          />
          <CharCounter
            current={(values.metaTitle || values.title).length}
            limit={SEO_LIMITS.metaTitleIdeal}
            text="caracteres recomendados. Si lo completás, se usa tal cual (no se agrega «· Zodiac Noir» al final)."
          />
        </SeoField>

        <SeoField
          step={3}
          htmlFor="metaDescription"
          label="Descripción SEO (el texto bajo el título en Google)"
          help="Es el resumen gris que aparece debajo del título en los resultados."
        >
          <textarea
            id="metaDescription"
            rows={3}
            className={seoInputClass}
            maxLength={SEO_LIMITS.metaDescriptionHard}
            placeholder={fallbackDescription || "Si la dejás vacía se usa el comienzo de la descripción del producto"}
            value={values.metaDescription}
            onChange={(e) => onChange({ metaDescription: e.target.value })}
          />
          <CharCounter
            current={(values.metaDescription || fallbackDescription).length}
            limit={SEO_LIMITS.metaDescriptionIdeal}
            text={`caracteres. Ideal: entre ${SEO_LIMITS.metaDescriptionMin} y ${SEO_LIMITS.metaDescriptionIdeal}.`}
          />
        </SeoField>

        <GooglePreview
          slug={values.slug}
          title={values.metaTitle || values.title}
          description={values.metaDescription || fallbackDescription}
        />

        <SeoField
          step={4}
          htmlFor="coverImageAlt"
          label="Texto alternativo de la portada"
          help="Describe la imagen con palabras reales. Lo leen Google (búsqueda de imágenes) y los lectores de pantalla. Si lo dejás vacío se usa «Portada del libro» + el título."
        >
          <input
            id="coverImageAlt"
            className={seoInputClass}
            maxLength={SEO_LIMITS.altHard}
            placeholder="Ej.: Portada del libro Astrología de la Vida Adulta, con un atardecer sobre órbitas planetarias"
            value={values.coverImageAlt}
            onChange={(e) => onChange({ coverImageAlt: e.target.value })}
          />
        </SeoField>

        <SeoField
          step={5}
          htmlFor="tags"
          label="Etiquetas (separadas por coma)"
          help={`Hasta ${SEO_LIMITS.tagsMaxCount}. Se publican como palabras clave del libro en los datos estructurados.${
            tags.length > 0 ? ` Llevás ${tags.length}.` : ""
          }`}
        >
          <input
            id="tags"
            className={seoInputClass}
            placeholder="Ej.: astrología humanista, retorno de Saturno, ciclos planetarios, vida adulta"
            value={values.tags}
            onChange={(e) => onChange({ tags: e.target.value })}
          />
        </SeoField>

        <SeoField
          step={6}
          label="Preguntas frecuentes (opcional)"
          help={`Se muestran en la página del libro, visibles para quien compra, y se declaran a Google como FAQPage. Usá dudas reales de compra: «¿Es PDF o papel?», «¿Necesito saber astrología?». Máximo ${SEO_LIMITS.faqMaxItems}.`}
        >
          <div className="space-y-4">
            {values.faq.map((item, index) => (
              <div key={index} className="space-y-3 rounded-xl border-2 border-gold/35 bg-noir-bg p-4">
                <div>
                  <label className="mb-1.5 block font-ui text-sm font-semibold text-gold-pale" htmlFor={`faq-q-${index}`}>
                    Pregunta {index + 1}
                  </label>
                  <input
                    id={`faq-q-${index}`}
                    className={seoInputClass}
                    maxLength={SEO_LIMITS.faqQuestionHard}
                    value={item.question}
                    onChange={(e) => setFaqItem(index, "question", e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block font-ui text-sm font-semibold text-gold-pale" htmlFor={`faq-a-${index}`}>
                    Respuesta
                  </label>
                  <textarea
                    id={`faq-a-${index}`}
                    rows={3}
                    className={seoInputClass}
                    maxLength={SEO_LIMITS.faqAnswerHard}
                    value={item.answer}
                    onChange={(e) => setFaqItem(index, "answer", e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeFaqItem(index)}
                  className="font-ui text-xs font-medium uppercase tracking-wide text-wine-bright underline hover:text-gold"
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
              className="focus-ring mt-4 rounded-full border-2 border-gold/60 px-5 py-2 font-ui text-xs font-semibold uppercase tracking-wide text-gold-pale transition hover:bg-gold/15"
            >
              + Agregar pregunta
            </button>
          )}
          {hasIncompleteFaq(values.faq) && (
            <p className="mt-3 font-ui text-sm text-wine-bright">
              Hay preguntas sin pregunta o sin respuesta: las incompletas no se guardan.
            </p>
          )}
        </SeoField>

        <SeoChecklist checks={checks} />
      </div>
    </section>
  );
}

/** Cada campo de la sección SEO va en su propia tarjeta numerada, con el nombre bien visible. */
function SeoField({
  step,
  label,
  htmlFor,
  help,
  children,
}: {
  step: number;
  label: string;
  htmlFor?: string;
  help?: string;
  children: ReactNode;
}) {
  const labelClassName = "block font-ui text-base font-semibold leading-snug text-gold-pale";
  return (
    <div className="rounded-xl border border-gold/35 border-l-4 border-l-gold bg-noir-bg p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold font-ui text-sm font-semibold text-noir-bg"
        >
          {step}
        </span>
        <div className="min-w-0">
          {htmlFor ? (
            <label htmlFor={htmlFor} className={labelClassName}>
              {label}
            </label>
          ) : (
            <p className={labelClassName}>{label}</p>
          )}
          {help && <p className="mt-1 font-ui text-sm leading-relaxed text-gold-dim">{help}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

/** Contador de caracteres: se pone rojo cuando se pasa del largo recomendado. */
function CharCounter({ current, limit, text }: { current: number; limit: number; text: string }) {
  const over = current > limit;
  return (
    <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-ui text-sm">
      <span
        className={`rounded-full px-3 py-0.5 font-semibold ${
          over ? "bg-wine/15 text-wine-bright" : "bg-gold/15 text-gold-pale"
        }`}
      >
        {current} / {limit}
      </span>
      <span className={over ? "text-wine-bright" : "text-gold-dim"}>{text}</span>
    </p>
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
    <div className="rounded-xl border-2 border-dashed border-gold/60 bg-white p-4 dark:bg-noir-surface sm:p-5">
      <p className="mb-3 inline-block rounded-full bg-gold/15 px-3 py-1 font-ui text-xs font-semibold uppercase tracking-wide text-gold-pale">
        Vista previa · Así se vería en Google
      </p>
      <p className="truncate font-ui text-sm text-[#4d5156] dark:text-gold-dim">
        zodiacnoirweb.com › tienda › {slug || "…"}
      </p>
      <p className="mt-1 font-ui text-xl leading-snug text-[#1a0dab] dark:text-[#8AB4F8]">
        {shownTitle || "Título del producto"}
      </p>
      <p className="mt-1 font-ui text-sm leading-snug text-[#4d5156] dark:text-gold-pale/80">
        {shownDescription || "Acá aparecerá la descripción del producto."}
      </p>
    </div>
  );
}

const CHECK_MARK: Record<SeoCheck["status"], { symbol: string; badge: string; row: string; label: string }> = {
  ok: {
    symbol: "✓",
    badge: "bg-green-700 text-white dark:bg-green-500 dark:text-black",
    row: "border-green-700/40 bg-green-700/10 dark:border-green-400/40",
    label: "Correcto",
  },
  warn: {
    symbol: "!",
    badge: "bg-gold text-noir-bg",
    row: "border-gold/50 bg-gold/10",
    label: "Mejorable",
  },
  todo: {
    symbol: "○",
    badge: "bg-gold-dim text-noir-bg",
    row: "border-gold/25 bg-noir-surface/60",
    label: "Pendiente",
  },
};

/** Lista de control en vivo: se recalcula en cada cambio del formulario. */
function SeoChecklist({ checks }: { checks: SeoCheck[] }) {
  const okCount = checks.filter((c) => c.status === "ok").length;
  const percent = checks.length > 0 ? Math.round((okCount / checks.length) * 100) : 0;
  return (
    <div className="rounded-xl border-2 border-gold/60 bg-noir-bg p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-ui text-base font-semibold text-gold-pale">Lista de control SEO</p>
        <span className="rounded-full bg-gold/15 px-3 py-0.5 font-ui text-sm font-semibold text-gold-pale">
          {okCount} de {checks.length} en orden
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Avance de la lista de control SEO"
        className="mt-3 h-2 overflow-hidden rounded-full bg-gold/20"
      >
        <div className="h-2 rounded-full bg-gold transition-all" style={{ width: `${percent}%` }} />
      </div>
      <ul className="mt-4 space-y-2">
        {checks.map((check) => {
          const mark = CHECK_MARK[check.status];
          return (
            <li key={check.id} className={`flex gap-3 rounded-lg border px-3 py-2.5 ${mark.row}`}>
              <span
                aria-label={mark.label}
                role="img"
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-ui text-sm font-bold ${mark.badge}`}
              >
                {mark.symbol}
              </span>
              <span className="font-ui text-base font-medium text-gold-pale">
                {check.label}
                {check.hint && <span className="mt-0.5 block text-sm font-normal text-gold-dim">{check.hint}</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
