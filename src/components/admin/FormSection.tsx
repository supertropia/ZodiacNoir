import type { ReactNode } from "react";

// Una sección de un formulario del panel, con el mismo estilo marcado que la sección SEO de los artículos:
// borde dorado, una franja de título arriba y el contenido debajo. Sirve para distinguir cada parte de un vistazo.
export function FormSection({
  eyebrow,
  title,
  help,
  id,
  children,
}: {
  /** Rótulo chico sobre el título: el grupo al que pertenece la sección (por ejemplo «Imágenes»). */
  eyebrow: string;
  title: string;
  help?: ReactNode;
  id: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={`${id}-heading`}
      className="overflow-hidden rounded-2xl border-2 border-gold/60 bg-noir-surface2/40 shadow-sm"
    >
      <div className="border-b-2 border-gold/40 bg-noir-surface2 px-5 py-4 sm:px-6">
        <p className="font-ui text-xs font-semibold uppercase tracking-widest text-gold">{eyebrow}</p>
        <h2 id={`${id}-heading`} className="mt-1 font-display text-xl text-gold-pale sm:text-2xl">
          {title}
        </h2>
        {help && <div className="mt-2 font-ui text-sm leading-relaxed text-gold-pale/85">{help}</div>}
      </div>
      <div className="space-y-5 p-4 sm:p-6">{children}</div>
    </section>
  );
}
