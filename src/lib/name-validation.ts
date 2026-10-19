// Validación del nombre y apellido que se pide al crear una cuenta.
// Es código "puro" (sin dependencias del servidor), así que se usa tanto en el formulario
// del navegador como en el servidor, que es donde se vuelve a comprobar de verdad.

export type NameCheck = { ok: true; name: string } | { ok: false; code: "NombreInvalido" };

export const NAME_MIN_LENGTH = 3;
export const NAME_MAX_LENGTH = 80;

// Solo letras (con tildes, ñ, diéresis y letras de cualquier idioma), espacios, guion,
// apóstrofe y punto. Nada de números, símbolos, comillas, punto y coma ni etiquetas.
const NAME_RE = /^\p{L}[\p{L}\p{M}'’.\- ]*$/u;

/** Normaliza espacios: quita los de los bordes y reduce los repetidos a uno solo. */
export function normalizeName(raw: string): string {
  return raw.normalize("NFC").replace(/\s+/g, " ").trim();
}

export function validateName(raw: unknown): NameCheck {
  if (typeof raw !== "string") return { ok: false, code: "NombreInvalido" };

  const name = normalizeName(raw);
  if (name.length < NAME_MIN_LENGTH || name.length > NAME_MAX_LENGTH) {
    return { ok: false, code: "NombreInvalido" };
  }
  if (!NAME_RE.test(name)) return { ok: false, code: "NombreInvalido" };

  // Nombre y apellido: al menos dos palabras de 2 o más caracteres cada una.
  const words = name.split(" ");
  if (words.length < 2 || words.some((word) => word.length < 2)) {
    return { ok: false, code: "NombreInvalido" };
  }

  // Sin signos repetidos o pegados entre sí (por ejemplo "--", "..", "''").
  if (/[.'’-]{2,}/.test(name)) return { ok: false, code: "NombreInvalido" };

  return { ok: true, name };
}
