import type { ReactNode } from "react";

// Soporta una sintaxis mínima tipo Markdown para que el panel de administración
// permita **negrita**, *cursiva*, [enlaces](https://...), imágenes ![alt](url)
// y videos de YouTube/Vimeo [video](url), sin necesidad de un editor de texto
// enriquecido ni HTML crudo (más seguro).

const INLINE_RE = /(\*\*(.+?)\*\*|\*(.+?)\*|\[(.+?)\]\((.+?)\)|!\[(.*?)\]\((.+?)\))/;

/** Convierte una URL de YouTube o Vimeo en su URL de embed. Devuelve null si no reconoce el formato. */
export function toVideoEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace("www.", "");

    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (u.pathname === "/watch") {
        const id = u.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      if (u.pathname.startsWith("/embed/")) return url;
      if (u.pathname.startsWith("/shorts/")) {
        const id = u.pathname.split("/")[2];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
    }
    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    if (host === "player.vimeo.com") return url;

    return null;
  } catch {
    return null;
  }
}

function VideoEmbed({ url }: { url: string }) {
  const embedUrl = toVideoEmbedUrl(url);
  if (!embedUrl) return null;
  return (
    <div className="relative my-8 aspect-video w-full overflow-hidden rounded-xl border border-gold/20">
      <iframe
        src={embedUrl}
        title="Video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let remaining = text;
  let i = 0;

  while (remaining.length) {
    const match = remaining.match(INLINE_RE);
    if (!match || match.index === undefined) {
      parts.push(remaining);
      break;
    }
    if (match.index > 0) parts.push(remaining.slice(0, match.index));

    if (match[2] !== undefined) {
      parts.push(<strong key={`${keyPrefix}-${i++}`}>{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      parts.push(<em key={`${keyPrefix}-${i++}`}>{match[3]}</em>);
    } else if (match[4] !== undefined) {
      parts.push(
        <a
          key={`${keyPrefix}-${i++}`}
          href={match[5]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold underline underline-offset-4 hover:text-gold-bright"
        >
          {match[4]}
        </a>
      );
    } else if (match[7] !== undefined) {
      // eslint-disable-next-line @next/next/no-img-element
      parts.push(
        <img
          key={`${keyPrefix}-${i++}`}
          src={match[7]}
          alt={match[6] || ""}
          className="my-6 w-full rounded-xl border border-gold/20"
        />
      );
    }

    remaining = remaining.slice(match.index + match[0].length);
  }

  return parts;
}

/** Convierte el contenido plano guardado en la base de datos en párrafos/imágenes/videos de React. */
export function renderArticleContent(content: string): ReactNode[] {
  const blocks = content.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);

  return blocks.map((block, i) => {
    const soloImagen = block.match(/^!\[(.*?)\]\((.+?)\)$/);
    if (soloImagen) {
      // eslint-disable-next-line @next/next/no-img-element
      return (
        <img
          key={i}
          src={soloImagen[2]}
          alt={soloImagen[1] || ""}
          className="my-8 w-full rounded-xl border border-gold/20"
        />
      );
    }
    const soloVideo = block.match(/^\[video\]\((.+?)\)$/);
    if (soloVideo) {
      return <VideoEmbed key={i} url={soloVideo[1]} />;
    }
    return (
      <p key={i} className="mb-6">
        {renderInline(block, `p${i}`)}
      </p>
    );
  });
}

/** Quita la sintaxis y devuelve texto plano, para el botón "Escuchar este artículo". */
export function stripToPlainText(content: string): string {
  return content
    .replace(/\[video\]\((.+?)\)/g, "")
    .replace(/!\[(.*?)\]\((.+?)\)/g, "")
    .replace(/\[(.+?)\]\((.+?)\)/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}
