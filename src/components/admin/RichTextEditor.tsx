"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { useEffect, useRef, useState } from "react";
import { repairPastedPlainText } from "@/lib/legacy-content";

type LinkSearchResult = { type: "articulo" | "producto"; title: string; href: string };

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Panel de "+ Enlace interno": busca artículos/productos existentes por título
// (vía /api/admin/link-search) e inserta el enlace correcto sin que la
// editora tenga que recordar ni tipear ninguna URL. También permite pegar una
// URL externa a mano y quitar un enlace ya aplicado.
function LinkPanel({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LinkSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const hasSelection = !editor.state.selection.empty;

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/link-search?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const applyResult = (result: LinkSearchResult) => {
    if (hasSelection) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: result.href }).run();
    } else {
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${result.href}">${escapeHtml(result.title)}</a>&nbsp;`)
        .run();
    }
    onClose();
  };

  const applyManualUrl = () => {
    const href = manualUrl.trim();
    if (!href) return;
    if (!hasSelection) {
      window.alert("Para pegar una URL externa, primero seleccioná el texto que va a quedar enlazado.");
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    onClose();
  };

  const removeLink = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    onClose();
  };

  return (
    <div className="absolute left-0 top-full z-30 mt-2 w-full max-w-md rounded-lg border border-gold/30 bg-noir-bg p-4 shadow-xl shadow-black/50 sm:w-96">
      <p className="font-ui text-xs uppercase tracking-wide text-gold-dim">Enlazar a un artículo o producto</p>
      <input
        autoFocus
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Escribí parte del título…"
        className="mt-2 w-full rounded-lg border border-gold/25 bg-transparent px-3 py-2 font-ui text-sm text-gold-pale placeholder:text-gold-dim/60 focus:border-gold focus:outline-none"
      />
      {!hasSelection && query.trim().length >= 2 && (
        <p className="mt-1.5 font-ui text-xs text-gold-dim">
          No tenías texto seleccionado: se va a insertar el título como enlace en el punto donde estaba el cursor.
        </p>
      )}
      <div className="mt-2 max-h-56 overflow-y-auto">
        {loading && <p className="px-1 py-2 font-ui text-xs text-gold-dim">Buscando…</p>}
        {!loading && query.trim().length >= 2 && results.length === 0 && (
          <p className="px-1 py-2 font-ui text-xs text-gold-dim">Sin resultados.</p>
        )}
        {results.map((r) => (
          <button
            key={`${r.type}-${r.href}`}
            type="button"
            onClick={() => applyResult(r)}
            className="focus-ring flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left font-ui text-sm text-gold-pale hover:bg-gold/10"
          >
            <span className="truncate">{r.title}</span>
            <span className="shrink-0 rounded-full border border-gold/30 px-2 py-0.5 text-[10px] uppercase tracking-wide text-gold-dim">
              {r.type === "articulo" ? "Artículo" : "Producto"}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-3 border-t border-gold/15 pt-3">
        <p className="font-ui text-xs uppercase tracking-wide text-gold-dim">O pegar una URL externa</p>
        <div className="mt-1.5 flex gap-2">
          <input
            type="text"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="https://…"
            className="w-full rounded-lg border border-gold/25 bg-transparent px-3 py-2 font-ui text-sm text-gold-pale placeholder:text-gold-dim/60 focus:border-gold focus:outline-none"
          />
          <button
            type="button"
            onClick={applyManualUrl}
            className="focus-ring shrink-0 rounded-lg border border-gold/40 px-3 py-2 font-ui text-xs uppercase tracking-wide text-gold hover:bg-gold/10"
          >
            Aplicar
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-gold/15 pt-3">
        {editor.isActive("link") ? (
          <button
            type="button"
            onClick={removeLink}
            className="font-ui text-xs uppercase tracking-wide text-wine-bright hover:underline"
          >
            Quitar enlace
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={onClose}
          className="font-ui text-xs uppercase tracking-wide text-gold-dim hover:text-gold"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

// Editor visual del contenido del artículo.
// Soporta: párrafos, **negrita real** (<strong>), subtítulos H2, cita
// destacada (pull quote) y enlaces (internos vía buscador, o externos a
// mano). Todo lo demás de StarterKit se desactiva a propósito para no
// ofrecer opciones que no forman parte del diseño editorial del sitio
// (listas, tachado, código, etc. quedan afuera por ahora).

function ToolbarButton({
  active,
  onClick,
  children,
  label,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={
        "focus-ring rounded-md border px-3 py-1.5 font-ui text-xs uppercase tracking-wide transition " +
        (active
          ? "border-gold bg-gold/15 text-gold"
          : "border-gold/30 text-gold-dim hover:border-gold/60 hover:text-gold")
      }
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  value,
  onChange,
  onImageUpload,
}: {
  value: string;
  onChange: (html: string) => void;
  onImageUpload: (file: File) => Promise<string | null>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [linkPanelOpen, setLinkPanelOpen] = useState(false);
  const [pastingImage, setPastingImage] = useState(false);

  // Referencias que siempre apuntan a lo más reciente: el editor se crea una sola vez,
  // pero la función de subida y el propio editor tienen que estar vigentes cuando se pega.
  const uploadRef = useRef(onImageUpload);
  uploadRef.current = onImageUpload;
  const editorRef = useRef<Editor | null>(null);

  // Sube las imágenes pegadas o arrastradas y las inserta en el artículo.
  // `pos` es el lugar donde se soltó la imagen (null = donde está el cursor).
  const insertImageFiles = async (files: File[], pos: number | null) => {
    setPastingImage(true);
    try {
      let at = pos;
      for (const file of files) {
        const url = await uploadRef.current(file);
        const ed = editorRef.current;
        if (!url || !ed) continue;
        if (at !== null) {
          ed.chain().focus().insertContentAt(at, { type: "image", attrs: { src: url, alt: "" } }).run();
          at = null; // las siguientes van a continuación, donde quedó el cursor
        } else {
          ed.chain().focus().setImage({ src: url, alt: "" }).run();
        }
      }
    } finally {
      setPastingImage(false);
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2] },
        bulletList: false,
        orderedList: false,
        codeBlock: false,
        code: false,
        strike: false,
        horizontalRule: false,
        blockquote: {
          HTMLAttributes: { class: "pull-quote" },
        },
      }),
      Image.configure({
        HTMLAttributes: { class: "article-image" },
        allowBase64: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: false,
        HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
      }),
    ],
    content: value || "<p></p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose-zodiac min-h-[320px] w-full rounded-lg border border-gold/25 bg-transparent px-4 py-3 font-body text-base leading-relaxed text-gold-pale focus:border-gold focus:outline-none",
      },
      // Ctrl+V con una captura de pantalla: se sube sola y queda dentro del artículo.
      // Si lo que se copió trae texto (por ejemplo celdas de Excel o párrafos de Word),
      // se deja el pegado normal para no perder ese texto.
      handlePaste: (_view, event) => {
        const clipboard = event.clipboardData;
        if (!clipboard) return false;
        const images = Array.from(clipboard.files).filter((f) => f.type.startsWith("image/"));
        if (images.length === 0) return false;
        if (clipboard.getData("text/plain").trim()) return false;
        event.preventDefault();
        void insertImageFiles(images, null);
        return true;
      },
      // Arrastrar una imagen desde el escritorio o una carpeta directo al texto.
      handleDrop: (view, event) => {
        const images = Array.from(event.dataTransfer?.files ?? []).filter((f) => f.type.startsWith("image/"));
        if (images.length === 0) return false;
        event.preventDefault();
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos ?? null;
        void insertImageFiles(images, pos);
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });
  editorRef.current = editor;

  useEffect(() => {
    if (editor && value && editor.getHTML() !== value) {
      editor.commands.setContent(value, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  if (!editor) return null;

  return (
    <div>
      <div className="sticky top-24 z-20 mb-2 flex flex-wrap gap-2 rounded-lg border border-gold/20 bg-noir-bg/95 p-2 shadow-lg shadow-black/40 backdrop-blur">
        <ToolbarButton
          label="Negrita"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          Negrita
        </ToolbarButton>
        <ToolbarButton
          label="Subtítulo H2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          + Subtítulo
        </ToolbarButton>
        <ToolbarButton
          label="Cita destacada"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          + Cita destacada
        </ToolbarButton>
        <ToolbarButton
          label="Párrafo normal"
          active={editor.isActive("paragraph")}
          onClick={() => editor.chain().focus().setParagraph().run()}
        >
          Párrafo normal
        </ToolbarButton>
        <ToolbarButton
          label="Insertar imagen"
          onClick={() => fileInputRef.current?.click()}
        >
          + Imagen
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            const url = await onImageUpload(file);
            if (url) {
              editor.chain().focus().setImage({ src: url, alt: "" }).run();
            }
          }}
        />
        <span className="mx-1 w-px self-stretch bg-gold/20" aria-hidden="true" />
        <div className="relative">
          <ToolbarButton
            label="Enlace interno"
            active={editor.isActive("link")}
            onClick={() => setLinkPanelOpen((v) => !v)}
          >
            + Enlace interno
          </ToolbarButton>
          {linkPanelOpen && <LinkPanel editor={editor} onClose={() => setLinkPanelOpen(false)} />}
        </div>
        <span className="mx-1 w-px self-stretch bg-gold/20" aria-hidden="true" />
        <ToolbarButton
          label="Reparar texto pegado"
          onClick={() => {
            const ok = window.confirm(
              "Esto va a reformatear todo el texto actual del editor (útil si pegaste un artículo y quedó con ** o todo junto). Podés revisar el resultado antes de guardar. ¿Continuar?"
            );
            if (!ok) return;
            const rawText = editor.getText({ blockSeparator: "\n\n" });
            const repairedHtml = repairPastedPlainText(rawText);
            editor.commands.setContent(repairedHtml, false);
          }}
        >
          🩹 Reparar texto pegado
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
      {pastingImage && (
        <p role="status" className="mt-1.5 font-ui text-xs text-gold">
          Subiendo imagen… aparecerá en el texto en unos segundos.
        </p>
      )}
      <p className="mt-1.5 font-ui text-xs text-gold-dim">
        Para agregar una imagen o una tabla en captura: copiá la captura y pegala con Ctrl+V (Cmd+V en Mac)
        directamente en el texto, o arrastrá el archivo hasta acá. Se sube sola.
        Seleccioná texto y usá los botones de arriba. "+ Subtítulo" convierte la línea completa en un
        encabezado H2; "+ Cita destacada" la convierte en una cita resaltada. Para volver a texto normal,
        parate en esa línea y usá "Párrafo normal". Para borrar una imagen ya insertada, hacé click sobre
        ella y apretá Suprimir/Delete. "+ Enlace interno" busca artículos y productos por título y arma el
        enlace correcto solo: seleccioná primero el texto que querés que quede enlazado (o dejá el cursor
        donde quieras insertarlo si no hay nada seleccionado).
      </p>
    </div>
  );
}
