// Utilidades compartidas para archivos de video: las usan el panel (navegador) y las rutas del servidor.
// No depende de nada del servidor, así que se puede importar desde cualquier componente.

/** Tipos de video que se aceptan al subir. */
export const VIDEO_ALLOWED_TYPES = ["video/mp4", "video/webm", "video/quicktime"] as const;

/** Peso máximo de un video: 300 MB. */
export const VIDEO_MAX_BYTES = 300 * 1024 * 1024;

/** Carpeta (prefijo) donde se guardan los videos en Vercel Blob. */
export const VIDEO_UPLOAD_PREFIX = "zodiac-noir/videos/";

const EXTENSION_TYPES: Record<string, string> = {
  mp4: "video/mp4",
  m4v: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

/**
 * Devuelve el tipo de video de un archivo. Usa el tipo que informa el navegador y, si no lo informa
 * (pasa en algunas computadoras con Windows), lo deduce por la extensión. null = no es un video aceptado.
 */
export function resolveVideoType(fileName: string, fileType: string): string | null {
  if ((VIDEO_ALLOWED_TYPES as readonly string[]).includes(fileType)) return fileType;
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_TYPES[ext] ?? null;
}

/**
 * Valida una dirección web opcional. Vacía = válida (sin dirección). Solo acepta http o https.
 * Devuelve la dirección tal como se escribió (sin espacios alrededor) para no alterar enlaces largos como los de Amazon.
 */
export function parseOptionalUrl(value: unknown): { ok: true; url: string | null } | { ok: false } {
  if (value === undefined || value === null) return { ok: true, url: null };
  if (typeof value !== "string") return { ok: false };
  const trimmed = value.trim();
  if (!trimmed) return { ok: true, url: null };
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") return { ok: true, url: trimmed };
  } catch {
    // dirección mal escrita: se informa abajo
  }
  return { ok: false };
}
