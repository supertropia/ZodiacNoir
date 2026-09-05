"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { useEffect, useRef } from "react";
import { repairPastedPlainText } from "@/lib/legacy-content";

// Editor visual del contenido del artículo.
// Soporta: párrafos, **negrita real** (<strong>), subtítulos H2 y cita
// destacada (pull quote). Todo lo demás de StarterKit se desactiva a
// propósito para no ofrecer opciones que no forman parte del diseño
// editorial del sitio (listas, tachado, código, etc. quedan afuera por ahora).

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
    ],
    content: value || "<p></p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose-zodiac min-h-[320px] w-full rounded-lg border border-gold/25 bg-transparent px-4 py-3 font-body text-base leading-relaxed text-gold-pale focus:border-gold focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

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
      <p className="mt-1.5 font-ui text-xs text-gold-dim">
        Seleccioná texto y usá los botones de arriba. "+ Subtítulo" convierte la línea completa en un
        encabezado H2; "+ Cita destacada" la convierte en una cita resaltada. Para volver a texto normal,
        parate en esa línea y usá "Párrafo normal". Para borrar una imagen ya insertada, hacé click sobre
        ella y apretá Suprimir/Delete.
      </p>
    </div>
  );
}
