"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export type EventFormValues = {
  id?: string;
  title: string;
  subtitle: string;
  description: string;
  eventDate: string; // formato datetime-local: YYYY-MM-DDTHH:mm
  articleSlug: string;
  guideUrl: string;
  active: boolean;
};

export function EventForm({ initial }: { initial?: EventFormValues }) {
  const router = useRouter();
  const isEditing = Boolean(initial?.id);
  const [values, setValues] = useState<EventFormValues>(
    initial ?? {
      title: "",
      subtitle: "",
      description: "",
      eventDate: "",
      articleSlug: "",
      guideUrl: "",
      active: true,
    }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = <K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = isEditing ? `/api/admin/events/${initial!.id}` : "/api/admin/events";
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      router.push("/admin/eventos");
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
        <label className={labelClass} htmlFor="subtitle">Texto pequeño de arriba (opcional)</label>
        <input
          id="subtitle"
          className={inputClass}
          placeholder="Prepárate para la próxima fase lunar"
          value={values.subtitle}
          onChange={(e) => set("subtitle", e.target.value)}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="title">Título del evento</label>
        <input
          id="title"
          required
          className={inputClass}
          placeholder="Eclipse total de sol en Leo"
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="eventDate">Fecha y hora exacta (tu zona horaria)</label>
        <input
          id="eventDate"
          type="datetime-local"
          required
          className={inputClass}
          value={values.eventDate}
          onChange={(e) => set("eventDate", e.target.value)}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="description">Descripción breve (debajo del contador)</label>
        <textarea
          id="description"
          rows={3}
          className={inputClass}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="articleSlug">
            Slug de artículo relacionado (botón "Ver artículo")
          </label>
          <input
            id="articleSlug"
            className={inputClass}
            placeholder="eclipse-solar-total-leo-agosto-2026"
            value={values.articleSlug}
            onChange={(e) => set("articleSlug", e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="guideUrl">
            Enlace externo (botón "Obtener guía" — ej. Gumroad)
          </label>
          <input
            id="guideUrl"
            className={inputClass}
            placeholder="https://gumroad.com/l/tu-ebook"
            value={values.guideUrl}
            onChange={(e) => set("guideUrl", e.target.value)}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 font-ui text-sm text-gold-pale/85">
        <input
          type="checkbox"
          checked={values.active}
          onChange={(e) => set("active", e.target.checked)}
          className="h-4 w-4 accent-[#C9A24B]"
        />
        Activo (visible en el sitio)
      </label>

      <div className="border-t border-gold/15 pt-6">
        <button
          type="submit"
          disabled={saving}
          className="focus-ring rounded-full bg-gold px-6 py-3 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar evento"}
        </button>
      </div>
    </form>
  );
}
