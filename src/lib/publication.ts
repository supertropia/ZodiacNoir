import type { Prisma } from "@prisma/client";

/**
 * Programación de artículos.
 *
 * No hay ninguna tarea automática ("cron") detrás: un artículo programado es
 * simplemente un artículo con `published = true` y una `publishedAt` en el
 * futuro. Las páginas públicas piden solo los artículos cuya fecha ya llegó,
 * así que en el momento exacto en que pasa la hora el artículo aparece solo.
 */

/** Zona horaria con la que se muestran las fechas de publicación en el panel. */
export const PUBLICATION_TIME_ZONE = "America/Argentina/Buenos_Aires";

export type PublicationStatus = "draft" | "scheduled" | "published";

type PublicationFields = { published: boolean; publishedAt: Date | null };

/**
 * Filtro de Prisma para "artículo visible al público": publicado y con la fecha
 * de publicación ya cumplida. Un artículo publicado sin fecha se considera visible.
 */
export function livePublicationFilter(now: Date = new Date()): Prisma.ArticleWhereInput {
  return {
    published: true,
    OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
  };
}

/** Versión para un solo artículo ya cargado (por ejemplo, en la página de detalle). */
export function isArticleLive(article: PublicationFields, now: Date = new Date()): boolean {
  return article.published && (article.publishedAt === null || article.publishedAt <= now);
}

export function getPublicationStatus(
  article: PublicationFields,
  now: Date = new Date()
): PublicationStatus {
  if (!article.published) return "draft";
  return isArticleLive(article, now) ? "published" : "scheduled";
}

/** Fecha y hora legibles, siempre en horario de Argentina (el servidor corre en UTC). */
export function formatPublicationDateTime(date: Date): string {
  return date.toLocaleString("es-AR", {
    timeZone: PUBLICATION_TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

const MAX_DAYS_AHEAD = 365 * 2;

/**
 * Interpreta la fecha que llega desde el formulario (texto ISO).
 * Vacía = sin fecha. Rechaza textos inválidos y fechas absurdas (por ejemplo, un
 * año mal tipeado que dejaría el artículo oculto por décadas).
 */
export function parsePublishDate(
  raw: unknown,
  now: Date = new Date()
): { date: Date | null; error: string | null } {
  if (raw === undefined || raw === null || raw === "") return { date: null, error: null };

  const invalid = { date: null, error: "La fecha de publicación no es válida." };
  if (typeof raw !== "string") return invalid;

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return invalid;
  if (date.getUTCFullYear() < 2000) return invalid;

  const limit = new Date(now.getTime() + MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000);
  if (date > limit) {
    return {
      date: null,
      error: "La fecha de publicación está demasiado lejos (máximo 2 años hacia adelante).",
    };
  }

  return { date, error: null };
}

/**
 * Decide qué `publishedAt` guardar.
 * - Borrador: sin fecha.
 * - Con fecha elegida: esa fecha (futura = programado, pasada = se publica ya con esa fecha).
 * - Sin fecha elegida: se conserva la fecha original si el artículo ya estaba visible;
 *   si no (artículo nuevo o que estaba programado), se publica ahora.
 */
export function resolvePublishedAt(opts: {
  published: boolean;
  requested: Date | null;
  current?: Date | null;
  now?: Date;
}): Date | null {
  const { published, requested, current = null, now = new Date() } = opts;
  if (!published) return null;
  if (requested) return requested;
  if (current && current <= now) return current;
  return now;
}
