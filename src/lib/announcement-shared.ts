// Datos de la "novedad de la portada" (por ahora: el aviso de las agendas en Amazon).
// Este archivo no usa la base de datos, así que lo pueden importar tanto el panel como la portada.

export type HomeAnnouncementContent = {
  /** Palabra pequeña sobre el título, ej. "Novedad". */
  eyebrow: string;
  /** Texto corto del aviso que aparece arriba de todo en la portada (el que lleva a la novedad). */
  pill: string;
  title: string;
  /** Texto debajo del título (opcional). */
  text: string;
  imageUrl: string;
  /** Video (opcional). Si no hay video, el botón "Ver por dentro" no se muestra. */
  videoUrl: string;
  /** Enlace a la página de Amazon: es a donde lleva el botón principal. */
  amazonUrl: string;
  /**
   * Producto de la tienda con la ficha completa de la agenda (descripción, video, datos para Google).
   * Si está elegido, «Ver por dentro» lleva a esa ficha. Si está vacío, abre el video en una ventana.
   */
  productSlug: string;
  primaryLabel: string;
  secondaryLabel: string;
};

export type HomeAnnouncement = HomeAnnouncementContent & {
  /** true = visible en la portada. */
  enabled: boolean;
};

export const DEFAULT_ANNOUNCEMENT_CONTENT: HomeAnnouncementContent = {
  eyebrow: "Novedad",
  pill: "Ya están las agendas Zodiac Noir",
  title: "Ya están disponibles las agendas Zodiac Noir",
  text: "Disponibles en Amazon. ¡Consigue la tuya!",
  imageUrl: "",
  videoUrl: "",
  amazonUrl: "",
  productSlug: "",
  primaryLabel: "¡La quiero!",
  secondaryLabel: "Ver por dentro",
};

/** Largo máximo de cada texto (el panel lo usa para avisar y el servidor para validar). */
export const ANNOUNCEMENT_LIMITS = {
  eyebrow: 30,
  pill: 45,
  title: 90,
  text: 280,
  label: 28,
} as const;
