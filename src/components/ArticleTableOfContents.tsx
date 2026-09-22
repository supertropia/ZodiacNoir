import type { TocHeading } from "@/lib/toc";

// Índice de contenidos al inicio del artículo. Sin estado ni JavaScript:
// son anclas <a href="#..."> normales, así que el salto con scroll suave lo
// resuelve el CSS global (ver globals.css).
//
// Si el artículo está bloqueado (premium y la persona no es miembro), no hay
// contenido real en pantalla para saltar — en ese caso cada ítem apunta al
// cartel de "Hazte miembro" en vez de a la sección, y se lo marca con un
// candado para que quede claro que es contenido exclusivo.
export function ArticleTableOfContents({ headings, locked }: { headings: TocHeading[]; locked: boolean }) {
  if (headings.length === 0) return null;

  return (
    <nav
      aria-label="Índice del artículo"
      className="prose-zodiac-toc mt-10 rounded-xl border border-gold/20 bg-noir-surface2/30 p-5"
    >
      <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">En este artículo</p>
      <ol className="mt-3 space-y-2">
        {headings.map((heading, i) => (
          <li key={heading.id}>
            
              href={locked ? "#paywall-cta" : `#${heading.id}`}
              className="group flex items-baseline gap-2.5 font-ui text-sm text-gold-pale/85 transition hover:text-gold"
            >
              <span className="text-gold-dim">{String(i + 1).padStart(2, "0")}</span>
              <span className="underline-offset-4 group-hover:underline">{heading.text}</span>
              {locked && (
                <span aria-label="Solo para miembros" className="text-gold-dim">
                  🔒
                </span>
              )}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
