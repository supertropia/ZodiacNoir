"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import JSZip from "jszip";
import { upload } from "@vercel/blob/client";
import { CATEGORIES } from "@/lib/categories";
import { readDocx } from "@/lib/import-docx";
import {
  IMPORT_MAX_BYTES,
  IMPORT_UPLOAD_PREFIX,
  formatMegabytes,
  importContentType,
  type ImportUploadKind,
} from "@/lib/import-limits";
import {
  findDuplicateSlugs,
  planImport,
  validateItem,
  type CategoryOption,
  type FileRef,
  type ImportItem,
  type ReadDoc,
} from "@/lib/import-plan";
import { IMAGE_TOKEN, decodeEntities, escapeHtml, htmlToText, normalizeText } from "@/lib/import-template";

type PickedFile = { path: string; name: string; file: File };
type Stage = "pick" | "reading" | "review" | "creating" | "done";

type Row = {
  key: string;
  kind: ImportItem["kind"];
  title: string;
  slug: string;
  status: "created" | "duplicate" | "error";
  message: string;
  id?: string;
  warnings: string[];
  marked: boolean;
  /** «AAAA-MM-DDTHH:MM» en hora de Argentina; vacío = publicar ahora. */
  publishAt: string;
  outcome?: { ok: boolean; text: string };
  published?: boolean;
};

const inputClass =
  "w-full rounded-lg border border-gold/25 bg-transparent px-3 py-2 font-ui text-sm text-gold-pale placeholder:text-gold-dim/60 focus:border-gold focus:outline-none";
const selectClass =
  "w-full rounded-lg border border-gold/25 bg-noir-bg px-3 py-2 font-ui text-sm text-gold-pale focus:border-gold focus:outline-none";
const labelClass = "mb-1 block font-ui text-xs uppercase tracking-wide text-gold-dim";
const primaryBtn =
  "focus-ring rounded-full bg-gold px-5 py-2.5 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-50";
const secondaryBtn =
  "focus-ring cursor-pointer rounded-full border border-gold/40 px-4 py-2 font-ui text-xs uppercase tracking-wide text-gold transition hover:border-gold hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-50";
const cardClass = "rounded-xl border border-gold/15 bg-noir-surface/40 p-5";

const AR_OFFSET = "-03:00";
const AR_TIME_ZONE = "America/Argentina/Buenos_Aires";

function isJunk(path: string, name: string): boolean {
  return name.startsWith("~$") || name.startsWith("._") || name === ".DS_Store" || name.toLowerCase() === "thumbs.db" || path.includes("__MACOSX/");
}

async function expandZip(file: File): Promise<PickedFile[]> {
  const zip = await JSZip.loadAsync(file);
  const out: PickedFile[] = [];
  for (const entry of Object.values(zip.files)) {
    if (entry.dir) continue;
    const name = entry.name.split("/").pop() ?? entry.name;
    if (isJunk(entry.name, name)) continue;
    const blob = await entry.async("blob");
    out.push({ path: entry.name, name, file: new File([blob], name) });
  }
  return out;
}

async function readEntry(entry: FileSystemEntry, prefix: string, out: PickedFile[]): Promise<void> {
  if (entry.isFile) {
    const file = await new Promise<File>((resolve, reject) => (entry as FileSystemFileEntry).file(resolve, reject));
    out.push({ path: `${prefix}${entry.name}`, name: entry.name, file });
  } else if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    let batch: FileSystemEntry[];
    do {
      batch = await new Promise<FileSystemEntry[]>((resolve, reject) => reader.readEntries(resolve, reject));
      for (const child of batch) await readEntry(child, `${prefix}${entry.name}/`, out);
    } while (batch.length > 0);
  }
}

