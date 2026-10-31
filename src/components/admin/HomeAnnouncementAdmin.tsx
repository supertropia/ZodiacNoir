"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { VideoUploadField } from "@/components/admin/VideoUploadField";
import { HomeAnnouncementCard } from "@/components/HomeAnnouncementCard";
import { ANNOUNCEMENT_LIMITS, type HomeAnnouncementContent } from "@/lib/announcement-shared";
import type { NovedadStats } from "@/lib/novedad-clicks";

const inputClass =
  "w-full rounded-lg border border-gold/25 bg-transparent px-4 py-2.5 font-ui text-sm text-gold-pale placeholder:text-gold-dim/60 focus:border-gold focus:outline-none";
const labelClass = "mb-1.5 block font-ui text-xs uppercase tracking-wide text-gold-dim";
const hintClass = "mt-1.5 font-ui text-xs text-gold-dim";
const sectionClass = "space-y-4 rounded-xl border border-gold/15 p-5";
const uploadBtnClass =
  "focus-ring shrink-0 cursor-pointer rounded-lg border border-gold/40 px-3 py-2.5 font-ui text-xs uppercase tracking-wide text-gold hover:bg-gold/10";

/**
 * Panel de la novedad de la portada: interruptor para mostrarla u ocultarla, formulario con los textos,
 * la imagen, el video y el enlace de Amazon, y una vista previa de cómo se ve en la portada.
 */
