"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/slugify";

export type ProductFormValues = {
  id?: string;
  slug: string;
  title: string;
  description: string;
  priceLabel: string;
  lemonVariantId: string;
  coverImage: string;
  fileUrl: string;
  published: boolean;
};

export function ProductForm({ initial }: { initial?: ProductFormValues }) {
  const router = useRouter();
  const isEditing = Boolean(initial?.id);
  const [values, setValues] = useState<ProductFormValues>(
    initial ?? {
      slug: "", title: "", description: "", priceLabel: "",
      lemonVariantId: "", coverImage: "", fileUrl: "", published: false,
    }
  );
  const [slugTouched, setSlugTouched] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const onTitleChange = (title: string) => {
    set("title", title);
    if (!slugTouched) set("slug", slugify(title));
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    setUploading(true);
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
      setUploading(false);
    }
  };

  const onCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file);
    if (url) set("coverImage", url);
    e.target.value = "";
  };

  const onPdfFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file);
    if (url) set("fileUrl", url);
    e.target.value = "";
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

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-wine/50 bg-wine/10 px-4 py-3 font-ui text-sm text-wine-bright">
          {error}
        </div>
      )}

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
        <label className={labelClass} htmlFor="description">Descripción</label>
        <textarea id="description" required rows={3} className={inputClass}
          value={values.description} onChange={(e) => set("description", e.target.value)} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="priceLabel">Precio a mostrar</label>
          <input id="priceLabel" required className={inputClass} value={values.priceLabel}
            onChange={(e) => set("priceLabel", e.target.value)} placeholder="Ej. USD 9" />
        </div>
        <div>
          <label className={labelClass} htmlFor="lemonVariantId">Variant ID de Lemon Squeezy</label>
          <input id="lemonVariantId" required className={inputClass} value={values.lemonVariantId}
            onChange={(e) => set("lemonVariantId", e.target.value)} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Portada (opcional)</label>
        <div className="flex items-center gap-3">
          <input id="coverImage" className={inputClass} value={values.coverImage}
            onChange={(e) => set("coverImage", e.target.value)} placeholder="URL de la imagen" />
          <label className="focus-ring shrink-0 cursor-pointer rounded-lg border border-gold/40 px-3 py-2.5 font-ui text-xs uppercase tracking-wide text-gold hover:bg-gold/10">
            {uploading ? "Subiendo…" : "Subir"}
            <input type="file" accept="image/*" className="hidden" onChange={onCoverFileChange} />
          </label>
        </div>
      </div>

      <div>
        <label className={labelClass}>Archivo PDF</label>
        <div className="flex items-center gap-3">
          <input id="fileUrl" className={inputClass} value={values.fileUrl}
            onChange={(e) => set("fileUrl", e.target.value)}
            placeholder="Se completa al subir el PDF, o pegá la URL manualmente" />
          <label className="focus-ring shrink-0 cursor-pointer rounded-lg border border-gold/40 px-3 py-2.5 font-ui text-xs uppercase tracking-wide text-gold hover:bg-gold/10">
            {uploading ? "Subiendo…" : "Subir PDF"}
            <input type="file" accept="application/pdf" className="hidden" onChange={onPdfFileChange} />
          </label>
        </div>
        <p className="mt-1.5 font-ui text-xs text-gold-dim">
          Este archivo solo se muestra a quien ya compró el producto (se valida por email en /tienda).
        </p>
      </div>

      <label className="flex items-center gap-2 font-ui text-sm text-gold-pale/85">
        <input type="checkbox" checked={values.published}
          onChange={(e) => set("published", e.target.checked)} className="h-4 w-4 accent-gold" />
        Publicado (visible en /tienda)
      </label>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving}
          className="focus-ring rounded-full bg-gold px-6 py-2.5 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright disabled:opacity-60">
          {saving ? "Guardando…" : isEditing ? "Guardar cambios" : "Crear producto"}
        </button>
      </div>
    </form>
  );
}
