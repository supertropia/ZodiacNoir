import { SOCIAL_LINKS, type SocialId } from "@/lib/social";

// Íconos de línea fina, dibujados a mano para acompañar el estilo del sitio.
// Heredan el color del texto (currentColor), así que cambian solos con el tema claro/oscuro.
function SocialIcon({ id, size }: { id: SocialId; size: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (id) {
    case "youtube":
      return (
        <svg {...common}>
          <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
          <path d="M10.2 9.3v5.4l4.6-2.7z" />
        </svg>
      );
    case "spotify":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9.5" />
          <path d="M7 9.4c3.4-1 7.2-.7 10.2 1.1" />
          <path d="M7.6 12.5c2.8-.8 5.8-.5 8.3 1" />
          <path d="M8.3 15.4c2.2-.6 4.4-.4 6.4.7" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
        </svg>
      );
    case "x":
      return (
        <svg {...common}>
          <path d="M4 4l16 16" />
          <path d="M20 4L4 20" />
        </svg>
      );
  }
}

type Variant = "strip" | "full" | "footer";

/**
 * Enlaces a tus redes, en tres presentaciones:
 * - "strip":  píldoras chicas y discretas (página principal) — solo las destacadas.
 * - "full":   píldoras más grandes (Sobre nosotros) — todas.
 * - "footer": lista simple de texto con ícono (pie de página) — todas.
 */
export function SocialLinks({ variant }: { variant: Variant }) {
  if (variant === "footer") {
    return (
      <ul className="space-y-2">
        {SOCIAL_LINKS.map((link) => (
          <li key={link.id}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              title={link.description}
              className="inline-flex items-center gap-2 transition hover:text-gold"
            >
              <SocialIcon id={link.id} size={15} />
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    );
  }

  const links = variant === "strip" ? SOCIAL_LINKS.filter((l) => l.featured) : SOCIAL_LINKS;
  const isStrip = variant === "strip";

  return (
    <ul className={`flex flex-wrap items-center gap-3 ${isStrip ? "justify-center" : ""}`}>
      {links.map((link) => (
        <li key={link.id}>
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            title={link.description}
            aria-label={link.description}
            className={`focus-ring inline-flex items-center gap-2 rounded-full border border-gold/30 font-ui uppercase tracking-wide text-gold transition hover:border-gold hover:bg-gold/10 ${
              isStrip ? "px-4 py-2 text-xs" : "px-5 py-2.5 text-xs"
            }`}
          >
            <SocialIcon id={link.id} size={isStrip ? 16 : 18} />
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
