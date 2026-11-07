"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/slugify";
import { ProductSeoSection } from "@/components/admin/ProductSeoSection";
import { FormattedText } from "@/components/store/FormattedText";
import { VideoUploadField } from "@/components/admin/VideoUploadField";
import { TrackedLinkMenu } from "@/components/admin/TrackedLinkMenu";
import { FormSection } from "@/components/admin/FormSection";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { descriptionToEditorHtml, isDescriptionEmpty } from "@/lib/product-description";
import type { FaqItem } from "@/lib/seo";

type ContentHighlight = { title: string; description: string };
type Testimonial = { name: string; stars: number; text: string; shared: number };

export type ProductFormValues = {
  id?: string;
  slug: string;
  title: string;
  description: string;
  priceLabel: string;
  priceArs: number | null;
  priceUsd: number | null;
  // --- Organización en la tienda ---
  // Categoría (o subcategoría) donde se muestra. Los diseños usan la de su colección.
  categoryId: string;
  // true = colección con varios diseños (no se compra: se compran sus diseños)
  isCollection: boolean;
  // Si tiene valor, este producto es un diseño de esa colección
  parentId: string;
  // Nombre corto del diseño, ej. "Minimal · A4"
  variantLabel: string;
  amazonKindleUrl: string;
  amazonKindlePrice: string;
  amazonPaperbackUrl: string;
  amazonPaperbackPrice: string;
  lemonVariantId: string;
  coverImage: string;
  coverImagePosition: number;
  heroImage: string;
  heroImagePosition: number;
  galleryImages: string[];
  contentHighlights: ContentHighlight[];
  testimonials: Testimonial[];
  audienceText: string;
  salesCount: number | null;
  fileUrl: string;
  // Video de presentación (se sube a Vercel Blob; opcional)
  videoUrl: string;
  // --- SEO ---
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  coverImageAlt: string;
  // Etiquetas separadas por coma (el servidor las limpia y las guarda como lista)
  tags: string;
  faq: FaqItem[];
  published: boolean;
};

const emptyValues: ProductFormValues = {
  slug: "", title: "", description: "", priceLabel: "",
  priceArs: null, priceUsd: null, categoryId: "", isCollection: false, parentId: "", variantLabel: "",
  amazonKindleUrl: "", amazonKindlePrice: "", amazonPaperbackUrl: "", amazonPaperbackPrice: "",
  lemonVariantId: "", coverImage: "", coverImagePosition: 50,
  heroImage: "", heroImagePosition: 50,
  galleryImages: [], contentHighlights: [], testimonials: [],
  audienceText: "", salesCount: null, fileUrl: "", videoUrl: "",
  metaTitle: "", metaDescription: "", focusKeyword: "", coverImageAlt: "", tags: "", faq: [],
  published: false,
};

export type CategoryOption = { id: string; label: string };
export type CollectionOption = { id: string; title: string; categoryLabel: string };

type ProductMode = "single" | "collection" | "design";

