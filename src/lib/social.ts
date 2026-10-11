// Única fuente de verdad para tus redes y canales. Se usa en:
// - la franja de redes de la página principal
// - la sección "Podés encontrarme en mis redes" de Sobre nosotros
// - la columna "Seguinos" del pie de página
// Para cambiar un enlace o agregar una red, alcanza con editar esta lista.

export type SocialId = "youtube" | "spotify" | "instagram" | "x";

export type SocialLink = {
  id: SocialId;
  label: string;
  // Texto que leen los lectores de pantalla y que aparece al dejar el mouse encima.
  description: string;
  href: string;
  // Las destacadas se muestran en la página principal; las demás solo en Sobre nosotros y el pie.
  featured: boolean;
};

export const SOCIAL_LINKS: SocialLink[] = [
  {
    id: "youtube",
    label: "YouTube",
    description: "Mirá los videos de Zodiac Noir en YouTube",
    href: "https://www.youtube.com/channel/UCARqUYIKWHgmY6CSlMlrKmw",
    featured: true,
  },
  {
    id: "spotify",
    label: "Spotify",
    description: "Escuchá el podcast de Zodiac Noir en Spotify",
    href: "https://open.spotify.com/show/1hCLuScZgJnQHn9X7Eo8SD",
    featured: true,
  },
  {
    id: "instagram",
    label: "Instagram",
    description: "Seguí a Zodiac Noir en Instagram",
    href: "https://www.instagram.com/astrologia_zodiac_noir/",
    featured: true,
  },
  {
    id: "x",
    label: "X",
    description: "Seguí a Zodiac Noir en X",
    href: "https://x.com/zodiacnoir",
    featured: false,
  },
];
