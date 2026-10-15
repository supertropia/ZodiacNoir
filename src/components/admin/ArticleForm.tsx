"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/slugify";
import { CATEGORIES } from "@/lib/categories";
import { RichTextEditor } from "./RichTextEditor";
import { analyzeArticleSeo, parseTags, SEO_LIMITS, type FaqItem, type SeoCheck } from "@/lib/seo";

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

/** Un contenido que solo tiene etiquetas HTML vacías (por ejemplo "<p></p>") cuenta como vacío. */
function isContentEmpty(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").trim().length === 0;
}

// Mismo límite que aplica el servidor a las fechas de publicación.
const MAX_DAYS_AHEAD = 365 * 2;

/** Copia local del borrador en el navegador: si algo falla al guardar, el texto no se pierde. */
const BACKUP_PREFIX = "zn-article-backup:";
const BACKUP_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type FormBackup = { savedAt: number; values: ArticleFormValues };

type PreflightIssue = {
  level: "error" | "warn";
  text: string;
  // true = solo impide «Publicar / Programar»; el borrador se puede guardar igual.
  onlyPublish?: boolean;
};

/**
 * Revisión previa al guardado. Los "error" son cosas que el servidor rechazaría
 * (mismas reglas que /api/admin/articles); los "warn" son avisos que no impiden guardar.
 */