export function ProductForm({
  initial,
  categories,
  collections,
  defaultParentId,
}: {
  initial?: ProductFormValues;
  /** Todas las categorías y subcategorías, con su nombre completo (ej. «Imprimibles › Calendarios»). */
  categories: CategoryOption[];
  /** Las colecciones con varios diseños que ya existen (para crear un diseño dentro de una). */
  collections: CollectionOption[];
  /** Al crear un producto nuevo desde «+ Agregar diseño»: la colección en la que se arranca. */
  defaultParentId?: string;
}) {
  const router = useRouter();
  const isEditing = Boolean(initial?.id);
  const [values, setValues] = useState<ProductFormValues>(
    initial
      ? // En un diseño, el texto «Lo que hace especial» es texto simple: no pasa por el editor visual.
        { ...initial, description: initial.parentId ? initial.description : descriptionToEditorHtml(initial.description) }
      : { ...emptyValues, parentId: defaultParentId && collections.some((c) => c.id === defaultParentId) ? defaultParentId : "" }
  );
  const [slugTouched, setSlugTouched] = useState(isEditing);
  // El tipo de producto sale de dos datos: si tiene colección es un diseño; si está marcado, es una colección.
  const mode: ProductMode = values.parentId ? "design" : values.isCollection ? "collection" : "single";
  const parentCollection = collections.find((c) => c.id === values.parentId) ?? null;
  const setMode = (next: ProductMode) =>
    setValues((v) => ({
      ...v,
      isCollection: next === "collection",
      // Al pasar a diseño se elige la primera colección; al salir de diseño se vacía.
      parentId: next === "design" ? (v.parentId || collections[0]?.id || "") : "",
    }));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [videoBusy, setVideoBusy] = useState(false);
  const [error, setError] = useState("");

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const onTitleChange = (title: string) => {
    set("title", title);
    if (!slugTouched) set("slug", slugify(title));
  };

  const uploadFile = async (file: File, tag: string): Promise<string | null> => {
    setUploading(tag);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir el archivo");
      return data.url as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir el archivo");
      return null;
    } finally {
      setUploading(null);
    }
  };

  const onCoverFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file, "cover");
    if (url) set("coverImage", url);
    e.target.value = "";
  };

  const onHeroFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file, "hero");
    if (url) set("heroImage", url);
    e.target.value = "";
  };

  const onPdfFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file, "pdf");
    if (url) set("fileUrl", url);
    e.target.value = "";
  };

  const onGalleryFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file, "gallery");
    if (url) set("galleryImages", [...values.galleryImages, url]);
    e.target.value = "";
  };

  const removeGalleryImage = (index: number) => {
    set("galleryImages", values.galleryImages.filter((_, i) => i !== index));
  };

  const addHighlight = () => {
    set("contentHighlights", [...values.contentHighlights, { title: "", description: "" }]);
  };
  const updateHighlight = (index: number, field: keyof ContentHighlight, value: string) => {
    const next = [...values.contentHighlights];
    next[index] = { ...next[index], [field]: value };
    set("contentHighlights", next);
  };
  const removeHighlight = (index: number) => {
    set("contentHighlights", values.contentHighlights.filter((_, i) => i !== index));
  };

  const addTestimonial = () => {
    set("testimonials", [...values.testimonials, { name: "", stars: 5, text: "", shared: 0 }]);
  };
  const updateTestimonial = (index: number, field: keyof Testimonial, value: string | number) => {
    const next = [...values.testimonials];
    next[index] = { ...next[index], [field]: value } as Testimonial;
    set("testimonials", next);
  };
  const removeTestimonial = (index: number) => {
    set("testimonials", values.testimonials.filter((_, i) => i !== index));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (mode !== "design" && isDescriptionEmpty(values.description)) {
      setError("Escribe la descripción del producto.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const url = isEditing ? `/api/admin/products/${initial!.id}` : "/api/admin/products";
      const method = isEditing ? "PUT" : "POST";
      // Un diseño no lleva título propio: el servidor lo arma como «Colección · Diseño». Su dirección se conserva al editar.
      const payload =
        mode === "design"
          ? { ...values, title: "", slug: isEditing ? values.slug : "", isCollection: false }
          : { ...values, parentId: "", variantLabel: "" };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar el producto");
      router.push("/admin/productos");
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
  const uploadBtnClass =
    "focus-ring shrink-0 cursor-pointer rounded-lg border border-gold/40 px-3 py-2.5 font-ui text-xs uppercase tracking-wide text-gold hover:bg-gold/10";
  const addBtnClass =
    "focus-ring flex items-center gap-1.5 rounded-full border border-dashed border-gold/40 px-4 py-2 font-ui text-xs uppercase tracking-wide text-gold hover:bg-gold/10";
  const removeBtnClass = "font-ui text-xs uppercase tracking-wide text-wine-bright hover:underline";

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {isEditing && values.slug && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gold/25 bg-gold/5 px-5 py-4">
          <p className="max-w-xl font-ui text-xs leading-relaxed text-gold-pale/85">
            <span className="block font-medium uppercase tracking-wide text-gold">Link para compartir con seguimiento</span>
            Elige dónde lo vas a compartir (YouTube, Instagram…) y se copia el link de este{" "}
            {mode === "design" ? "diseño" : "producto"} con la fuente marcada. Las visitas aparecen en Admin › Estadísticas.
          </p>
          <TrackedLinkMenu path={`/tienda/${values.slug}`} label="Copiar link" />
        </div>
      )}
      {error && (
        <div role="alert" className="rounded-lg border border-wine/50 bg-wine/10 px-4 py-3 font-ui text-sm text-wine-bright">
          {error}
        </div>
      )}

      {/* Tipo de producto: define qué campos se piden y cómo se muestra en la tienda */}
      <FormSection
        id="tipo"
        eyebrow="Punto de partida"
        title="¿Qué estás cargando?"
        help="Define qué datos se piden más abajo y cómo se muestra en la tienda."
      >
        <div className="grid gap-3 sm:grid-cols-3" role="group" aria-label="Tipo de producto">
          {MODE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={mode === option.value}
              onClick={() => setMode(option.value)}
              className={`focus-ring rounded-xl border-2 p-4 text-left transition ${
                mode === option.value ? "border-gold bg-gold/10" : "border-gold/25 hover:border-gold/60"
              }`}
            >
              <span className="block font-display text-sm text-gold-pale">{option.title}</span>
              <span className="mt-1 block font-ui text-xs leading-snug text-gold-dim">{option.help}</span>
            </button>
          ))}
        </div>

        {mode === "design" && (
          <div className="space-y-4 pt-2">
            {collections.length === 0 ? (
              <p className="rounded-lg border border-wine/50 bg-wine/10 px-4 py-3 font-ui text-sm text-wine-bright">
                Todavía no hay ninguna colección. Primero crea una: elige «Colección con varios diseños» arriba, guárdala, y
                después agrégale sus diseños.
              </p>
            ) : (
              <>
                <div>
                  <label className={labelClass} htmlFor="parentId">Colección a la que pertenece</label>
                  <select id="parentId" required className={inputClass} value={values.parentId}
                    onChange={(e) => set("parentId", e.target.value)}>
                    {collections.map((c) => (
                      <option key={c.id} value={c.id} className="bg-noir-surface">
                        {c.title} · {c.categoryLabel}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass} htmlFor="variantLabel">Nombre del diseño</label>
                  <input id="variantLabel" required maxLength={80} className={inputClass} value={values.variantLabel}
                    onChange={(e) => set("variantLabel", e.target.value)}
                    placeholder="Ej. Minimal · A4 · semana en una página" />
                  <p className="mt-1.5 font-ui text-xs text-gold-dim">
                    Es el nombre que ve la compradora al elegir el diseño. En la tienda se verá como «
                    {parentCollection?.title ?? "tu colección"}» con este diseño seleccionado.
                  </p>
                </div>
                <div>
                  <label className={labelClass} htmlFor="designDetails">Lo que hace especial a este diseño (opcional)</label>
                  <textarea id="designDetails" rows={6} className={inputClass}
                    value={values.description} onChange={(e) => set("description", e.target.value)}
                    placeholder="Ej. Tipografía serif en dorado sobre fondo negro, semana en una página, espacio para notas lunares…" />
                  <p className="mt-1.5 font-ui text-xs text-gold-dim">
                    Se muestra en la tarjeta de este diseño, debajo de su portada. Úsalo para lo que lo diferencia de los demás
                    (estilo, tipografía, colores, formato). La descripción general de la colección no se repite en cada diseño.
                  </p>
                </div>
                <p className="rounded-lg border border-gold/20 bg-gold/5 px-4 py-3 font-ui text-xs leading-relaxed text-gold-pale/85">
                  Este diseño usa «Para quién es esto», las tarjetas de contenido, los testimonios, las
                  preguntas frecuentes y el SEO de la colección, y la descripción general se muestra una sola vez arriba.
                  Aquí completas lo propio de este diseño: sus detalles, portada, imágenes, precio, archivo PDF y, si quieres,
                  su propio video. Va siempre en la categoría de su colección.
                </p>
              </>
            )}
          </div>
        )}
      </FormSection>

      {mode !== "design" && (
        <FormSection id="datos" eyebrow="Datos principales" title="Nombre y categoría">
          <div>
            <label className={labelClass} htmlFor="title">
              {mode === "collection" ? "Título de la colección" : "Título del producto"}
            </label>
            <input id="title" required className={inputClass} value={values.title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder={mode === "collection" ? "Ej. Calendario astrológico 2027" : "Ej. Guía de efemérides 2026"} />
          </div>

          <div>
            <label className={labelClass} htmlFor="slug">Slug interno</label>
            <input id="slug" required className={inputClass} value={values.slug}
              onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} />
          </div>

          <div>
            <label className={labelClass} htmlFor="categoryId">Categoría en la tienda</label>
            <select id="categoryId" required className={inputClass} value={values.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}>
              <option value="" className="bg-noir-surface">Elige una categoría…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-noir-surface">{c.label}</option>
              ))}
            </select>
            <p className="mt-1.5 font-ui text-xs text-gold-dim">
              Define en qué parte de la tienda aparece{mode === "collection" ? " (y todos sus diseños con ella)" : ""}. ¿Falta una categoría? Créala en
              {" "}<Link href="/admin/categorias" className="underline decoration-gold underline-offset-2 hover:text-gold">Categorías</Link>.
            </p>
          </div>
        </FormSection>
      )}

      {mode !== "design" && (
        <FormSection
          id="descripcion"
          eyebrow="Texto de la ficha"
          title={mode === "collection" ? "Descripción de la colección" : "Descripción del producto"}
          help={
            <>
              {mode === "collection" && "La comparten todos sus diseños. "}
              Se escribe con el mismo editor que los artículos: negrita, subtítulos, citas destacadas, imágenes y enlaces.
              En la tarjeta de la tienda se ve solo el primer párrafo; en la ficha se ve completa.
            </>
          }
        >
          <div>
            <label className={labelClass} htmlFor="description">Descripción</label>
            <RichTextEditor
              value={values.description}
              onChange={(html) => set("description", html)}
              onImageUpload={(file) => uploadFile(file, "editor")}
            />
          </div>
        </FormSection>
      )}

      {mode !== "design" && (
        <FormSection
          id="audiencia"
          eyebrow="Texto de la ficha"
          title="Para quién es esto"
          help={FORMAT_HINT}
        >
          <div>
            <label className={labelClass} htmlFor="audienceText">Texto</label>
            <textarea id="audienceText" rows={8} className={inputClass}
              value={values.audienceText}
              onChange={(e) => set("audienceText", e.target.value)}
              placeholder={"Este libro es para ti si:\n• Sientes que algo se está moviendo en tu vida.\n• Estás cerca de los 29, 37 o 42 años.\n• Quieres entender tu carta natal desde cero."} />
            <TextPreview text={values.audienceText} />
          </div>
        </FormSection>
      )}

      {mode === "collection" && (
        <p className="rounded-lg border border-gold/20 bg-gold/5 px-4 py-3 font-ui text-xs leading-relaxed text-gold-pale/85">
          Una colección no tiene precio ni PDF propios: se compran sus diseños. Guárdala y, desde la lista de productos,
          usa «+ Agregar diseño» para cargar cada estilo o formato. Mientras no tenga al menos un diseño publicado, no se
          muestra en la tienda.
        </p>
      )}

      {mode !== "collection" && (
        <FormSection
          id="precio"
          eyebrow="Venta"
          title="Precio"
          help="Es el precio que se publica en la web. Con Mercado Pago se cobra en pesos, al dólar blue del día más el margen; con PayPal se cobra en dólares."
        >
          <div>
            <label className={labelClass} htmlFor="priceUsd">Precio en dólares (USD)</label>
            <input id="priceUsd" type="number" min={0} step="0.01" className={`${inputClass} sm:max-w-xs`}
              value={values.priceUsd ?? ""}
              onChange={(e) => set("priceUsd", e.target.value === "" ? null : Number(e.target.value))}
              placeholder="Ej. 9.99" />
            <p className="mt-1.5 font-ui text-xs text-gold-dim">
              Déjalo vacío si el producto no se vende como PDF.
            </p>
          </div>

          {mode === "single" && (
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="priceLabel">Texto del precio (opcional)</label>
                <input id="priceLabel" className={inputClass} value={values.priceLabel}
                  onChange={(e) => set("priceLabel", e.target.value)} placeholder="Si lo dejas vacío se arma solo con el precio en USD" />
              </div>
              <div>
                <label className={labelClass} htmlFor="lemonVariantId">Variant ID de Lemon Squeezy</label>
                <input id="lemonVariantId" className={inputClass} value={values.lemonVariantId}
                  onChange={(e) => set("lemonVariantId", e.target.value)}
                  placeholder="Todavía no usamos Lemon Squeezy en la tienda" />
              </div>
            </div>
          )}
        </FormSection>
      )}

      {mode !== "collection" && (
        <FormSection
          id="amazon"
          eyebrow="Venta"
          title="Venta en Amazon (opcional)"
          help="Si el libro también se vende en Amazon, completa los links y los precios que se muestran. Déjalos vacíos si no aplica."
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="amazonKindleUrl">Link Kindle (versión digital)</label>
              <input id="amazonKindleUrl" className={inputClass} value={values.amazonKindleUrl}
                onChange={(e) => set("amazonKindleUrl", e.target.value)}
                placeholder="https://www.amazon.com/dp/tu-ebook" />
            </div>
            <div>
              <label className={labelClass} htmlFor="amazonKindlePrice">Precio a mostrar (Kindle)</label>
              <input id="amazonKindlePrice" className={inputClass} value={values.amazonKindlePrice}
                onChange={(e) => set("amazonKindlePrice", e.target.value)}
                placeholder="Ej. €5,99" />
            </div>
            <div>
              <label className={labelClass} htmlFor="amazonPaperbackUrl">Link tapa blanda (libro físico)</label>
              <input id="amazonPaperbackUrl" className={inputClass} value={values.amazonPaperbackUrl}
                onChange={(e) => set("amazonPaperbackUrl", e.target.value)}
                placeholder="https://www.amazon.com/dp/tu-libro-fisico" />
            </div>
            <div>
              <label className={labelClass} htmlFor="amazonPaperbackPrice">Precio a mostrar (tapa blanda)</label>
              <input id="amazonPaperbackPrice" className={inputClass} value={values.amazonPaperbackPrice}
                onChange={(e) => set("amazonPaperbackPrice", e.target.value)}
                placeholder="Ej. USD 14,99" />
            </div>
          </div>
        </FormSection>
      )}

      <FormSection id="img-tarjeta" eyebrow="Imágenes" title="Imagen de la tarjeta" help="Cuadrada: es la primera que ve el usuario en la tienda.">
        <div className="flex items-center gap-3">
          <input className={inputClass} value={values.coverImage}
            onChange={(e) => set("coverImage", e.target.value)} placeholder="URL de la imagen" />
          <label className={uploadBtnClass}>
            {uploading === "cover" ? "Subiendo…" : "Subir"}
            <input type="file" accept="image/*" className="hidden" onChange={onCoverFileChange} />
          </label>
        </div>
        {values.coverImage && (
          <div>
            <div className="h-40 w-full max-w-xs overflow-hidden rounded-lg border border-gold/20 bg-noir-surface2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={values.coverImage} alt="Vista previa" className="h-full w-full object-cover"
                style={{ objectPosition: `center ${values.coverImagePosition}%` }} />
            </div>
            <label className={labelClass + " mt-3"}>Posición vertical de la imagen</label>
            <input type="range" min={0} max={100} value={values.coverImagePosition}
              onChange={(e) => set("coverImagePosition", Number(e.target.value))}
              className="w-full max-w-xs accent-gold" />
          </div>
        )}
      </FormSection>

      <FormSection id="img-grande" eyebrow="Imágenes" title="Imagen grande" help="Para la ficha completa del producto.">
        <div className="flex items-center gap-3">
          <input className={inputClass} value={values.heroImage}
            onChange={(e) => set("heroImage", e.target.value)} placeholder="URL de la imagen" />
          <label className={uploadBtnClass}>
            {uploading === "hero" ? "Subiendo…" : "Subir"}
            <input type="file" accept="image/*" className="hidden" onChange={onHeroFileChange} />
          </label>
        </div>
        {values.heroImage && (
          <div>
            <div className="h-52 w-full max-w-md overflow-hidden rounded-lg border border-gold/20 bg-noir-surface2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={values.heroImage} alt="Vista previa" className="h-full w-full object-cover"
                style={{ objectPosition: `center ${values.heroImagePosition}%` }} />
            </div>
            <label className={labelClass + " mt-3"}>Posición vertical de la imagen</label>
            <input type="range" min={0} max={100} value={values.heroImagePosition}
              onChange={(e) => set("heroImagePosition", Number(e.target.value))}
              className="w-full max-w-md accent-gold" />
          </div>
        )}
      </FormSection>

      <FormSection
        id="capturas"
        eyebrow="Imágenes"
        title="Capturas del interior del PDF"
        help="3 o 4 recomendadas. Páginas reales del manual, no la tapa: le muestran al comprador qué va a encontrar adentro."
      >
        {values.galleryImages.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {values.galleryImages.map((url, i) => (
              <div key={i} className="relative h-24 w-24 overflow-hidden rounded-lg border border-gold/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Captura ${i + 1}`} className="h-full w-full object-cover" />
                <button type="button" onClick={() => removeGalleryImage(i)} aria-label={`Quitar la captura ${i + 1}`}
                  className="absolute right-1 top-1 rounded-full bg-noir-bg/80 px-1.5 py-0.5 text-xs text-gold-pale hover:bg-wine/80">
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div>
          <label className={uploadBtnClass + " inline-block"}>
            {uploading === "gallery" ? "Subiendo…" : "+ Agregar captura"}
            <input type="file" accept="image/*" className="hidden" onChange={onGalleryFileChange} />
          </label>
        </div>
      </FormSection>

      <FormSection
        id="video"
        eyebrow="Video"
        title={mode === "design" ? "Video de este diseño (opcional)" : "Video de presentación (opcional)"}
        help={
          mode === "design"
            ? "Se muestra en la ficha de este diseño, con el título «Mira este diseño». Si no cargas un video, esa sección no aparece en su ficha."
            : mode === "collection"
              ? "Se muestra en la ficha de la colección, debajo de la portada, con el título «Mira la presentación». Si no cargas un video, esa sección no aparece."
              : "Se muestra en la ficha pública del producto, debajo de la portada y los botones de compra, con el título «Mira la presentación». Si no cargas un video, esa sección no aparece."
        }
      >
        <VideoUploadField value={values.videoUrl} onChange={(url) => set("videoUrl", url)} onBusyChange={setVideoBusy} />
      </FormSection>

      {mode !== "design" && (
        <FormSection
          id="tarjetas"
          eyebrow="Texto de la ficha"
          title="Qué vas a recibir (tarjetas de contenido)"
          help={<>Cada tarjeta se ve completa en la ficha, una al lado de la otra. {FORMAT_HINT}</>}
        >
          {values.contentHighlights.map((h, i) => (
            <div key={i} className="space-y-2 rounded-xl border-2 border-gold/35 bg-noir-bg p-4">
              <div className="flex items-center justify-between">
                <span className="font-ui text-sm font-semibold text-gold-pale">Tarjeta {i + 1}</span>
                <button type="button" onClick={() => removeHighlight(i)} className={removeBtnClass}>Quitar</button>
              </div>
              <input className={inputClass} placeholder="Título, ej. Orientación junguiana"
                value={h.title} onChange={(e) => updateHighlight(i, "title", e.target.value)} />
              <textarea className={inputClass} rows={6} placeholder={"Descripción. Para una lista, una línea por ítem:\n• Primer punto\n• Segundo punto"}
                value={h.description} onChange={(e) => updateHighlight(i, "description", e.target.value)} />
              <TextPreview text={h.description} />
            </div>
          ))}

          <button type="button" onClick={addHighlight} className={addBtnClass}>+ Agregar tarjeta de contenido</button>
        </FormSection>
      )}

      {mode !== "design" && (
        <FormSection
          id="testimonios"
          eyebrow="Prueba social"
          title="Testimonios"
          help="Lo que dicen quienes ya lo leyeron. Se muestran como carrusel de tarjetas que se deslizan solas, entre «Para quién es esto» y «Qué vas a recibir». Pega el comentario tal cual te lo mandó la persona: hay lugar de sobra para textos largos."
        >
          {values.testimonials.map((t, i) => (
            <div key={i} className="space-y-3 rounded-xl border-2 border-gold/35 bg-noir-bg p-4">
              <div className="flex items-center justify-between">
                <span className="font-ui text-sm font-semibold text-gold-pale">Testimonio {i + 1}</span>
                <button type="button" onClick={() => removeTestimonial(i)} className={removeBtnClass}>Quitar</button>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                <input className={inputClass} placeholder="Nombre y apellido, o apodo"
                  value={t.name} onChange={(e) => updateTestimonial(i, "name", e.target.value)} />
                <select className={inputClass} value={t.stars}
                  onChange={(e) => updateTestimonial(i, "stars", Number(e.target.value))}>
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
                </select>
                <input type="number" min={0} className={inputClass} placeholder="Compartido X veces"
                  value={t.shared} onChange={(e) => updateTestimonial(i, "shared", Number(e.target.value))} />
              </div>
              <textarea className={inputClass} rows={10}
                placeholder="Texto completo del comentario: cómo se conectó con los ejercicios, qué aprendió de astrología, qué tan interesante le resultó todo…"
                value={t.text} onChange={(e) => updateTestimonial(i, "text", e.target.value)} />
            </div>
          ))}

          <button type="button" onClick={addTestimonial} className={addBtnClass}>+ Agregar testimonio</button>
        </FormSection>
      )}

      <FormSection
        id="ventas"
        eyebrow="Prueba social"
        title="Cantidad de ventas"
        help="Se muestra como un cartel ancho debajo de los botones de compra: «X personas ya lo compraron». Es un número manual, no se calcula solo. Déjalo vacío para que ese cartel no aparezca."
      >
        <input type="number" min={0} className={`${inputClass} sm:max-w-xs`} placeholder="Ej. 128" aria-label="Cantidad de ventas"
          value={values.salesCount ?? ""}
          onChange={(e) => set("salesCount", e.target.value === "" ? null : Number(e.target.value))} />
      </FormSection>

      {mode !== "design" && (
        <ProductSeoSection
          // La lista de control SEO cuenta el precio en USD como "forma de compra" (usa el campo priceArs).
          // Una colección no tiene precio propio: se da por cumplido, porque se compra por sus diseños.
          values={{ ...values, priceArs: mode === "collection" ? 1 : values.priceArs ?? (values.priceUsd ? values.priceUsd : null) }}
          onChange={(patch) => setValues((v) => ({ ...v, ...patch }))}
        />
      )}

      {mode !== "collection" && (
        <FormSection
          id="pdf"
          eyebrow="Archivo"
          title="Archivo PDF"
          help="Este archivo solo se muestra a quien ya compró el producto (se valida por email en /tienda)."
        >
          <div className="flex items-center gap-3">
            <input id="fileUrl" className={inputClass} value={values.fileUrl}
              onChange={(e) => set("fileUrl", e.target.value)}
              aria-label="Dirección del archivo PDF"
              placeholder="Se completa al subir el PDF, o pega la URL manualmente" />
            <label className={uploadBtnClass}>
              {uploading === "pdf" ? "Subiendo…" : "Subir PDF"}
              <input type="file" accept="application/pdf" className="hidden" onChange={onPdfFileChange} />
            </label>
          </div>
        </FormSection>
      )}

      <FormSection id="publicar" eyebrow="Para terminar" title="Publicación">
        <label className="flex items-center gap-2 font-ui text-sm text-gold-pale/85">
          <input type="checkbox" checked={values.published}
            onChange={(e) => set("published", e.target.checked)} className="h-4 w-4 accent-gold" />
          Publicado (visible en /tienda)
        </label>

        <div className="flex gap-3">
          <button type="submit" disabled={saving || videoBusy}
            className="focus-ring rounded-full bg-gold px-6 py-2.5 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright disabled:opacity-60">
            {saving ? "Guardando…" : videoBusy ? "Subiendo el video…" : isEditing ? "Guardar cambios" : "Crear producto"}
          </button>
        </div>
      </FormSection>
    </form>
  );
}

const FORMAT_HINT =
  "Para separar párrafos dejá una línea en blanco. Para armar una lista, empezá cada línea con «•» o «-». Abajo ves cómo se va a ver.";

const MODE_OPTIONS: { value: ProductMode; title: string; help: string }[] = [
  {
    value: "single",
    title: "Producto único",
    help: "Un e-book, un cuaderno, una guía… con su propia descripción, precio y archivo.",
  },
  {
    value: "collection",
    title: "Colección con varios diseños",
    help: "Una sola descripción para varios estilos o formatos (por ejemplo, un calendario en 5 diseños).",
  },
  {
    value: "design",
    title: "Diseño de una colección",
    help: "Un estilo o formato concreto de una colección que ya creaste. Hereda su descripción.",
  },
];

/** Vista previa de cómo se verá el texto en la ficha: párrafos separados y listas con viñetas. */
function TextPreview({ text, autoParagraphs = false }: { text: string; autoParagraphs?: boolean }) {
  if (!text.trim()) return null;
  return (
    <div className="mt-3 rounded-lg border border-gold/15 bg-noir-bg/50 p-4">
      <p className="mb-2 font-ui text-[11px] uppercase tracking-wide text-gold-dim">Así se va a ver</p>
      <FormattedText text={text} autoParagraphs={autoParagraphs} className="font-body text-base leading-relaxed text-gold-pale/90" />
    </div>
  );
}
