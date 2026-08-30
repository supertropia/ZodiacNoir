"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/slugify";

type ContentHighlight = { title: string; description: string };
type Testimonial = { name: string; stars: number; text: string; shared: number };

export type ProductFormValues = {
  id?: string;
  slug: string;
  title: string;
  description: string;
  priceLabel: string;
  priceArs: number | null;
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
  fileUrl: string;
  published: boolean;
};

const emptyValues: ProductFormValues = {
  slug: "", title: "", description: "", priceLabel: "",
  priceArs: null, amazonKindleUrl: "", amazonKindlePrice: "", amazonPaperbackUrl: "", amazonPaperbackPrice: "",
  lemonVariantId: "", coverImage: "", coverImagePosition: 50,
  heroImage: "", heroImagePosition: 50,
  galleryImages: [], contentHighlights: [], testimonials: [],
  audienceText: "", fileUrl: "", published: false,
};

export function ProductForm({ initial }: { initial?: ProductFormValues }) {
  const router = useRouter();
  const isEditing = Boolean(initial?.id);
  const [values, setValues] = useState<ProductFormValues>(initial ?? emptyValues);
  const [slugTouched, setSlugTouched] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
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
    setSaving(true);
    setError("");
    try {
      const url = isEditing ? `/api/admin/products/${initial!.id}` : "/api/admin/products";
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
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
  const sectionClass = "space-y-4 rounded-xl border border-gold/15 p-5";
  const addBtnClass =
    "focus-ring flex items-center gap-1.5 rounded-full border border-dashed border-gold/40 px-4 py-2 font-ui text-xs uppercase tracking-wide text-gold hover:bg-gold/10";
  const removeBtnClass = "font-ui text-xs uppercase tracking-wide text-wine-bright hover:underline";

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {error && (
        <div className="rounded-lg border border-wine/50 bg-wine/10 px-4 py-3 font-ui text-sm text-wine-bright">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className={labelClass} htmlFor="title">Título del PDF</label>
          <input id="title" required className={inputClass} value={values.title}
            onChange={(e) => onTitleChange(e.target.value)} placeholder="Ej. Guía de efemérides 2026" />
        </div>

        <div>
          <label className={labelClass} htmlFor="slug">Slug interno</label>
          <input id="slug" required className={inputClass} value={values.slug}
            onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} />
        </div>

        <div>
          <label className={labelClass} htmlFor="description">Descripción corta (para la tarjeta)</label>
          <textarea id="description" required rows={3} className={inputClass}
            value={values.description} onChange={(e) => set("description", e.target.value)} />
        </div>

        <div>
          <label className={labelClass} htmlFor="audienceText">Para quién es esto (2-3 líneas)</label>
          <textarea id="audienceText" rows={3} className={inputClass}
            value={values.audienceText}
            onChange={(e) => set("audienceText", e.target.value)}
            placeholder="Ej. Para quienes quieren entender el eclipse desde el mito, no solo desde el horóscopo, e integrar lo que se cierra con un trabajo real de journaling." />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="priceLabel">Precio a mostrar</label>
            <input id="priceLabel" required className={inputClass} value={values.priceLabel}
              onChange={(e) => set("priceLabel", e.target.value)} placeholder="Ej. USD 9,90" />
          </div>
          <div>
            <label className={labelClass} htmlFor="lemonVariantId">Variant ID de Lemon Squeezy</label>
            <input id="lemonVariantId" className={inputClass} value={values.lemonVariantId}
              onChange={(e) => set("lemonVariantId", e.target.value)}
              placeholder="Todavía no usamos Lemon Squeezy en la tienda" />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="priceArs">Precio en ARS (Mercado Pago)</label>
            <input id="priceArs" type="number" min={0} className={inputClass}
              value={values.priceArs ?? ""}
              onChange={(e) => set("priceArs", e.target.value === "" ? null : Number(e.target.value))}
              placeholder="Ej. 12990" />
            <p className="mt-1.5 font-ui text-xs text-gold-dim">
              Dejalo vacío si todavía no querés vender este producto por Mercado Pago.
            </p>
          </div>
          <div>
            <label className={labelClass} htmlFor="amazonKindleUrl">Link Kindle (versión digital) en Amazon</label>
            <input id="amazonKindleUrl" className={inputClass} value={values.amazonKindleUrl}
              onChange={(e) => set("amazonKindleUrl", e.target.value)}
              placeholder="https://www.amazon.com/dp/tu-ebook" />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="amazonKindlePrice">Precio a mostrar (Kindle)</label>
            <input id="amazonKindlePrice" className={inputClass} value={values.amazonKindlePrice}
              onChange={(e) => set("amazonKindlePrice", e.target.value)}
              placeholder="Ej. €5,99" />
            <p className="mt-1.5 font-ui text-xs text-gold-dim">
              Dejalo vacío si no vendés la versión Kindle en Amazon.
            </p>
          </div>
          <div>
            <label className={labelClass} htmlFor="amazonPaperbackUrl">Link tapa blanda (libro físico) en Amazon</label>
            <input id="amazonPaperbackUrl" className={inputClass} value={values.amazonPaperbackUrl}
              onChange={(e) => set("amazonPaperbackUrl", e.target.value)}
              placeholder="https://www.amazon.com/dp/tu-libro-fisico" />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="amazonPaperbackPrice">Precio a mostrar (tapa blanda)</label>
            <input id="amazonPaperbackPrice" className={inputClass} value={values.amazonPaperbackPrice}
              onChange={(e) => set("amazonPaperbackPrice", e.target.value)}
              placeholder="Ej. USD 14,99" />
            <p className="mt-1.5 font-ui text-xs text-gold-dim">
              Dejalo vacío si no vendés la versión impresa en Amazon.
            </p>
          </div>
        </div>
      </div>

      <div className={sectionClass}>
        <p className="font-display text-sm text-gold-pale">Imagen de la tarjeta (cuadrada, la primera que ve el usuario)</p>
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
              <img src={values.coverImage} alt="Vista previa" className="h-full w-full object-cover"
                style={{ objectPosition: `center ${values.coverImagePosition}%` }} />
            </div>
            <label className={labelClass + " mt-3"}>Posición vertical de la imagen</label>
            <input type="range" min={0} max={100} value={values.coverImagePosition}
              onChange={(e) => set("coverImagePosition", Number(e.target.value))}
              className="w-full max-w-xs accent-gold" />
          </div>
        )}
      </div>

      <div className={sectionClass}>
        <p className="font-display text-sm text-gold-pale">Imagen grande (para la ficha completa del producto)</p>
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
              <img src={values.heroImage} alt="Vista previa" className="h-full w-full object-cover"
                style={{ objectPosition: `center ${values.heroImagePosition}%` }} />
            </div>
            <label className={labelClass + " mt-3"}>Posición vertical de la imagen</label>
            <input type="range" min={0} max={100} value={values.heroImagePosition}
              onChange={(e) => set("heroImagePosition", Number(e.target.value))}
              className="w-full max-w-md accent-gold" />
          </div>
        )}
      </div>

      <div className={sectionClass}>
        <p className="font-display text-sm text-gold-pale">Capturas del interior del PDF (3-4 recomendadas)</p>
        <p className="font-ui text-xs text-gold-dim">Páginas reales del manual, no la tapa — le muestran al comprador qué va a encontrar adentro.</p>

        {values.galleryImages.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {values.galleryImages.map((url, i) => (
              <div key={i} className="relative h-24 w-24
