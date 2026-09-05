"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/slugify";
import { CATEGORIES } from "@/lib/categories";
import { RichTextEditor } from "./RichTextEditor";

export type ArticleFormValues = {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  sign: string;
  published: boolean;
};

const SIGNS = [
  "", "Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo",
  "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis",
];

export function ArticleForm({ initial }: { initial?: ArticleFormValues }) {
  const router = useRouter();
  const isEditing = Boolean(initial?.id);
  const [values, setValues] = useState<ArticleFormValues>(
    initial ?? {
      slug: "",
      title: "",
      excerpt: "",
      content: "",
      coverImage: "",
      category: "efemerides",
      sign: "",
      published: false,
    }
  );
  const [slugTouched, setSlugTouched] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const coverInputRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof ArticleFormValues>(key: K, value: ArticleFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const onTitleChange = (title: string) => {
    set("title", title);
    if (!slugTouched) set("slug", slugify(title));
  };

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
      const payload = { ...values, published: publishOverride ?? values.published };
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
          // eslint-disable-next-line @next/next/no-img-element
          <img src={values.coverImage} alt="" className="mt-3 h-32 w-full rounded-lg border border-gold/20 object-cover" />
        )}
      </div>

      <div>
        <label className={labelClass} htmlFor="content">Contenido</label>
        <RichTextEditor value={values.content} onChange={(html) => set("content", html)} onImageUpload={uploadImage} />
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
          {saving ? "Guardando…" : "Publicar"}
        </button>
        {values.published && (
          <span className="font-ui text-xs uppercase tracking-wide text-green-400">Este artículo está publicado</span>
        )}
      </div>
    </form>
  );
}
