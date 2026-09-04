"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

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
}: {
  value: string;
  onChange: (html: string) => void;
}) {
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

  // Si el valor cambia desde afuera (ej: al cargar un artículo existente
  // para editar), sincronizamos el editor una sola vez.
  useEffect(() => {
    if (editor && value && editor.getHTML() !== value) {
      editor.commands.setContent(value, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  if (!editor) return null;

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2 rounded-lg border border-gold/15 bg-noir-surface/40 p-2">
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
      </div>
      <EditorContent editor={editor} />
      <p className="mt-1.5 font-ui text-xs text-gold-dim">
        Seleccioná texto y usá los botones de arriba. "+ Subtítulo" convierte la línea completa en un
        encabezado H2; "+ Cita destacada" la convierte en una cita resaltada. Para volver a texto normal,
        parate en esa línea y usá "Párrafo normal".
      </p>
    </div>
  );
}
