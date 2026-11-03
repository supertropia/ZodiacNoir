"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export type AdminCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  visible: boolean;
  /** Productos puestos directamente en esta categoría. */
  ownProducts: number;
  /** Productos en esta categoría y en sus subcategorías. */
  totalProducts: number;
  children: AdminCategory[];
};

type Editor = { mode: "create"; parentId: string | null } | { mode: "edit"; id: string } | null;

const inputClass =
  "w-full rounded-lg border border-gold/25 bg-transparent px-4 py-2.5 font-ui text-sm text-gold-pale placeholder:text-gold-dim/60 focus:border-gold focus:outline-none";
const labelClass = "mb-1.5 block font-ui text-xs uppercase tracking-wide text-gold-dim";
const smallBtn =
  "focus-ring rounded-full border border-gold/40 px-3.5 py-1.5 font-ui text-xs uppercase tracking-wide text-gold transition hover:border-gold hover:bg-gold/10 disabled:opacity-40";
const dangerBtn =
  "focus-ring rounded-full border border-wine/60 px-3.5 py-1.5 font-ui text-xs uppercase tracking-wide text-wine-bright transition hover:bg-wine/20 disabled:opacity-40";

/** Pantalla del panel para crear, ordenar, mostrar/ocultar y borrar las categorías de la tienda. */
export function CategoriesManager({ categories }: { categories: AdminCategory[] }) {
  const router = useRouter();
  const [editor, setEditor] = useState<Editor>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const call = async (id: string, url: string, method: string, body?: unknown): Promise<boolean> => {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo completar la acción.");
      router.refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal. Inténtalo de nuevo.");
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const toggleVisible = (cat: AdminCategory) => {
    if (cat.visible) {
      const ok = window.confirm(
        `¿Ocultar «${cat.name}»? Dejará de verse en la tienda (con todo lo que tiene adentro). Los productos siguen abriendo por su enlace directo. Puedes volver a mostrarla cuando quieras.`
      );
      if (!ok) return;
    }
    void call(cat.id, `/api/admin/categories/${cat.id}`, "PUT", { visible: !cat.visible });
  };

  const move = (cat: AdminCategory, direction: "up" | "down") => {
    void call(cat.id, "/api/admin/categories/reorder", "POST", { id: cat.id, direction });
  };

  const remove = (cat: AdminCategory) => {
    if (!window.confirm(`¿Borrar la categoría «${cat.name}»? Esta acción no se puede deshacer.`)) return;
    void call(cat.id, `/api/admin/categories/${cat.id}`, "DELETE");
  };

  const topOptions = categories.map((c) => ({ id: c.id, name: c.name }));

  const renderRow = (cat: AdminCategory, index: number, siblings: AdminCategory[], isChild: boolean) => {
    const busy = busyId === cat.id;
    const isEditing = editor?.mode === "edit" && editor.id === cat.id;
    const creatingChild = editor?.mode === "create" && editor.parentId === cat.id;
    const empty = cat.totalProducts === 0;

    return (
      <li key={cat.id} className={isChild ? "ml-4 sm:ml-8" : ""}>
        <div className="rounded-xl border border-gold/15 bg-noir-surface/40 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 font-ui text-xs uppercase tracking-wide ${
                    cat.visible ? "bg-green-800/40 text-green-300" : "bg-gold/15 text-gold-dim"
                  }`}
                >
                  {cat.visible ? "Visible" : "Oculta"}
                </span>
                <span className="font-ui text-xs text-gold-dim">{isChild ? "Subcategoría" : "Categoría"}</span>
              </div>
              <h3 className="font-display text-lg text-gold-pale">{cat.name}</h3>
              <p className="font-ui text-xs text-gold-dim">
                /tienda/categoria/{cat.slug} · {cat.totalProducts} {cat.totalProducts === 1 ? "producto" : "productos"}
                {!isChild && cat.children.length > 0 ? ` · ${cat.children.length} subcategorías` : ""}
              </p>
              {cat.visible && empty && (
                <p className="mt-1 font-ui text-xs text-gold-dim">
                  Todavía está vacía: no se muestra en la tienda hasta que tenga al menos un producto publicado.
                </p>
              )}
              {!cat.visible && !isChild && (
                <p className="mt-1 font-ui text-xs text-gold-dim">
                  Oculta: ni ella ni lo que tiene adentro se ven en la tienda.
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className={smallBtn} disabled={busy || index === 0} onClick={() => move(cat, "up")} aria-label={`Subir «${cat.name}»`}>
                ↑
              </button>
              <button
                type="button"
                className={smallBtn}
                disabled={busy || index === siblings.length - 1}
                onClick={() => move(cat, "down")}
                aria-label={`Bajar «${cat.name}»`}
              >
                ↓
              </button>
              <button type="button" className={smallBtn} disabled={busy} onClick={() => toggleVisible(cat)}>
                {cat.visible ? "Ocultar" : "Mostrar"}
              </button>
              <button
                type="button"
                className={smallBtn}
                disabled={busy}
                onClick={() => setEditor(isEditing ? null : { mode: "edit", id: cat.id })}
              >
                {isEditing ? "Cerrar" : "Editar"}
              </button>
              {!isChild && (
                <button
                  type="button"
                  className={smallBtn}
                  disabled={busy}
                  onClick={() => setEditor(creatingChild ? null : { mode: "create", parentId: cat.id })}
                >
                  + Subcategoría
                </button>
              )}
              <button type="button" className={dangerBtn} disabled={busy} onClick={() => remove(cat)}>
                Borrar
              </button>
            </div>
          </div>

          {isEditing && (
            <CategoryForm
              key={`edit-${cat.id}`}
              initial={cat}
              parentOptions={cat.children.length > 0 ? null : topOptions.filter((o) => o.id !== cat.id)}
              onDone={() => {
                setEditor(null);
                router.refresh();
              }}
              onCancel={() => setEditor(null)}
            />
          )}

          {creatingChild && (
            <CategoryForm
              key={`create-in-${cat.id}`}
              parentId={cat.id}
              parentName={cat.name}
              onDone={() => {
                setEditor(null);
                router.refresh();
              }}
              onCancel={() => setEditor(null)}
            />
          )}
        </div>

        {cat.children.length > 0 && (
          <ul className="mt-3 space-y-3">{cat.children.map((child, i) => renderRow(child, i, cat.children, true))}</ul>
        )}
      </li>
    );
  };

  return (
    <div>
      {error && (
        <div role="alert" className="mb-5 rounded-lg border border-wine/50 bg-wine/10 px-4 py-3 font-ui text-sm text-wine-bright">
          {error}
        </div>
      )}

      <div className="mb-5">
        <button
          type="button"
          onClick={() => setEditor(editor?.mode === "create" && editor.parentId === null ? null : { mode: "create", parentId: null })}
          className="focus-ring rounded-full bg-gold px-5 py-2.5 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright"
        >
          {editor?.mode === "create" && editor.parentId === null ? "Cancelar" : "+ Nueva categoría"}
        </button>
      </div>

      {editor?.mode === "create" && editor.parentId === null && (
        <div className="mb-5 rounded-xl border border-gold/25 bg-noir-surface/40 p-4 sm:p-5">
          <CategoryForm
            key="create-top"
            parentId={null}
            onDone={() => {
              setEditor(null);
              router.refresh();
            }}
            onCancel={() => setEditor(null)}
          />
        </div>
      )}

      {categories.length === 0 ? (
        <p className="font-body text-lg text-gold-dim">Todavía no hay categorías. Crea la primera con el botón de arriba.</p>
      ) : (
        <ul className="space-y-3">{categories.map((cat, i) => renderRow(cat, i, categories, false))}</ul>
      )}

      <p className="mt-8 max-w-2xl font-ui text-xs leading-relaxed text-gold-dim">
        Consejo: ocultar una categoría no borra nada. Es ideal para preparar una sección nueva con calma y mostrarla cuando
        esté lista. Las categorías vacías no se muestran al público aunque estén visibles. La dirección de cada categoría no
        cambia aunque le cambies el nombre, así los enlaces ya compartidos siguen funcionando.
      </p>
    </div>
  );
}

function CategoryForm({
  initial,
  parentId,
  parentName,
  parentOptions,
  onDone,
  onCancel,
}: {
  initial?: AdminCategory;
  /** Al crear: la categoría principal en la que va (null = categoría principal nueva). */
  parentId?: string | null;
  parentName?: string;
  /** Al editar: categorías principales a las que se puede mover. null = no se puede mover (tiene subcategorías). */
  parentOptions?: { id: string; name: string }[] | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const isEditing = Boolean(initial);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [image, setImage] = useState(initial?.image ?? "");
  const [movedTo, setMovedTo] = useState<string>(initial?.parentId ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const onImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo subir la imagen.");
      setImage(data.url as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload: Record<string, unknown> = { name, description, image };
      if (isEditing && parentOptions) payload.parentId = movedTo || null;
      if (!isEditing) payload.parentId = parentId ?? null;

      const res = await fetch(isEditing ? `/api/admin/categories/${initial!.id}` : "/api/admin/categories", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo guardar.");
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-4 border-t border-gold/15 pt-5">
      <p className="font-display text-base text-gold-pale">
        {isEditing ? "Editar" : parentName ? `Nueva subcategoría dentro de «${parentName}»` : "Nueva categoría"}
      </p>

      {error && (
        <div role="alert" className="rounded-lg border border-wine/50 bg-wine/10 px-4 py-3 font-ui text-sm text-wine-bright">
          {error}
        </div>
      )}

      <div>
        <label className={labelClass} htmlFor={`name-${initial?.id ?? "new"}-${parentId ?? "top"}`}>
          Nombre
        </label>
        <input
          id={`name-${initial?.id ?? "new"}-${parentId ?? "top"}`}
          required
          maxLength={60}
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Calendarios"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor={`desc-${initial?.id ?? "new"}-${parentId ?? "top"}`}>
          Descripción corta (opcional)
        </label>
        <textarea
          id={`desc-${initial?.id ?? "new"}-${parentId ?? "top"}`}
          rows={3}
          maxLength={400}
          className={inputClass}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Una o dos frases que se ven en la tarjeta de la categoría y al abrirla."
        />
      </div>

      <div>
        <label className={labelClass}>Imagen de la categoría (opcional)</label>
        <div className="flex items-center gap-3">
          <input className={inputClass} value={image} onChange={(e) => setImage(e.target.value)} placeholder="URL de la imagen" />
          <label className="focus-ring shrink-0 cursor-pointer rounded-lg border border-gold/40 px-3 py-2.5 font-ui text-xs uppercase tracking-wide text-gold hover:bg-gold/10">
            {uploading ? "Subiendo…" : "Subir"}
            <input type="file" accept="image/*" className="hidden" onChange={onImageChange} />
          </label>
        </div>
        {image && (
          <div className="mt-3 h-28 w-48 overflow-hidden rounded-lg border border-gold/20 bg-noir-surface2">
            <img src={image} alt="Vista previa" className="h-full w-full object-cover" />
          </div>
        )}
        <p className="mt-1.5 font-ui text-xs text-gold-dim">Si no cargas una imagen, la tarjeta muestra un adorno de Zodiac Noir.</p>
      </div>

      {isEditing && parentOptions && (
        <div>
          <label className={labelClass} htmlFor={`parent-${initial!.id}`}>
            Ubicación
          </label>
          <select id={`parent-${initial!.id}`} className={inputClass} value={movedTo} onChange={(e) => setMovedTo(e.target.value)}>
            <option value="" className="bg-noir-surface">
              Categoría principal (no está dentro de otra)
            </option>
            {parentOptions.map((option) => (
              <option key={option.id} value={option.id} className="bg-noir-surface">
                Dentro de «{option.name}»
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-1">
        <button
          type="submit"
          disabled={saving || uploading}
          className="focus-ring rounded-full bg-gold px-6 py-2.5 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright disabled:opacity-60"
        >
          {saving ? "Guardando…" : isEditing ? "Guardar cambios" : "Crear"}
        </button>
        <button type="button" onClick={onCancel} className={smallBtn}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