export function HomeAnnouncementAdmin({
  enabled,
  initial,
  products,
  stats,
}: {
  enabled: boolean;
  initial: HomeAnnouncementContent;
  products: { slug: string; title: string }[];
  stats: NovedadStats;
}) {
  const router = useRouter();
  const [values, setValues] = useState<HomeAnnouncementContent>(initial);
  const [saved, setSaved] = useState<HomeAnnouncementContent>(initial);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [videoBusy, setVideoBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  const set = <K extends keyof HomeAnnouncementContent>(key: K, value: HomeAnnouncementContent[K]) => {
    setNotice("");
    setValues((v) => ({ ...v, [key]: value }));
  };

  const onImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImageUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo subir la imagen.");
      set("imageUrl", data.url as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la imagen.");
    } finally {
      setImageUploading(false);
    }
  };

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/admin/novedad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo guardar.");
      setSaved(values);
      setNotice(enabled ? "Guardado. Los cambios ya se ven en la portada." : "Guardado.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const onToggle = async () => {
    if (toggling) return;
    if (!enabled && !window.confirm("¿Mostrar la novedad en la portada? Desde este momento la verá cualquier persona que entre al sitio.")) {
      return;
    }
    setToggling(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/admin/novedad", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo guardar el cambio.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal. Inténtalo de nuevo.");
    } finally {
      setToggling(false);
    }
  };

  const busy = saving || imageUploading || videoBusy;
  const lim = ANNOUNCEMENT_LIMITS;

  return (
    <div className="space-y-8">
      {/* Interruptor de visibilidad */}
      <section className="rounded-xl border border-gold/25 bg-noir-surface/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-ui text-xs uppercase tracking-wide text-gold-dim">Estado en la portada</p>
            <p className="mt-1 flex items-center gap-2 font-display text-xl text-gold-pale">
              <span
                aria-hidden="true"
                className={`inline-block h-2.5 w-2.5 rounded-full ${enabled ? "bg-green-500" : "bg-gold-dim/60"}`}
              />
              {enabled ? "Visible para todos" : "Oculta"}
            </p>
          </div>
          <button
            type="button"
            onClick={onToggle}
            disabled={toggling || dirty}
            className={`focus-ring shrink-0 rounded-full px-6 py-2.5 font-ui text-xs font-medium uppercase tracking-wide transition disabled:opacity-50 ${
              enabled ? "border border-gold/50 text-gold hover:bg-gold/10" : "bg-gold text-noir-bg hover:bg-gold-bright"
            }`}
          >
            {toggling ? "Guardando…" : enabled ? "Ocultar la novedad" : "Mostrar en la portada"}
          </button>
        </div>
        {dirty && (
          <p className="mt-3 font-ui text-xs text-gold-pale">
            Tienes cambios sin guardar. Guárdalos abajo para poder {enabled ? "ocultar" : "mostrar"} la novedad.
          </p>
        )}
        <p className={hintClass}>
          Cuando está visible aparece en la portada: un aviso discreto arriba de todo y, debajo, la tarjeta con la imagen y los botones.
          Cuando está oculta, la portada queda exactamente como antes.
        </p>
      </section>

      {/* Estadísticas: cuánta gente vio la novedad y cuánta tocó cada botón */}
      <section aria-labelledby="novedad-stats" className="rounded-xl border border-gold/25 p-5">
        <h2 id="novedad-stats" className="font-display text-xl text-gold-pale">Cómo le va a la novedad</h2>
        <p className="mt-1 font-ui text-xs text-gold-dim">
          Se cuenta una vez por visita. No cuentan tus propias visitas como administradora ni los robots. Un clic en «¡La quiero!»
          es una persona que fue a Amazon: no es una compra confirmada.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {([
            { key: "vista", label: "Vieron la novedad" },
            { key: "amazon", label: `Tocaron «${values.primaryLabel || "¡La quiero!"}»` },
            { key: "ver", label: `Tocaron «${values.secondaryLabel || "Ver por dentro"}»` },
          ] as const).map(({ key, label }) => (
            <div key={key} className="min-w-0 rounded-lg border border-gold/15 bg-noir-surface/40 p-4">
              <p className="font-ui text-xs uppercase tracking-wide text-gold-dim">{label}</p>
              <p className="mt-2 font-display text-3xl text-gold">{stats[key].total.toLocaleString("es-AR")}</p>
              <p className="mt-1 font-ui text-xs text-gold-pale/80">
                Últimos 7 días: {stats[key].last7.toLocaleString("es-AR")} · Últimos 30 días: {stats[key].last30.toLocaleString("es-AR")}
              </p>
            </div>
          ))}
        </div>
        {stats.vista.total > 0 && (
          <p className="mt-4 font-ui text-sm text-gold-pale">
            De cada 100 personas que la vieron, <span className="text-gold">{((stats.amazon.total / stats.vista.total) * 100).toFixed(1).replace(".", ",")}</span> tocaron «{values.primaryLabel || "¡La quiero!"}».
          </p>
        )}
      </section>

      {error && (
        <div role="alert" className="rounded-lg border border-wine/50 bg-wine/10 px-4 py-3 font-ui text-sm text-wine-bright">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="rounded-lg border border-green-800/50 bg-green-900/20 px-4 py-3 font-ui text-sm text-green-300">
          {notice}
        </div>
      )}

      <form onSubmit={onSave} className="space-y-6">
        <div className={sectionClass}>
          <p className="font-display text-sm text-gold-pale">Enlace de Amazon</p>
          <div>
            <label className={labelClass} htmlFor="amazonUrl">Página de las agendas en Amazon</label>
            <input
              id="amazonUrl"
              type="url"
              className={inputClass}
              value={values.amazonUrl}
              onChange={(e) => set("amazonUrl", e.target.value)}
              placeholder="https://www.amazon.com/dp/…"
            />
            <p className={hintClass}>Es a donde lleva el botón principal. Es obligatorio para poder mostrar la novedad.</p>
          </div>
        </div>

        <div className={sectionClass}>
          <p className="font-display text-sm text-gold-pale">Ficha completa de la agenda (botón «Ver por dentro»)</p>
          <div>
            <label className={labelClass} htmlFor="productSlug">Producto de la tienda</label>
            <select
              id="productSlug"
              className={inputClass}
              value={values.productSlug}
              onChange={(e) => set("productSlug", e.target.value)}
            >
              <option value="">Ninguno: «Ver por dentro» abre el video en una ventana</option>
              {values.productSlug && !products.some((p) => p.slug === values.productSlug) && (
                <option value={values.productSlug}>{values.productSlug} (ya no está publicado)</option>
              )}
              {products.map((p) => (
                <option key={p.slug} value={p.slug}>{p.title}</option>
              ))}
            </select>
            <p className={hintClass}>
              Para que la agenda tenga descripción, video y los datos para Google y redes (SEO) como el resto de tus productos,
              créala primero en <b>Panel → Productos</b> (con su link de Amazon y su video) y elígela aquí. Entonces «Ver por dentro»
              lleva a su página en la tienda.
            </p>
          </div>
        </div>

        <div className={sectionClass}>
          <p className="font-display text-sm text-gold-pale">Textos</p>
          <div>
            <label className={labelClass} htmlFor="title">Título</label>
            <input id="title" required maxLength={lim.title} className={inputClass} value={values.title}
              onChange={(e) => set("title", e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="text">Texto debajo del título (opcional)</label>
            <textarea id="text" rows={3} maxLength={lim.text} className={inputClass} value={values.text}
              onChange={(e) => set("text", e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="eyebrow">Palabra sobre el título</label>
              <input id="eyebrow" maxLength={lim.eyebrow} className={inputClass} value={values.eyebrow}
                onChange={(e) => set("eyebrow", e.target.value)} placeholder="Novedad" />
            </div>
            <div>
              <label className={labelClass} htmlFor="pill">Aviso corto de arriba de la portada</label>
              <input id="pill" maxLength={lim.pill} className={inputClass} value={values.pill}
                onChange={(e) => set("pill", e.target.value)} placeholder="Ya están las agendas Zodiac Noir" />
              <p className={hintClass}>Es la línea pequeña que se ve primero, encima del título principal del sitio. Si la dejas vacía se usa el título.</p>
            </div>
            <div>
              <label className={labelClass} htmlFor="primaryLabel">Botón principal</label>
              <input id="primaryLabel" maxLength={lim.label} className={inputClass} value={values.primaryLabel}
                onChange={(e) => set("primaryLabel", e.target.value)} placeholder="¡La quiero!" />
            </div>
            <div>
              <label className={labelClass} htmlFor="secondaryLabel">Botón del video</label>
              <input id="secondaryLabel" maxLength={lim.label} className={inputClass} value={values.secondaryLabel}
                onChange={(e) => set("secondaryLabel", e.target.value)} placeholder="Ver por dentro" />
              <p className={hintClass}>Solo se muestra si cargas un video.</p>
            </div>
          </div>
        </div>

        <div className={sectionClass}>
          <p className="font-display text-sm text-gold-pale">Imagen</p>
          <div className="flex items-center gap-3">
            <input className={inputClass} value={values.imageUrl} onChange={(e) => set("imageUrl", e.target.value)}
              placeholder="URL de la imagen" />
            <label className={uploadBtnClass}>
              {imageUploading ? "Subiendo…" : values.imageUrl ? "Cambiar" : "Subir"}
              <input type="file" accept="image/*" className="hidden" disabled={imageUploading} onChange={onImageChange} />
            </label>
          </div>
          <p className={hintClass}>
            Una foto de la agenda (de frente, con buena luz) o la portada. Puede ser vertical o cuadrada; hasta 5 MB.
          </p>
          {values.imageUrl && (
            <button type="button" onClick={() => set("imageUrl", "")}
              className="font-ui text-xs uppercase tracking-wide text-wine-bright hover:underline">
              Quitar la imagen
            </button>
          )}
        </div>

        <div className={sectionClass}>
          <p className="font-display text-sm text-gold-pale">Video (opcional)</p>
          <p className="font-ui text-xs text-gold-dim">
            Se abre en una ventana al tocar «Ver por dentro» o la imagen. Si elegiste un producto arriba, «Ver por dentro» lleva a
            su página y el video que se mira allí es el del producto (no este). Sin producto ni video, ese botón no aparece.
          </p>
          <VideoUploadField value={values.videoUrl} onChange={(url) => set("videoUrl", url)} onBusyChange={setVideoBusy} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="focus-ring rounded-full bg-gold px-6 py-2.5 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright disabled:opacity-60"
          >
            {saving ? "Guardando…" : videoBusy ? "Subiendo el video…" : imageUploading ? "Subiendo la imagen…" : "Guardar cambios"}
          </button>
          {dirty && !busy && <span className="font-ui text-xs text-gold-pale">Hay cambios sin guardar.</span>}
        </div>
      </form>

      {/* Vista previa: la misma tarjeta que se ve en la portada (los enlaces no navegan) */}
      <section aria-label="Vista previa">
        <p className="mb-3 font-ui text-xs uppercase tracking-wide text-gold-dim">Así se ve en la portada</p>
        <HomeAnnouncementCard content={values} preview />
      </section>
    </div>
  );
}
