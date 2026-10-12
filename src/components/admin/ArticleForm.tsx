"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/slugify";
import { CATEGORIES } from "@/lib/categories";
import { RichTextEditor } from "./RichTextEditor";
import { analyzeArticleSeo, SEO_LIMITS, type FaqItem, type SeoCheck } from "@/lib/seo";

export type ArticleFormValues = {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  coverImagePosX: number;
  coverImagePosY: number;
  category: string;
  sign: string;
  published: boolean;
  featuredProductId: string;
  isPremium: boolean;
  // --- SEO ---
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  coverImageAlt: string;
  // Etiquetas separadas por coma (el servidor las convierte en lista).
  tags: string;
  faq: FaqItem[];
  // Fecha y hora de publicación. Llega como texto ISO desde el servidor y, dentro del
  // formulario, se maneja como valor de <input type="datetime-local"> (hora del dispositivo).
  publishedAt?: string;
};

const SIGNS = [
  "", "Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo",
  "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis",
];

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Texto ISO (UTC) → valor para <input type="datetime-local"> en la hora del dispositivo. */
function toLocalInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** Valor de <input type="datetime-local"> → Date, o null si está vacío o es inválido. */
function parseLocalInput(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatLocal(d: Date): string {
  return d.toLocaleString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function ArticleForm({
  initial,
  products,
}: {
  initial?: ArticleFormValues;
  products: { id: string; title: string }[];
}) {
  const router = useRouter();
  const isEditing = Boolean(initial?.id);
  const [values, setValues] = useState<ArticleFormValues>(
    initial ? { ...initial, publishedAt: toLocalInput(initial.publishedAt) } : {
      slug: "",
      title: "",
      excerpt: "",
      content: "",
      coverImage: "",
      coverImagePosX: 50,
      coverImagePosY: 50,
      category: "efemerides",
      sign: "",
      published: false,
      featuredProductId: "",
      isPremium: false,
      metaTitle: "",
      metaDescription: "",
      focusKeyword: "",
      coverImageAlt: "",
      tags: "",
      faq: [],
      publishedAt: "",
    }
  );
  const [slugTouched, setSlugTouched] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const coverInputRef = useRef<HTMLInputElement>(null);

  const publishDate = parseLocalInput(values.publishedAt);
  const isFuture = publishDate !== null && publishDate.getTime() > Date.now();
  // Estado ya guardado del artículo (no el que se está editando): para el aviso junto a los botones.
  const savedDate = initial?.publishedAt ? new Date(initial.publishedAt) : null;
  const savedScheduled = Boolean(initial?.published && savedDate && savedDate.getTime() > Date.now());

  const set = <K extends keyof ArticleFormValues>(key: K, value: ArticleFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const onTitleChange = (title: string) => {
    set("title", title);
    if (!slugTouched) set("slug", slugify(title));
  };

  const seoChecks = analyzeArticleSeo({
    title: values.title,
    slug: values.slug,
    excerpt: values.excerpt,
    content: values.content,
    metaTitle: values.metaTitle,
    metaDescription: values.metaDescription,
    focusKeyword: values.focusKeyword,
    coverImage: values.coverImage,
    coverImageAlt: values.coverImageAlt,
  });

  const setFaqItem = (index: number, field: keyof FaqItem, value: string) =>
    setValues((v) => ({
      ...v,
      faq: v.faq.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  const addFaqItem = () =>
    setValues((v) =>
      v.faq.length >= SEO_LIMITS.faqMaxItems ? v : { ...v, faq: [...v.faq, { question: "", answer: "" }] }
    );
  const removeFaqItem = (index: number) =>
    setValues((v) => ({ ...v, faq: v.faq.filter((_, i) => i !== index) }));

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir la imagen");
      return data.url as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir la imagen");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const onCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file);
    if (url) set("coverImage", url);
    e.target.value = "";
  };

  const isContentEmpty = (html: string) => {
    const text = html.replace(/<[^>]*>/g, "").trim();
    return text.length === 0;
  };

  const onSubmit = async (e: FormEvent, publishOverride?: boolean) => {
    e.preventDefault();
    if (isContentEmpty(values.content)) {
      setError("El contenido del artículo no puede quedar vacío.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const finalPublished = publishOverride ?? values.published;
      const payload = {
        ...values,
        published: finalPublished,
        // El borrador no guarda fecha; al publicar o programar se envía en formato ISO (UTC).
        publishedAt: finalPublished && publishDate ? publishDate.toISOString() : null,
      };
      const url = isEditing ? `/api/admin/articles/${initial!.id}` : "/api/admin/articles";
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar el artículo");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gold/25 bg-transparent px-4 py-2.5 font-ui text-sm text-gold-pale placeholder:text-gold-dim/60 focus:border-gold focus:outline-none";
  const labelClass = "mb-1.5 block font-ui text-xs uppercase tracking-wide text-gold-dim";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-wine/50 bg-wine/10 px-4 py-3 font-ui text-sm text-wine-bright">
          {error}
        </div>
      )}

      <div>
        <label className={labelClass} htmlFor="title">Título</label>
        <input
          id="title"
          required
          className={inputClass}
          value={values.title}
          onChange={(e) => onTitleChange(e.target.value)}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="slug">
          Slug (URL: /articulos/{values.slug || "…"})
        </label>
        <input
          id="slug"
          required
          className={inputClass}
          value={values.slug}
          onChange={(e) => {
            setSlugTouched(true);
            set("slug", slugify(e.target.value));
          }}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="excerpt">Copete / resumen breve</label>
        <textarea
          id="excerpt"
          required
          rows={2}
          className={inputClass}
          value={values.excerpt}
          onChange={(e) => set("excerpt", e.target.value)}
        />
        <p className="mt-1.5 font-ui text-xs text-gold-dim">
          Si marcás el artículo como "solo para miembros", esto es lo único que va a ver quien no sea miembro.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="category">Categoría</label>
          <select
            id="category"
            className={inputClass}
            value={values.category}
            onChange={(e) => set("category", e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value} className="bg-noir-surface">
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="sign">Signo (opcional)</label>
          <select
            id="sign"
            className={inputClass}
            value={values.sign}
            onChange={(e) => set("sign", e.target.value)}
          >
            {SIGNS.map((s) => (
              <option key={s} value={s} className="bg-noir-surface">
                {s || "— Ninguno —"}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Imagen de portada</label>
        <div className="flex flex-wrap items-center gap-3">
          <input
            className={inputClass}
            placeholder="https:// (o subí un archivo)"
            value={values.coverImage}
            onChange={(e) => set("coverImage", e.target.value)}
          />
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={uploading}
            className="focus-ring shrink-0 rounded-full border border-gold/40 px-4 py-2 font-ui text-xs uppercase tracking-wide text-gold transition hover:bg-gold/10 disabled:opacity-50"
          >
            {uploading ? "Subiendo…" : "Subir imagen"}
          </button>
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={onCoverFileChange} />
        </div>
        {values.coverImage && (
          <div className="mt-4 space-y-3 rounded-lg border border-gold/20 bg-noir-surface2/40 p-4">
            <p className="font-ui text-xs uppercase tracking-wide text-gold-dim">
              Vista previa de la tarjeta (así se va a ver recortada)
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={values.coverImage}
              alt=""
              className="h-40 w-full rounded-lg border border-gold/20 object-cover sm:h-48"
              style={{ objectPosition: `${values.coverImagePosX}% ${values.coverImagePosY}%` }}
            />
            <div>
              <label className="mb-1 flex justify-between font-ui text-xs text-gold-dim">
                <span>Ajuste horizontal</span>
                <span>{values.coverImagePosX}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={values.coverImagePosX}
                onChange={(e) => set("coverImagePosX", Number(e.target.value))}
                className="w-full accent-gold"
              />
            </div>
            <div>
              <label className="mb-1 flex justify-between font-ui text-xs text-gold-dim">
                <span>Ajuste vertical</span>
                <span>{values.coverImagePosY}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={values.coverImagePosY}
                onChange={(e) => set("coverImagePosY", Number(e.target.value))}
                className="w-full accent-gold"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                set("coverImagePosX", 50);
                set("coverImagePosY", 50);
              }}
              className="font-ui text-xs uppercase tracking-wide text-gold-dim underline hover:text-gold"
            >
              Volver al centro
            </button>
          </div>
        )}
        {values.coverImage && (
          <div className="mt-4">
            <label className={labelClass} htmlFor="coverImageAlt">
              Texto alternativo de la portada (para Google y lectores de pantalla)
            </label>
            <input
              id="coverImageAlt"
              className={inputClass}
              maxLength={SEO_LIMITS.altHard}
              placeholder="Ej.: Carta astral de Brasil con los tránsitos del balotaje del 25 de octubre de 2026"
              value={values.coverImageAlt}
              onChange={(e) => set("coverImageAlt", e.target.value)}
            />
            <p className="mt-1.5 font-ui text-xs text-gold-dim">
              Describí lo que muestra la imagen, con la búsqueda principal si encaja de forma natural. Si lo dejás vacío, se usa el título.
            </p>
          </div>
        )}
      </div>

      <div>
        <label className={labelClass} htmlFor="featuredProductId">
          Producto destacado (opcional) — se muestra en una tarjeta al pie del artículo, invitando a comprarlo
        </label>
        <select
          id="featuredProductId"
          className={inputClass}
          value={values.featuredProductId}
          onChange={(e) => set("featuredProductId", e.target.value)}
        >
          <option value="" className="bg-noir-surface">— Ninguno (se muestran todos los productos) —</option>
          {products.map((p) => (
            <option key={p.id} value={p.id} className="bg-noir-surface">
              {p.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="content">Contenido</label>
        <RichTextEditor value={values.content} onChange={(html) => set("content", html)} onImageUpload={uploadImage} />
      </div>

      <section aria-labelledby="seo-heading" className="space-y-6 rounded-lg border border-gold/25 bg-noir-surface2/30 p-5">
        <div>
          <h2 id="seo-heading" className="font-display text-xl text-gold-pale">Posicionamiento en Google (SEO)</h2>
          <p className="mt-1 font-ui text-xs text-gold-dim">
            Todo lo de esta sección es opcional: si algo queda vacío, la web usa el título y el copete del artículo.
            Estos campos no se ven dentro del artículo; son lo que lee Google y lo que aparece al compartir en redes.
          </p>
        </div>

        <div>
          <label className={labelClass} htmlFor="focusKeyword">Palabra clave principal</label>
          <input
            id="focusKeyword"
            className={inputClass}
            maxLength={SEO_LIMITS.focusKeywordHard}
            placeholder="Ej.: elecciones brasil 2026 astrología"
            value={values.focusKeyword}
            onChange={(e) => set("focusKeyword", e.target.value)}
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
            placeholder={values.title || "Si lo dejás vacío se usa el título del artículo"}
            value={values.metaTitle}
            onChange={(e) => set("metaTitle", e.target.value)}
          />
          <p
            className={`mt-1.5 font-ui text-xs ${
              (values.metaTitle || values.title).length > SEO_LIMITS.metaTitleIdeal ? "text-wine-bright" : "text-gold-dim"
            }`}
          >
            {(values.metaTitle || values.title).length} / {SEO_LIMITS.metaTitleIdeal} caracteres recomendados. Si lo completás, se usa tal cual
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
            placeholder={values.excerpt || "Si la dejás vacía se usa el copete del artículo"}
            value={values.metaDescription}
            onChange={(e) => set("metaDescription", e.target.value)}
          />
          <p
            className={`mt-1.5 font-ui text-xs ${
              (values.metaDescription || values.excerpt).length > SEO_LIMITS.metaDescriptionIdeal
                ? "text-wine-bright"
                : "text-gold-dim"
            }`}
          >
            {(values.metaDescription || values.excerpt).length} caracteres. Ideal: entre {SEO_LIMITS.metaDescriptionMin} y{" "}
            {SEO_LIMITS.metaDescriptionIdeal}.
          </p>
        </div>

        <GooglePreview
          slug={values.slug}
          title={values.metaTitle || values.title}
          description={values.metaDescription || values.excerpt}
        />

        <div>
          <label className={labelClass} htmlFor="tags">Etiquetas (separadas por coma)</label>
          <input
            id="tags"
            className={inputClass}
            placeholder="Ej.: Brasil, elecciones 2026, Neptuno en Aries, Saturno en Aries"
            value={values.tags}
            onChange={(e) => set("tags", e.target.value)}
          />
          <p className="mt-1.5 font-ui text-xs text-gold-dim">
            Hasta {SEO_LIMITS.tagsMaxCount}. Se publican como palabras clave del artículo en los datos estructurados.
          </p>
        </div>

        <div>
          <p className={labelClass}>Preguntas frecuentes (opcional)</p>
          <p className="mb-3 font-ui text-xs text-gold-dim">
            Se muestran al final del artículo, visibles para el lector, y se declaran a Google como FAQPage. Google ya casi no
            las muestra como desplegable en los resultados de sitios como este, pero sirven al lector y ayudan a que
            entiendan el tema. Máximo {SEO_LIMITS.faqMaxItems}.
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
              className="focus-ring mt-3 rounded-full border border-gold/40 px-4 py-2 font-ui text-xs uppercase tracking-wide text-gold transition hover:bg-gold/10"
            >
              + Agregar pregunta
            </button>
          )}
        </div>

        <SeoChecklist checks={seoChecks} />
      </section>

      <label className="flex items-start gap-3 rounded-lg border border-gold/20 bg-noir-surface2/30 p-4 font-ui text-sm text-gold-pale/85">
        <input
          type="checkbox"
          checked={values.isPremium}
          onChange={(e) => set("isPremium", e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-gold"
        />
        <span>
          <span className="block font-medium text-gold-pale">Artículo solo para miembros</span>
          <span className="block text-xs text-gold-dim">
            Quien no sea miembro va a ver únicamente el copete, con un cartel invitándolo a sumarse.
          </span>
        </span>
      </label>

      <div className="rounded-lg border border-gold/20 bg-noir-surface2/30 p-4">
        <label className={labelClass} htmlFor="publishedAt">
          Fecha y hora de publicación (opcional)
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <input
            id="publishedAt"
            type="datetime-local"
            className={`${inputClass} sm:max-w-xs dark:[color-scheme:dark]`}
            value={values.publishedAt ?? ""}
            onChange={(e) => set("publishedAt", e.target.value)}
          />
          {values.publishedAt && (
            <button
              type="button"
              onClick={() => set("publishedAt", "")}
              className="font-ui text-xs uppercase tracking-wide text-gold-dim underline hover:text-gold"
            >
              Quitar fecha
            </button>
          )}
        </div>
        <p className="mt-2 font-ui text-xs text-gold-dim">
          {!publishDate &&
            "Sin fecha, el artículo se publica de inmediato al pulsar «Publicar». Con una fecha futura queda oculto y se publica solo a esa hora."}
          {publishDate && isFuture &&
            `Se publicará automáticamente el ${formatLocal(publishDate)} (hora de este dispositivo).`}
          {publishDate && !isFuture &&
            "Esa fecha ya pasó: al publicar, el artículo se verá de inmediato con esa fecha."}
        </p>
        <p className="mt-1 font-ui text-xs text-gold-dim">
          «Guardar borrador» no conserva la fecha: solo se aplica al publicar o programar.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-gold/15 pt-6">
        <button
          type="button"
          disabled={saving}
          onClick={(e) => onSubmit(e, false)}
          className="focus-ring rounded-full border border-gold/40 px-6 py-3 font-ui text-sm uppercase tracking-wide text-gold transition hover:bg-gold/10 disabled:opacity-50"
        >
          Guardar borrador
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={(e) => onSubmit(e, true)}
          className="focus-ring rounded-full bg-gold px-6 py-3 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright disabled:opacity-50"
        >
          {saving ? "Guardando…" : isFuture ? "Programar publicación" : "Publicar"}
        </button>
        {initial?.published && savedScheduled && savedDate && (
          <span className="font-ui text-xs uppercase tracking-wide text-gold">
            Programado para el {formatLocal(savedDate)}
          </span>
        )}
        {initial?.published && !savedScheduled && (
          <span className="font-ui text-xs uppercase tracking-wide text-green-400">Este artículo está publicado</span>
        )}
      </div>
    </form>
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
      <p className="truncate font-ui text-xs text-gold-dim">zodiacnoirweb.com › articulos › {slug || "…"}</p>
      <p className="mt-1 font-ui text-lg leading-snug text-[#8AB4F8]">{shownTitle || "Título del artículo"}</p>
      <p className="mt-1 font-ui text-sm leading-snug text-gold-pale/80">
        {shownDescription || "Acá aparecerá la descripción del artículo."}
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