function buildPreflight(
  values: ArticleFormValues,
  publishDate: Date | null,
  isFuture: boolean,
  seoChecks: SeoCheck[],
  uploading: boolean
): PreflightIssue[] {
  const issues: PreflightIssue[] = [];
  const error = (text: string, onlyPublish = false) => issues.push({ level: "error", text, onlyPublish });
  const warn = (text: string, onlyPublish = false) => issues.push({ level: "warn", text, onlyPublish });

  if (uploading) error("Se está subiendo una imagen: espera a que termine antes de guardar, o no quedará en el artículo.");
  if (!values.title.trim()) error("Falta el título.");
  if (!values.slug.trim()) error("Falta el slug (la dirección del artículo).");
  if (!values.excerpt.trim()) error("Falta el copete / resumen breve.");
  if (!values.category) error("Falta elegir la categoría.");
  if (isContentEmpty(values.content)) error("El contenido del artículo está vacío.");

  const rawDate = (values.publishedAt ?? "").trim();
  if (rawDate && !publishDate) {
    error("La fecha de publicación no es válida. Elige otra o pulsa «Quitar fecha».", true);
  }
  if (publishDate) {
    if (publishDate.getFullYear() < 2000) {
      error("La fecha de publicación tiene un año que no parece correcto. Revísala.", true);
    } else if (publishDate.getTime() > Date.now() + MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000) {
      error("La fecha de publicación está demasiado lejos (máximo 2 años hacia adelante).", true);
    } else if (!isFuture) {
      warn("La fecha elegida ya pasó: al publicar, el artículo se verá de inmediato con esa fecha.", true);
    }
  }

  const tags = parseTags(values.tags);
  if (tags.length > SEO_LIMITS.tagsMaxCount) {
    error(`Hay ${tags.length} etiquetas y el máximo es ${SEO_LIMITS.tagsMaxCount}. Quita ${tags.length - SEO_LIMITS.tagsMaxCount}.`);
  }
  const longTag = tags.find((t) => t.length > SEO_LIMITS.tagHard);
  if (longTag) {
    error(`La etiqueta «${longTag.slice(0, 30)}…» supera los ${SEO_LIMITS.tagHard} caracteres.`);
  }

  if (values.faq.some((f) => !f.question.trim() || !f.answer.trim())) {
    warn("Hay preguntas frecuentes incompletas (sin pregunta o sin respuesta): se descartan al guardar.");
  }

  if (!values.coverImage.trim()) {
    warn("Sin imagen de portada: la tarjeta del artículo se verá sin imagen.", true);
  }

  const pendingSeo = seoChecks.filter((c) => c.status !== "ok").length;
  if (pendingSeo > 0) {
    warn(
      `${pendingSeo} ${pendingSeo === 1 ? "punto" : "puntos"} de la lista de control SEO sin resolver (no impide publicar).`,
      true
    );
  }

  // Errores primero, avisos después.
  return [...issues.filter((i) => i.level === "error"), ...issues.filter((i) => i.level === "warn")];
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
  // Cantidad de imágenes que se están subiendo ahora mismo (pueden ser varias a la vez).
  const [uploadsInFlight, setUploadsInFlight] = useState(0);
  const uploading = uploadsInFlight > 0;
  // Error de subida de imagen: se muestra junto al lugar donde se intentó subir (portada o editor de texto).
  const [uploadError, setUploadError] = useState<{ where: "cover" | "editor"; message: string } | null>(null);
  // Errores al guardar: se muestran junto a los botones, que es donde se está mirando.
  const [saveError, setSaveError] = useState("");
  const saveErrorRef = useRef<HTMLDivElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // --- Copia local del texto (por si falla el guardado o se cierra la pestaña) ---
  const backupKey = `${BACKUP_PREFIX}${initial?.id ?? "nuevo"}`;
  const [backup, setBackup] = useState<FormBackup | null>(null);
  // Se cambia al restaurar una copia para que el editor de texto se vuelva a crear con el contenido restaurado.
  const [editorKey, setEditorKey] = useState(0);
  // Estado con el que se abrió el formulario: sirve para saber si hay cambios sin guardar.
  const baselineRef = useRef<string | null>(null);
  if (baselineRef.current === null) baselineRef.current = JSON.stringify(values);
  const valuesRef = useRef(values);
  valuesRef.current = values;
  const savedRef = useRef(false);

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

  const preflight = buildPreflight(values, publishDate, isFuture, seoChecks, uploading);
  const blockDraft = preflight.some((i) => i.level === "error" && !i.onlyPublish);
  const blockPublish = preflight.some((i) => i.level === "error");

  // Al abrir el formulario: ofrece recuperar una copia local que no llegó a guardarse.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(backupKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as FormBackup;
      const tooOld = !parsed?.savedAt || Date.now() - parsed.savedAt > BACKUP_MAX_AGE_MS;
      if (!parsed?.values || tooOld || JSON.stringify(parsed.values) === baselineRef.current) {
        window.localStorage.removeItem(backupKey);
        return;
      }
      setBackup(parsed);
    } catch {
      // Sin acceso al almacenamiento del navegador: el formulario funciona igual, solo sin copia local.
    }
  }, [backupKey]);

  // Mientras se escribe: guarda una copia local cada pocos segundos (solo si hay cambios).
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (savedRef.current) return;
      if (JSON.stringify(values) === baselineRef.current) return;
      try {
        const copy: FormBackup = { savedAt: Date.now(), values };
        window.localStorage.setItem(backupKey, JSON.stringify(copy));
      } catch {
        // Si el navegador no deja guardar la copia, se sigue sin ella.
      }
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [values, backupKey]);

  // Avisa antes de cerrar o recargar la pestaña si hay cambios sin guardar.
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (savedRef.current) return;
      if (JSON.stringify(valuesRef.current) === baselineRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  // Cuando aparece un error de guardado, lleva la vista hasta él.
  useEffect(() => {
    if (saveError) saveErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [saveError]);

  const restoreBackup = () => {
    if (!backup) return;
    setValues(backup.values);
    setSlugTouched(true);
    setEditorKey((k) => k + 1);
    setBackup(null);
  };

  const discardBackup = () => {
    try {
      window.localStorage.removeItem(backupKey);
    } catch {
      // Nada que hacer si el navegador no permite borrarla.
    }
    setBackup(null);
  };

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

  // Vercel rechaza cualquier pedido de más de ~4,5 MB antes de que llegue a nuestro código, así que se avisa antes.
  const MAX_IMAGE_MB = 4;

  const uploadImage = async (file: File, where: "cover" | "editor"): Promise<string | null> => {
    setUploadsInFlight((n) => n + 1);
    setUploadError(null);
    try {
      if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
        throw new Error(
          `La imagen pesa ${(file.size / (1024 * 1024)).toFixed(1)} MB y el máximo es ${MAX_IMAGE_MB} MB. Reduce su tamaño (por ejemplo, guardándola como JPG) y vuelve a pegarla.`
        );
      }
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || `No se pudo subir la imagen (código ${res.status}).`);
      }
      return data.url;
    } catch (err) {
      setUploadError({
        where,
        message: err instanceof Error ? err.message : "Error al subir la imagen.",
      });
      return null;
    } finally {
      setUploadsInFlight((n) => n - 1);
    }
  };

  const onCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file, "cover");
    if (url) set("coverImage", url);
    e.target.value = "";
  };

  const onSubmit = async (e: FormEvent, publishOverride?: boolean) => {
    e.preventDefault();
    const finalPublished = publishOverride ?? values.published;

    // Si hay algo que el servidor rechazaría, se avisa acá mismo, junto a los botones.
    const blocking = preflight.filter((i) => i.level === "error" && (finalPublished || !i.onlyPublish));
    if (blocking.length > 0) {
      setSaveError(`Falta corregir: ${blocking.map((i) => i.text).join(" ")}`);
      return;
    }

    setSaving(true);
    setSaveError("");
    try {
      const payload = {
        ...values,
        published: finalPublished,
        // El borrador no guarda fecha; al publicar o programar se envía en formato ISO (UTC).
        publishedAt: finalPublished && publishDate ? publishDate.toISOString() : null,
      };
      const url = isEditing ? `/api/admin/articles/${initial!.id}` : "/api/admin/articles";
      const method = isEditing ? "PUT" : "POST";

      let res: Response;
      try {
        res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        throw new Error("No hubo conexión con el servidor. Revisa tu internet y vuelve a intentarlo.");
      }

      // Si el servidor responde algo que no es JSON (por ejemplo una página de error de Vercel), no se rompe.
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        article?: { id?: string };
      } | null;

      if (!res.ok) {
        throw new Error(data?.error || `El servidor respondió con un error (código ${res.status}).`);
      }
      const savedId = data?.article?.id;
      if (!savedId) {
        throw new Error("El servidor no confirmó que el artículo se haya guardado.");
      }

      // Guardado confirmado: ya no hace falta la copia local ni el aviso de cambios sin guardar.
      savedRef.current = true;
      try {
        window.localStorage.removeItem(backupKey);
      } catch {
        // Sin acceso al almacenamiento del navegador: no hay nada que borrar.
      }
      router.push(`/admin?guardado=${encodeURIComponent(savedId)}`);
      router.refresh();
    } catch (err) {
      setSaveError(
        `${err instanceof Error ? err.message : "Error al guardar."} El artículo NO se guardó, pero tu texto sigue en pantalla y tiene una copia en este navegador.`
      );
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gold/25 bg-transparent px-4 py-2.5 font-ui text-sm text-gold-pale placeholder:text-gold-dim/60 focus:border-gold focus:outline-none";
  const labelClass = "mb-1.5 block font-ui text-xs uppercase tracking-wide text-gold-dim";

  return (
    // Pulsar Enter dentro de un campo no debe guardar nada: solo guardan los botones de abajo.
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      {backup && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-3 rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 font-ui text-sm text-gold-pale"
        >
          <span className="flex-1">
            Encontramos una copia de este artículo con cambios que no llegaron a guardarse (
            {new Date(backup.savedAt).toLocaleString("es-AR", {
              day: "numeric",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
            ). ¿Quieres recuperarla?
          </span>
          <button
            type="button"
            onClick={restoreBackup}
            className="focus-ring rounded-full bg-gold px-4 py-2 text-xs font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright"
          >
            Recuperar copia
          </button>
          <button
            type="button"
            onClick={discardBackup}
            className="font-ui text-xs uppercase tracking-wide text-gold-dim underline hover:text-gold"
          >
            Descartar
          </button>
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
        {uploadError?.where === "cover" && (
          <div role="alert" className="mt-3 rounded-lg border border-wine/50 bg-wine/10 px-4 py-3 font-ui text-sm text-wine-bright">
            <strong className="font-medium">La imagen no se subió. </strong>
            {uploadError.message}
          </div>
        )}
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
        <RichTextEditor
          key={editorKey}
          value={values.content}
          onChange={(html) => set("content", html)}
          onImageUpload={(file) => uploadImage(file, "editor")}
        />
        {uploadError?.where === "editor" && (
          <div role="alert" className="mt-3 rounded-lg border border-wine/50 bg-wine/10 px-4 py-3 font-ui text-sm text-wine-bright">
            <strong className="font-medium">La imagen no se subió y no quedó en el texto. </strong>
            {uploadError.message}
          </div>
        )}
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

      <div className="space-y-4 border-t border-gold/15 pt-6">
        {/* Revisión previa: lo que hay que corregir (rojo) y lo que conviene mirar (dorado), justo encima de los botones. */}
        {preflight.length > 0 ? (
          <div
            role="status"
            className={`rounded-lg border p-4 ${
              blockPublish ? "border-wine/50 bg-wine/10" : "border-gold/30 bg-gold/10"
            }`}
          >
            <p className="font-ui text-xs uppercase tracking-wide text-gold-dim">Antes de guardar o publicar</p>
            <ul className="mt-2 space-y-1.5 font-ui text-sm">
              {preflight.map((issue, index) => (
                <li
                  key={index}
                  className={`flex items-start gap-2 ${issue.level === "error" ? "text-wine-bright" : "text-gold"}`}
                >
                  <span aria-hidden="true" className="mt-px shrink-0">
                    {issue.level === "error" ? "✕" : "!"}
                  </span>
                  <span>
                    <span className="sr-only">{issue.level === "error" ? "Corregir: " : "Aviso: "}</span>
                    {issue.text}
                  </span>
                </li>
              ))}
            </ul>
            {blockDraft && (
              <p className="mt-3 font-ui text-xs text-gold-dim">
                Mientras haya algo en rojo, los botones de guardar quedan desactivados.
              </p>
            )}
            {!blockDraft && blockPublish && (
              <p className="mt-3 font-ui text-xs text-gold-dim">
                Puedes guardar el borrador, pero «Publicar / Programar» queda desactivado hasta corregir lo que está en rojo.
              </p>
            )}
          </div>
        ) : (
          <p role="status" className="font-ui text-xs uppercase tracking-wide text-green-400">
            ✓ Todo en orden: el artículo se puede guardar y publicar.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            disabled={saving || blockDraft}
            onClick={(e) => onSubmit(e, false)}
            className="focus-ring rounded-full border border-gold/40 px-6 py-3 font-ui text-sm uppercase tracking-wide text-gold transition hover:bg-gold/10 disabled:opacity-50"
          >
            Guardar borrador
          </button>
          <button
            type="button"
            disabled={saving || blockPublish}
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

        {initial?.published && (
          <p className="font-ui text-xs text-gold-dim">
            Ojo: este artículo ya está {savedScheduled ? "programado" : "publicado"}. «Guardar borrador» lo oculta del sitio
            y borra su fecha.
          </p>
        )}

        {saveError && (
          <div
            ref={saveErrorRef}
            role="alert"
            className="rounded-lg border border-wine/50 bg-wine/10 px-4 py-3 font-ui text-sm text-wine-bright"
          >
            <strong className="font-medium">No se guardó. </strong>
            {saveError}
          </div>
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
