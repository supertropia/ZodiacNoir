// Validación del formulario de pedido de lecturas. Se usa en el servidor, que es donde se
// comprueba de verdad (el formulario del navegador solo ayuda a quien lo completa).

import { validateEmail } from "./email-validation";
import { normalizeName } from "./name-validation";
import {
  BIRTH_TIME_OPTIONS,
  READING_FOCUS_OPTIONS,
  getReadingService,
  type BirthTimeMode,
  type ReadingServiceKey,
} from "./lecturas";

export const ABOUT_MAX_LENGTH = 1500;
export const PLACE_MAX_LENGTH = 100;

export type ReadingRequest = {
  service: ReadingServiceKey;
  name: string;
  email: string;
  birthDate: string;
  birthTime: string | null;
  birthTimeMode: BirthTimeMode;
  birthPlace: string;
  focus: string;
  about: string | null;
  solarYear: number | null;
  solarPlace: string | null;
};

export type ReadingValidation = { ok: true; data: ReadingRequest } | { ok: false; error: string };

const NAME_RE = /^\p{L}[\p{L}\p{M}'’.\- ]{1,79}$/u;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
// Sin caracteres de control ni etiquetas HTML.
const FORBIDDEN_TEXT_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F<>]/;

function fail(error: string): ReadingValidation {
  return { ok: false, error };
}

function cleanLine(value: unknown): string {
  return typeof value === "string" ? value.normalize("NFC").replace(/\s+/g, " ").trim() : "";
}

function validPlace(value: string): boolean {
  return value.length >= 2 && value.length <= PLACE_MAX_LENGTH && !FORBIDDEN_TEXT_RE.test(value);
}

/** AAAA-MM-DD real (sin 31 de febrero), entre 1900 y hoy. */
function isValidBirthDate(value: string): boolean {
  const match = DATE_RE.exec(value);
  if (!match) return false;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (y < 1900) return false;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return false;
  return value <= new Date().toISOString().slice(0, 10);
}

export async function validateReadingRequest(body: any, now = new Date()): Promise<ReadingValidation> {
  const service = getReadingService(body?.service);
  if (!service) return fail("Elige una lectura para continuar.");

  const name = normalizeName(typeof body?.name === "string" ? body.name : "");
  if (!NAME_RE.test(name)) return fail("Escribe tu nombre tal como quieres que aparezca en la lectura.");

  const emailCheck = await validateEmail(body?.email);
  if (!emailCheck.ok) {
    const messages: Record<string, string> = {
      EmailInvalido: "El correo electrónico no parece válido. Revísalo, por favor.",
      EmailTemporal: "Usa un correo permanente: ahí recibirás tu lectura.",
      EmailTypo: "Revisa tu correo: parece tener un error de tipeo en el dominio.",
      EmailDominioInexistente: "No pudimos verificar ese correo. Revisa que esté bien escrito.",
    };
    return fail(messages[emailCheck.reason] ?? "El correo electrónico no es válido.");
  }

  const birthDate = typeof body?.birthDate === "string" ? body.birthDate.trim() : "";
  if (!isValidBirthDate(birthDate)) return fail("Revisa tu fecha de nacimiento.");

  const mode = BIRTH_TIME_OPTIONS.find((o) => o.value === body?.birthTimeMode)?.value;
  if (!mode) return fail("Indica si conoces tu hora de nacimiento.");

  let birthTime: string | null = null;
  if (mode !== "unknown") {
    const timeText = typeof body?.birthTime === "string" ? body.birthTime.trim() : "";
    if (!TIME_RE.test(timeText)) return fail("Escribe tu hora de nacimiento (por ejemplo 14:30).");
    birthTime = timeText;
  }

  const birthPlace = cleanLine(body?.birthPlace);
  if (!validPlace(birthPlace)) return fail("Escribe la ciudad y el país donde naciste.");

  const focus = READING_FOCUS_OPTIONS.find((o) => o.value === body?.focus)?.value;
  if (!focus) return fail("Elige el área que más te interesa.");

  let about: string | null = null;
  if (typeof body?.about === "string" && body.about.trim()) {
    const aboutText = body.about.replace(/\r\n/g, "\n").trim();
    if (aboutText.length > ABOUT_MAX_LENGTH) return fail(`El texto sobre ti no puede superar los ${ABOUT_MAX_LENGTH} caracteres.`);
    if (FORBIDDEN_TEXT_RE.test(aboutText.replace(/\n/g, " "))) return fail("El texto sobre ti tiene caracteres que no podemos aceptar.");
    about = aboutText;
  }

  let solarYear: number | null = null;
  let solarPlace: string | null = null;
  if (service.key === "revolucion-solar") {
    const year = Number(body?.solarYear);
    const currentYear = now.getUTCFullYear();
    if (!Number.isInteger(year) || year < currentYear - 1 || year > currentYear + 1) {
      return fail("Elige el año de tu cumpleaños que quieres interpretar.");
    }
    solarYear = year;
    const placeText = cleanLine(body?.solarPlace);
    if (!validPlace(placeText)) return fail("Indica en qué ciudad estarás el día de tu cumpleaños.");
    solarPlace = placeText;
  }

  if (body?.consent !== true) return fail("Debes aceptar los términos para continuar.");

  return {
    ok: true,
    data: {
      service: service.key,
      name,
      email: emailCheck.email,
      birthDate,
      birthTime,
      birthTimeMode: mode,
      birthPlace,
      focus,
      about,
      solarYear,
      solarPlace,
    },
  };
}
