"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/slugify";

export type PlanFormValues = {
  id?: string;
  slug: string;
  name: string;
  description: string;
  priceLabel: string;
  interval: string;
  lemonVariantId: string;
  featured: boolean;
  benefits: string; // separado por "|"
};

export function PlanForm({ initial }: { initial?: PlanFormValues }) {
  const router = useRouter();
  const isEditing = Boolean(initial?.id);
  const [values, setValues] = useState<PlanFormValues>(
    initial ?? {
      slug: "", name: "", description: "", priceLabel: "", interval: "mes",
      lemonVariantId: "", featured: false, benefits: "",
    }
  );
  const [slugTouched, setSlugTouched] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = <K extends keyof PlanFormValues>(key: K, value: PlanFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const onNameChange = (name: string) => {
    set("name", name);
    if (!slugTouched) set("slug", slugify(name));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = isEditing ? `/api/admin/plans/${initial!.id}` : "/api/admin/plans";
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar el plan");
      router.push("/admin/planes");
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
        <label className={labelClass} htmlFor="name">Nombre del plan</label>
        <input id="name" required className={inputClass} value={values.name}
          onChange={(e) => onNameChange(e.target.value)} placeholder="Ej. Plus Mensual" />
      </div>

      <div>
        <label className={labelClass} htmlFor="slug">Slug interno</label>
        <input id="slug" required className={inputClass} value={values.slug}
          onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} />
      </div>

      <div>
        <label className={labelClass} htmlFor="description">Descripción</label>
        <textarea id="description" required rows={2} className={inputClass}
          value={values.description} onChange={(e) => set("description", e.target.value)} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="priceLabel">Precio a mostrar</label>
          <input id="priceLabel" required className={inputClass} value={values.priceLabel}
            onChange={(e) => set("priceLabel", e.target.value)} placeholder="Ej. USD 7/mes" />
        </div>
        <div>
          <label className={labelClass} htmlFor="interval">Intervalo</label>
          <select id="interval" className={inputClass} value={values.interval}
            onChange={(e) => set("interval", e.target.value)}>
            <option value="mes" className="bg-noir-surface">Mensual</option>
            <option value="año" className="bg-noir-surface">Anual</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="lemonVariantId">
          Variant ID de Lemon Squeezy
        </label>
        <input id="lemonVariantId" required className={inputClass} value={values.lemonVariantId}
          onChange={(e) => set("lemonVariantId", e.target.value)}
          placeholder="Lo copiás desde tu producto en Lemon Squeezy" />
      </div>

      <div>
        <label className={labelClass} htmlFor="benefits">
          Beneficios (uno por línea)
        </label>
        <textarea id="benefits" rows={4} className={inputClass}
          value={values.benefits.split("|").join("\n")}
          onChange={(e) => set("benefits", e.target.value.split("\n").map((l) => l.trim()).filter(Boolean).join("|"))}
          placeholder={"Artículos exclusivos\nEfemérides ampliadas\n10% off en la tienda"} />
      </div>

      <label className="flex items-center gap-2 font-ui text-sm text-gold-pale/85">
        <input type="checkbox" checked={values.featured}
          onChange={(e) => set("featured", e.target.checked)} className="h-4 w-4 accent-gold" />
        Destacar este plan (se muestra como "Recomendado")
      </label>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving}
          className="focus-ring rounded-full bg-gold px-6 py-2.5 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright disabled:opacity-60">
          {saving ? "Guardando…" : isEditing ? "Guardar cambios" : "Crear plan"}
        </button>
      </div>
    </form>
  );
}
