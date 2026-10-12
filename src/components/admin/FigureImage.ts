import { Node } from "@tiptap/react";

// Imagen con pie de foto para el editor de artículos.
//
// Se guarda como HTML estándar:
//   <figure><img src="…" alt="…"><figcaption>Pie de foto</figcaption></figure>
// que es la estructura con la que Google asocia el pie de foto a la imagen.
//
// - El pie de foto se escribe directamente debajo de la imagen, dentro del editor.
// - Texto alternativo (alt): si la editora no escribe uno aparte, se usa el pie de foto,
//   así la imagen siempre queda descripta para buscadores y lectores de pantalla.
// - Los artículos viejos con una <img> suelta se leen igual (quedan como figura sin pie).

const CAPTION_PLACEHOLDER_CLASS = "is-empty";

function isAllowedSrc(src: string | null | undefined): src is string {
  return Boolean(src) && !String(src).trim().toLowerCase().startsWith("data:");
}

export const FigureImage = Node.create({
  name: "figureImage",
  group: "block",
  // El contenido es el pie de foto (texto en línea).
  content: "inline*",
  isolating: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: "" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure",
        // Si la figura no trae <figcaption>, se usa uno vacío para no romper la lectura.
        contentElement: (element: HTMLElement) =>
          element.querySelector("figcaption") ?? element.ownerDocument.createElement("figcaption"),
        getAttrs: (element: HTMLElement | string) => {
          if (typeof element === "string") return false;
          const img = element.querySelector("img");
          const src = img?.getAttribute("src");
          if (!img || !isAllowedSrc(src)) return false;
          const caption = (element.querySelector("figcaption")?.textContent ?? "").trim();
          const alt = (img.getAttribute("alt") ?? "").trim();
          // Si el alt es igual al pie de foto, se considera "derivado" y no se guarda aparte.
          return { src, alt: alt === caption ? "" : alt };
        },
      },
      {
        // Imágenes sueltas de artículos anteriores.
        tag: "img[src]",
        getAttrs: (element: HTMLElement | string) => {
          if (typeof element === "string") return false;
          const src = element.getAttribute("src");
          if (!isAllowedSrc(src)) return false;
          return { src, alt: element.getAttribute("alt") ?? "" };
        },
      },
    ];
  },

  renderHTML({ node }) {
    const alt = (node.attrs.alt as string) || node.textContent.trim();
    return ["figure", {}, ["img", { src: node.attrs.src, alt }], ["figcaption", 0]];
  },

  addKeyboardShortcuts() {
    return {
      // Enter dentro del pie de foto no debe duplicar la figura: sale a un párrafo nuevo debajo.
      Enter: ({ editor }) => {
        const { $from } = editor.state.selection;
        if ($from.parent.type.name !== this.name) return false;
        const after = $from.after();
        return editor
          .chain()
          .insertContentAt(after, { type: "paragraph" })
          .focus(after + 1)
          .run();
      },
    };
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement("figure");

      const img = document.createElement("img");
      img.draggable = false;
      img.src = node.attrs.src ?? "";
      img.alt = node.attrs.alt || node.textContent.trim();
      // Un clic sobre la imagen selecciona la figura completa (para borrarla con Suprimir).
      img.addEventListener("click", () => {
        if (typeof getPos !== "function") return;
        const pos = getPos();
        if (typeof pos === "number") editor.commands.setNodeSelection(pos);
      });

      // Aquí escribe la editora el pie de foto.
      const caption = document.createElement("figcaption");
      caption.classList.toggle(CAPTION_PLACEHOLDER_CLASS, node.content.size === 0);

      dom.append(img, caption);

      return {
        dom,
        contentDOM: caption,
        update: (updated) => {
          if (updated.type.name !== node.type.name) return false;
          img.src = updated.attrs.src ?? "";
          img.alt = updated.attrs.alt || updated.textContent.trim();
          caption.classList.toggle(CAPTION_PLACEHOLDER_CLASS, updated.content.size === 0);
          return true;
        },
        selectNode: () => dom.classList.add("is-selected"),
        deselectNode: () => dom.classList.remove("is-selected"),
      };
    };
  },
});
