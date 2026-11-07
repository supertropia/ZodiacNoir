// Reglas de subida de archivos del importador (/admin/importar). Las usan el panel (navegador) y la ruta
// que entrega el permiso de subida, así que no depende de nada del servidor.

import { VIDEO_ALLOWED_TYPES, VIDEO_MAX_BYTES, resolveVideoType } from "@/lib/media";

/** Carpeta (prefijo) donde el importador guarda sus archivos en Vercel Blob. */
export const IMPORT_UPLOAD_PREFIX = "zodiac-noir/import/";

export type ImportUploadKind = "image" | "pdf" | "video";

export const IMPORT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

/** Peso máximo por tipo de archivo. */
export const IMPORT_MAX_BYTES: Record<ImportUploadKind, number> = {
  image: 10 * 1024 * 1024,
  pdf: 100 * 1024 * 1024,
  video: VIDEO_MAX_BYTES,
};

export const IMPORT_ALLOWED_TYPES: Record<ImportUploadKind, readonly string[]> = {
  image: IMPORT_IMAGE_TYPES,
  pdf: ["application/pdf"],
  video: VIDEO_ALLOWED_TYPES,
};

const IMAGE_EXTENSION_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

/** Tipo de contenido de un archivo según su tipo informado o su extensión. null = no se puede subir. */
export function importContentType(fileName: string, fileType: string, kind: ImportUploadKind): string | null {
  if (kind === "pdf") return "application/pdf";
  if (kind === "video") return resolveVideoType(fileName, fileType);
  if ((IMPORT_IMAGE_TYPES as readonly string[]).includes(fileType)) return fileType;
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_EXTENSION_TYPES[ext] ?? null;
}

export function formatMegabytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toLocaleString("es-AR", { maximumFractionDigits: 1 })} MB`;
}