function arToIso(local: string): string | undefined {
  if (!local) return undefined;
  const d = new Date(`${local}:00${AR_OFFSET}`);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function formatAr(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", { timeZone: AR_TIME_ZONE, dateStyle: "medium", timeStyle: "short" });
}

function stemOf(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}

export function ImportWizard({ storeCategories }: { storeCategories: CategoryOption[] }) {
  const [stage, setStage] = useState<Stage>("pick");
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [items, setItems] = useState<ImportItem[]>([]);
  const [include, setInclude] = useState<Record<string, boolean>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [busyMsg, setBusyMsg] = useState("");
  const [busyDetail, setBusyDetail] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const folderInput = useRef<HTMLInputElement>(null);
  const filesInput = useRef<HTMLInputElement>(null);

  const busy = stage === "reading" || stage === "creating" || publishing;

  // Avisa si se intenta cerrar la página mientras se está leyendo, subiendo o publicando.
  useEffect(() => {
    if (!busy) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);

  const fileByPath = useMemo(() => new Map(files.map((f) => [f.path, f])), [files]);
  const duplicates = useMemo(() => findDuplicateSlugs(items), [items]);

  const summary = useMemo(() => {
    const count = { docx: 0, images: 0, pdf: 0, video: 0, other: 0, bytes: 0 };
    for (const f of files) {
      const n = f.name.toLowerCase();
      count.bytes += f.file.size;
      if (n.endsWith(".docx")) count.docx += 1;
      else if (/\.(jpe?g|png|webp|gif)$/.test(n)) count.images += 1;
      else if (n.endsWith(".pdf")) count.pdf += 1;
      else if (/\.(mp4|m4v|webm|mov)$/.test(n)) count.video += 1;
      else count.other += 1;
    }
    return count;
  }, [files]);

  // ------------------------------------------------------------------ Elegir archivos

  const addPicked = async (incoming: PickedFile[]) => {
    setError("");
    const expanded: PickedFile[] = [];
    for (const p of incoming) {
      if (/\.zip$/i.test(p.name)) {
        try {
          expanded.push(...(await expandZip(p.file)));
        } catch {
          setError(`No pude abrir el zip «${p.name}». ¿Está dañado o tiene contraseña?`);
        }
      } else if (!isJunk(p.path, p.name)) {
        expanded.push(p);
      }
    }
    setFiles((prev) => {
      const map = new Map(prev.map((f) => [f.path, f]));
      for (const f of expanded) map.set(f.path, f);
      return Array.from(map.values()).sort((a, b) => a.path.localeCompare(b.path, "es"));
    });
  };

  const onFolderChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    e.target.value = "";
    await addPicked(
      list.map((file) => ({ path: (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name, name: file.name, file }))
    );
  };

  const onFilesChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    e.target.value = "";
    await addPicked(list.map((file) => ({ path: file.name, name: file.name, file })));
  };

  const onDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const entries: FileSystemEntry[] = [];
    for (const item of Array.from(e.dataTransfer.items)) {
      const entry = item.webkitGetAsEntry?.();
      if (entry) entries.push(entry);
    }
    const collected: PickedFile[] = [];
    try {
      if (entries.length > 0) {
        for (const entry of entries) await readEntry(entry, "", collected);
      } else {
        for (const file of Array.from(e.dataTransfer.files)) collected.push({ path: file.name, name: file.name, file });
      }
    } catch {
      setError("No pude leer lo que soltaste. Prueba con los botones «Elegir carpeta» o «Elegir archivos».");
      return;
    }
    await addPicked(collected);
  };

  // ------------------------------------------------------------------ Leer los Word

  const readAll = async () => {
    setStage("reading");
    setError("");
    const docs: ReadDoc[] = [];
    const readNotes: string[] = [];
    const docxFiles = files.filter((f) => /\.docx$/i.test(f.name));
    for (const f of files.filter((x) => /\.doc$/i.test(x.name))) {
      readNotes.push(`«${f.name}» es un Word antiguo (.doc) y no se puede leer. Ábrelo en Word y guárdalo como .docx.`);
    }
    for (let i = 0; i < docxFiles.length; i++) {
      const f = docxFiles[i];
      setBusyMsg(`Leyendo ${f.name} (${i + 1} de ${docxFiles.length})…`);
      await new Promise((r) => setTimeout(r, 0));
      try {
        docs.push(await readDocx(f.path, await f.file.arrayBuffer()));
      } catch (err) {
        console.error("No se pudo leer el Word:", f.name, err);
        readNotes.push(`No pude leer «${f.name}». ¿Está dañado o protegido con contraseña?`);
      }
    }
    const plan = planImport(
      docs,
      files.map((f) => ({ path: f.path, name: f.name, size: f.file.size })),
      storeCategories
    );
    const nextPreviews: Record<string, string> = {};
    for (const it of plan.items) {
      nextPreviews[it.key] = (it.kind === "articulo" ? htmlToText(it.body.replace(/<img[^>]*>/gi, " [imagen] ")) : it.body).slice(0, 1500);
    }
    setItems(plan.items);
    setPreviews(nextPreviews);
    setInclude(Object.fromEntries(plan.items.map((it) => [it.key, true])));
    setNotes([...readNotes, ...plan.notes]);
    setBusyMsg("");
    setStage("review");
  };

  const patchItem = (key: string, patch: Partial<ImportItem>) =>
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));

  const errorsOf = (it: ImportItem): string[] => {
    const errs = validateItem(it);
    if (duplicates.has(`${it.kind}:${it.slug}`)) errs.push("Hay otro elemento de esta importación con la misma dirección (slug). Cámbiala.");
    return errs;
  };

  // ------------------------------------------------------------------ Subir y crear borradores

  const uploadFile = async (file: File, name: string, kind: ImportUploadKind, label: string): Promise<string> => {
    const contentType = importContentType(name, file.type, kind);
    if (!contentType) throw new Error(`«${name}» no es un archivo válido para: ${label}.`);
    if (file.size > IMPORT_MAX_BYTES[kind]) {
      throw new Error(`«${name}» pesa ${formatMegabytes(file.size)} y el máximo es ${formatMegabytes(IMPORT_MAX_BYTES[kind])}.`);
    }
    const safe = name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const blob = await upload(`${IMPORT_UPLOAD_PREFIX}${Date.now()}-${safe}`, file, {
      access: "public",
      handleUploadUrl: "/api/admin/import/token",
      clientPayload: kind,
      multipart: kind !== "image",
      contentType,
      onUploadProgress: ({ percentage }) => setBusyDetail(`${label}: ${name} — ${Math.round(percentage)}%`),
    });
    return blob.url;
  };

  const uploadRef = async (ref: FileRef, kind: ImportUploadKind, label: string, cache: Map<string, string>): Promise<string> => {
    const cached = cache.get(ref.path);
    if (cached) return cached;
    const picked = fileByPath.get(ref.path);
    if (!picked) throw new Error(`No encuentro el archivo «${ref.name}».`);
    const url = await uploadFile(picked.file, picked.name, kind, label);
    cache.set(ref.path, url);
    return url;
  };

  const uploadEmbedded = async (uri: string, slug: string, index: number): Promise<string> => {
    const blob = await (await fetch(uri)).blob();
    const ext = (blob.type.split("/")[1] || "png").replace("jpeg", "jpg");
    const file = new File([blob], `${slug || "articulo"}-imagen-${index}.${ext}`, { type: blob.type });
    return uploadFile(file, file.name, "image", "Imagen del texto");
  };

  const createOne = async (it: ImportItem, cache: Map<string, string>): Promise<Row> => {
    const base: Pick<Row, "key" | "kind" | "title" | "slug" | "marked" | "publishAt"> = {
      key: it.key,
      kind: it.kind,
      title: it.title,
      slug: it.slug,
      marked: true,
      publishAt: it.publishAt,
    };
    try {
      const cover = it.cover ? await uploadRef(it.cover, "image", "Portada", cache) : null;
      let payload: Record<string, unknown>;

      if (it.kind === "articulo") {
        let html = it.body;

        // Imágenes que el texto pide por nombre: [imagen: archivo.jpg | pie].
        const named = new Map<string, string>();
        for (const ref of it.bodyImages) {
          const url = await uploadRef(ref, "image", "Imagen del texto", cache);
          named.set(normalizeText(ref.name), url);
          named.set(normalizeText(stemOf(ref.name)), url);
        }
        html = html.replace(IMAGE_TOKEN, (_m, rawName: string, rawCaption?: string) => {
          const url = named.get(normalizeText(decodeEntities(rawName)));
          if (!url) return "";
          const caption = decodeEntities(rawCaption ?? "").trim();
          return `<figure><img src="${url}" alt="${escapeHtml(caption)}" />${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""}</figure>`;
        });

        // Imágenes incrustadas dentro del Word (tablas, carta natal…): se suben y se reemplazan por su dirección.
        const uris = Array.from(new Set(Array.from(html.matchAll(/src="(data:image\/[a-z0-9+.-]+;base64,[^"]+)"/gi)).map((m) => m[1])));
        for (let n = 0; n < uris.length; n++) {
          setBusyDetail(`Imagen del texto ${n + 1} de ${uris.length}…`);
          const url = await uploadEmbedded(uris[n], it.slug, n + 1);
          html = html.split(uris[n]).join(url);
        }

        payload = {
          kind: "articulo",
          title: it.title,
          slug: it.slug,
          category: it.category,
          sign: it.sign,
          excerpt: it.excerpt,
          content: html,
          coverImage: cover,
          coverImageAlt: it.coverImageAlt,
          isPremium: it.isPremium,
          featuredProductSlug: it.featuredProductSlug,
          metaTitle: it.metaTitle,
          metaDescription: it.metaDescription,
          focusKeyword: it.focusKeyword,
          tags: it.tags,
          faq: it.faq,
          internalLinks: it.internalLinks,
        };
      } else {
        const hero = it.hero ? await uploadRef(it.hero, "image", "Imagen principal", cache) : null;
        const gallery: string[] = [];
        for (const g of it.gallery) gallery.push(await uploadRef(g, "image", "Galería", cache));
        const pdf = it.pdf ? await uploadRef(it.pdf, "pdf", "PDF", cache) : null;
        const video = it.video ? await uploadRef(it.video, "video", "Video", cache) : null;
        payload = {
          kind: "producto",
          title: it.title,
          slug: it.slug,
          categoryId: it.category,
          description: it.body,
          priceUsd: it.priceUsd,
          highlights: it.highlights,
          audienceText: it.audienceText,
          coverImage: cover,
          coverImageAlt: it.coverImageAlt,
          heroImage: hero,
          galleryImages: gallery,
          fileUrl: pdf,
          videoUrl: video,
          metaTitle: it.metaTitle,
          metaDescription: it.metaDescription,
          focusKeyword: it.focusKeyword,
          tags: it.tags,
          faq: it.faq,
        };
      }

      setBusyDetail("Guardando el borrador…");
      const res = await fetch("/api/admin/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; id?: string; status?: string; error?: string; warnings?: string[] };
      if (res.ok && data.ok && data.id) {
        return { ...base, status: "created", id: data.id, message: "Borrador creado.", warnings: data.warnings ?? [] };
      }
      return {
        ...base,
        marked: false,
        status: data.status === "duplicate" ? "duplicate" : "error",
        message: data.error ?? "No se pudo crear el borrador.",
        warnings: [],
      };
    } catch (err) {
      console.error("Error importando:", it.title, err);
      const detail = err instanceof Error ? err.message : "Error inesperado.";
      const hint = /No autorizado/i.test(detail) ? " Vuelve a ingresar al panel." : "";
      return { ...base, marked: false, status: "error", message: `${detail}${hint}`, warnings: [] };
    }
  };

  const createAll = async () => {
    const targets = items.filter((it) => include[it.key] && errorsOf(it).length === 0);
    if (targets.length === 0) return;
    setStage("creating");
    setError("");
    const cache = new Map<string, string>();
    const created: Row[] = [];
    for (let i = 0; i < targets.length; i++) {
      setBusyMsg(`Creando ${i + 1} de ${targets.length}: ${targets[i].title || targets[i].slug}`);
      setBusyDetail("");
      created.push(await createOne(targets[i], cache));
      setRows([...created]);
    }
    setBusyMsg("");
    setBusyDetail("");
    setStage("done");
  };

  // ------------------------------------------------------------------ Aprobar y publicar

  const patchRow = (key: string, patch: Partial<Row>) => setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const publishMarked = async () => {
    const targets = rows.filter((r) => r.status === "created" && r.marked && !r.published && r.id);
    if (targets.length === 0) return;
    const isLater = (r: Row) => {
      const iso = r.kind === "articulo" ? arToIso(r.publishAt) : undefined;
      return iso ? new Date(iso).getTime() > Date.now() : false;
    };
    const later = targets.filter(isLater).length;
    const now = targets.length - later;
    const text = `Vas a publicar ${now} ahora${later > 0 ? ` y programar ${later} para su fecha` : ""}. ¿Confirmas?`;
    if (!window.confirm(text)) return;

    setPublishing(true);
    setError("");
    try {
      const res = await fetch("/api/admin/import/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: targets.map((r) => ({ kind: r.kind, id: r.id, publishAt: r.kind === "articulo" ? arToIso(r.publishAt) : undefined })),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        results?: ({ id: string; ok: true; status: "published" | "scheduled"; publishedAt: string | null; warning?: string } | { id: string; ok: false; error: string })[];
      };
      if (!res.ok || !data.results) {
        setError(data.error ?? "No se pudo publicar. Inténtalo de nuevo.");
      } else {
        const byId = new Map(data.results.map((r) => [r.id, r]));
        setRows((prev) =>
          prev.map((row) => {
            const r = row.id ? byId.get(row.id) : undefined;
            if (!r) return row;
            if (!r.ok) return { ...row, outcome: { ok: false, text: r.error } };
            const when = r.status === "scheduled" && r.publishedAt ? `Programado para el ${formatAr(r.publishedAt)}.` : "Publicado.";
            return { ...row, published: true, marked: false, outcome: { ok: true, text: r.warning ? `${when} ${r.warning}` : when } };
          })
        );
      }
    } catch {
      setError("No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setPublishing(false);
    }
  };

  const reset = () => {
    setStage("pick");
    setFiles([]);
    setItems([]);
    setRows([]);
    setNotes([]);
    setError("");
    setBusyMsg("");
    setBusyDetail("");
  };

  // ------------------------------------------------------------------ Pantallas

  const fileLine = (label: string, ref: FileRef | null) => {
    if (!ref) return null;
    const picked = fileByPath.get(ref.path);
    return (
      <li key={`${label}-${ref.path}`} className="truncate">
        <span className="text-gold-dim">{label}:</span> {ref.name}
        {picked && <span className="text-gold-dim"> · {formatMegabytes(picked.file.size)}</span>}
      </li>
    );
  };

  const validCount = items.filter((it) => include[it.key] && errorsOf(it).length === 0).length;
  const markedCount = rows.filter((r) => r.status === "created" && r.marked && !r.published).length;
  const pendingCount = rows.filter((r) => r.status === "created" && !r.published).length;

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="rounded-xl border border-wine/50 bg-wine/10 px-5 py-4 font-ui text-sm text-wine-bright">
          {error}
        </div>
      )}

      {/* ---------------------------------------------------------- 1. Elegir archivos */}
      {stage === "pick" && (
        <>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`rounded-xl border-2 border-dashed p-8 text-center transition ${dragging ? "border-gold bg-gold/10" : "border-gold/30 bg-noir-surface/30"}`}
          >
            <p className="font-display text-xl text-gold-pale">Suelta aquí la carpeta o el .zip</p>
            <p className="mx-auto mt-2 max-w-xl font-ui text-sm text-gold-dim">
              Con el Word de instrucciones, el Word del texto, las imágenes, el PDF y el video (si lo hay). También puedes
              soltar varias carpetas a la vez: cada artículo o producto va en la suya.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button type="button" className={secondaryBtn} onClick={() => folderInput.current?.click()}>
                Elegir carpeta
              </button>
              <button type="button" className={secondaryBtn} onClick={() => filesInput.current?.click()}>
                Elegir archivos o .zip
              </button>
            </div>
            <input
              ref={folderInput}
              type="file"
              multiple
              className="hidden"
              onChange={onFolderChange}
              {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
            />
            <input ref={filesInput} type="file" multiple className="hidden" onChange={onFilesChange} />
          </div>

          {files.length > 0 && (
            <section className={cardClass}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-ui text-sm text-gold-pale">
                  <strong className="text-gold">{files.length}</strong> archivos ({formatMegabytes(summary.bytes)}): {summary.docx} Word ·{" "}
                  {summary.images} imágenes · {summary.pdf} PDF · {summary.video} video{summary.video === 1 ? "" : "s"}
                  {summary.other > 0 ? ` · ${summary.other} otros (se ignoran)` : ""}
                </p>
                <div className="flex gap-3">
                  <button type="button" className={secondaryBtn} onClick={reset}>
                    Quitar todo
                  </button>
                  <button type="button" className={primaryBtn} onClick={readAll} disabled={summary.docx === 0}>
                    Leer los archivos
                  </button>
                </div>
              </div>
              {summary.docx === 0 && <p className="mt-3 font-ui text-sm text-wine-bright">Falta al menos un Word (.docx) con las instrucciones.</p>}
              <details className="mt-3">
                <summary className="cursor-pointer font-ui text-xs uppercase tracking-wide text-gold-dim">Ver la lista de archivos</summary>
                <ul className="mt-2 max-h-64 space-y-0.5 overflow-auto font-ui text-xs text-gold-pale/80">
                  {files.slice(0, 300).map((f) => (
                    <li key={f.path} className="truncate">
                      {f.path} <span className="text-gold-dim">· {formatMegabytes(f.file.size)}</span>
                    </li>
                  ))}
                </ul>
              </details>
            </section>
          )}
        </>
      )}

      {/* ---------------------------------------------------------- Leyendo / creando */}
      {(stage === "reading" || stage === "creating") && (
        <section className={cardClass} role="status">
          <p className="font-display text-lg text-gold-pale">{stage === "reading" ? "Leyendo los Word…" : "Subiendo archivos y creando borradores…"}</p>
          <p className="mt-2 font-ui text-sm text-gold-pale/90">{busyMsg}</p>
          {busyDetail && <p className="mt-1 font-ui text-xs text-gold-dim">{busyDetail}</p>}
          <p className="mt-3 font-ui text-xs text-gold-dim">No cierres esta página hasta que termine.</p>
          {stage === "creating" && rows.length > 0 && (
            <ul className="mt-4 space-y-1 font-ui text-xs">
              {rows.map((r) => (
                <li key={r.key} className={r.status === "created" ? "text-green-300" : "text-wine-bright"}>
                  {r.status === "created" ? "✓" : "✗"} {r.title || r.slug} — {r.message}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* ---------------------------------------------------------- 2. Revisar */}
      {stage === "review" && (
        <>
          <section className={cardClass}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl text-gold-pale">Esto es lo que entendí</h2>
                <p className="mt-1 font-ui text-sm text-gold-dim">
                  Todavía no se guardó nada. Revisa cada uno: al pulsar el botón se crean como <strong>borrador</strong> (no se ven en la
                  web) y después tú los apruebas.
                </p>
              </div>
              <div className="flex gap-3">
                <button type="button" className={secondaryBtn} onClick={() => setStage("pick")}>
                  ← Cambiar archivos
                </button>
                <button type="button" className={primaryBtn} onClick={createAll} disabled={validCount === 0}>
                  Crear {validCount} borrador{validCount === 1 ? "" : "es"}
                </button>
              </div>
            </div>
            {notes.length > 0 && (
              <ul className="mt-4 space-y-1 font-ui text-sm text-gold">
                {notes.map((n) => (
                  <li key={n}>• {n}</li>
                ))}
              </ul>
            )}
          </section>

          {items.map((it) => {
            const errs = errorsOf(it);
            const ok = errs.length === 0;
            return (
              <section key={it.key} className={`${cardClass} ${ok ? "" : "border-wine/40"}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-5 w-5 accent-[#c9a24b]"
                      checked={Boolean(include[it.key]) && ok}
                      disabled={!ok}
                      onChange={(e) => setInclude((prev) => ({ ...prev, [it.key]: e.target.checked }))}
                      aria-label={`Incluir ${it.title || it.slug}`}
                    />
                    <span className="rounded-full bg-gold/15 px-2.5 py-0.5 font-ui text-xs uppercase tracking-wide text-gold-dim">
                      {it.kind === "articulo" ? "Artículo" : "Producto"}
                    </span>
                    <span className="font-ui text-xs text-gold-dim">{it.sourcePath}</span>
                  </div>
                  <span className={`font-ui text-xs uppercase tracking-wide ${ok ? "text-green-300" : "text-wine-bright"}`}>
                    {ok ? "Listo para crear" : "Hay que corregir"}
                  </span>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Título</label>
                    <input className={inputClass} value={it.title} onChange={(e) => patchItem(it.key, { title: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Dirección (slug)</label>
                    <input className={inputClass} value={it.slug} onChange={(e) => patchItem(it.key, { slug: slugifyLive(e.target.value) })} />
                  </div>
                  <div>
                    <label className={labelClass}>Categoría</label>
                    {it.kind === "articulo" ? (
                      <select className={selectClass} value={it.category} onChange={(e) => patchItem(it.key, { category: e.target.value })}>
                        <option value="">Elegir…</option>
                        {CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select className={selectClass} value={it.category} onChange={(e) => patchItem(it.key, { category: e.target.value })}>
                        <option value="">Elegir…</option>
                        {storeCategories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  {it.kind === "producto" && (
                    <div>
                      <label className={labelClass}>Precio en dólares (USD)</label>
                      <input
                        className={inputClass}
                        inputMode="decimal"
                        value={it.priceUsd}
                        onChange={(e) => patchItem(it.key, { priceUsd: e.target.value })}
                        placeholder="12,50"
                      />
                    </div>
                  )}
                  {it.kind === "articulo" && it.excerpt && (
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Copete</label>
                      <p className="font-ui text-sm text-gold-pale/90">{it.excerpt}</p>
                    </div>
                  )}
                </div>

                <ul className="mt-4 grid gap-x-6 gap-y-1 font-ui text-xs text-gold-pale/90 sm:grid-cols-2">
                  {fileLine("Portada", it.cover)}
                  {fileLine("Imagen principal", it.hero)}
                  {it.gallery.map((g) => fileLine("Galería", g))}
                  {fileLine("PDF", it.pdf)}
                  {fileLine("Video", it.video)}
                  {it.bodyImages.map((b) => fileLine("Imagen del texto", b))}
                </ul>

                <p className="mt-3 font-ui text-xs text-gold-dim">
                  {it.stats.words} palabras
                  {it.kind === "articulo" && ` · ${it.stats.sections} secciones · ${it.stats.images} imágenes · ${it.stats.links} enlaces`}
                  {it.stats.faq > 0 && ` · ${it.stats.faq} preguntas frecuentes`}
                  {it.kind === "articulo" && it.isPremium && " · Premium"}
                  {it.kind === "articulo" && it.publishAt && ` · Fecha indicada: ${it.publishAt.replace("T", " ")}`}
                </p>

                {errs.length > 0 && (
                  <ul className="mt-3 space-y-1 rounded-lg border border-wine/40 bg-wine/10 p-3 font-ui text-sm text-wine-bright">
                    {errs.map((e) => (
                      <li key={e}>✗ {e}</li>
                    ))}
                  </ul>
                )}
                {it.warnings.length > 0 && (
                  <ul className="mt-3 space-y-1 rounded-lg border border-gold/30 bg-gold/5 p-3 font-ui text-sm text-gold">
                    {it.warnings.map((w) => (
                      <li key={w}>⚠ {w}</li>
                    ))}
                  </ul>
                )}

                <details className="mt-3">
                  <summary className="cursor-pointer font-ui text-xs uppercase tracking-wide text-gold-dim">Ver el comienzo del texto</summary>
                  <p className="mt-2 whitespace-pre-line font-ui text-sm text-gold-pale/80">{previews[it.key]}</p>
                </details>
              </section>
            );
          })}
        </>
      )}

      {/* ---------------------------------------------------------- 3. Aprobar */}
      {stage === "done" && (
        <>
          <section className={cardClass}>
            <h2 className="font-display text-xl text-gold-pale">Borradores creados</h2>
            <p className="mt-1 font-ui text-sm text-gold-dim">
              Nada es público todavía. Marca con ✓ lo que apruebas. En los artículos puedes poner una fecha para programar la publicación (hora de
              Argentina); si la dejas vacía, se publica en cuanto confirmes.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className={secondaryBtn}
                onClick={() => setRows((prev) => prev.map((r) => (r.status === "created" && !r.published ? { ...r, marked: true } : r)))}
                disabled={pendingCount === 0}
              >
                Marcar todos
              </button>
              <button
                type="button"
                className={secondaryBtn}
                onClick={() => setRows((prev) => prev.map((r) => ({ ...r, marked: false })))}
                disabled={markedCount === 0}
              >
                Desmarcar
              </button>
              <button type="button" className={primaryBtn} onClick={publishMarked} disabled={markedCount === 0 || publishing}>
                {publishing ? "Publicando…" : `Publicar o programar los marcados (${markedCount})`}
              </button>
              <button type="button" className={secondaryBtn} onClick={reset}>
                Importar otra tanda
              </button>
            </div>
          </section>

          {rows.map((r) => {
            const link = r.id ? (r.kind === "articulo" ? `/admin/articulos/${r.id}` : `/admin/productos/${r.id}`) : null;
            const canMark = r.status === "created" && !r.published;
            return (
              <section key={r.key} className={`${cardClass} ${r.status === "created" ? "" : "border-wine/40"}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5 accent-[#c9a24b]"
                      checked={r.marked}
                      disabled={!canMark}
                      onChange={(e) => patchRow(r.key, { marked: e.target.checked })}
                      aria-label={`Aprobar ${r.title || r.slug}`}
                    />
                    <div>
                      <p className="font-ui text-xs uppercase tracking-wide text-gold-dim">{r.kind === "articulo" ? "Artículo" : "Producto"}</p>
                      <h3 className="font-display text-lg text-gold-pale">{r.title || r.slug}</h3>
                      <p className="font-ui text-xs text-gold-dim">{r.kind === "articulo" ? `/blog/${r.slug}` : `/tienda/${r.slug}`}</p>
                      <p className={`mt-1 font-ui text-sm ${r.status === "created" ? "text-green-300" : "text-wine-bright"}`}>
                        {r.published ? "" : r.status === "created" ? "✓ " : "✗ "}
                        {r.published ? "" : r.message}
                      </p>
                      {r.outcome && <p className={`mt-1 font-ui text-sm ${r.outcome.ok ? "text-green-300" : "text-wine-bright"}`}>{r.outcome.text}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-end gap-3">
                    {r.kind === "articulo" && canMark && (
                      <div>
                        <label className={labelClass}>Programar para (vacío = ahora)</label>
                        <input
                          type="datetime-local"
                          className={inputClass}
                          value={r.publishAt}
                          onChange={(e) => patchRow(r.key, { publishAt: e.target.value })}
                        />
                      </div>
                    )}
                    {link && (
                      <a href={link} target="_blank" rel="noreferrer" className={secondaryBtn}>
                        Abrir borrador ↗
                      </a>
                    )}
                  </div>
                </div>
                {r.warnings.length > 0 && (
                  <ul className="mt-3 space-y-1 rounded-lg border border-gold/30 bg-gold/5 p-3 font-ui text-sm text-gold">
                    {r.warnings.map((w) => (
                      <li key={w}>⚠ {w}</li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}

/** Mientras se escribe una dirección: minúsculas, sin acentos y con guiones (sin recortar el guion final). */
function slugifyLive(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
