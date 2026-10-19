import { promises as dns } from "dns";

// Validación de correos para el ingreso por email. Se usa SOLO en el servidor.
//
// No usamos una lista cerrada de proveedores (gmail, hotmail, etc.) porque dejaría afuera a
// personas con correo laboral, de escuela o de dominio propio, que son justo las que no
// pueden ingresar con Google. En su lugar combinamos varias barreras:
//   1. Formato estricto (solo caracteres normales de un correo: se descartan comillas,
//      punto y coma, paréntesis, etc., que son los que usan los intentos de inyección).
//   2. Bloqueo de servicios de correo descartable.
//   3. Detección de errores de tipeo comunes en el dominio (gmial.com, hotmial.com...).
//   4. Comprobación de que el dominio existe y puede recibir correo (registros MX).
// Y lo más importante: el acceso se da por un enlace enviado al correo, así que solo entra
// quien realmente recibe ese mensaje.

export type EmailCheck =
  | { ok: true; email: string }
  | { ok: false; reason: "EmailInvalido" | "EmailTemporal" | "EmailTypo" | "EmailDominioInexistente" };

const MAX_EMAIL_LENGTH = 254;

// Parte local: letras, números y . _ % + - (máx. 64). Dominio: etiquetas con letras,
// números y guiones, y un final de al menos 2 letras. Sin puntos seguidos ni al borde.
const EMAIL_RE =
  /^[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9])?@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/;

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "sharklasers.com",
  "10minutemail.com",
  "10minutemail.net",
  "tempmail.com",
  "temp-mail.org",
  "temp-mail.io",
  "tempmailo.com",
  "yopmail.com",
  "yopmail.net",
  "trashmail.com",
  "getnada.com",
  "nada.email",
  "maildrop.cc",
  "dispostable.com",
  "fakeinbox.com",
  "mohmal.com",
  "emailondeck.com",
  "throwawaymail.com",
  "mintemail.com",
  "spamgourmet.com",
  "burnermail.io",
  "mailnesia.com",
  "moakt.com",
  "tmpmail.org",
  "tmpmail.net",
  "discard.email",
  "mytemp.email",
  "inboxkitten.com",
]);

// Errores de tipeo frecuentes en dominios populares.
const TYPO_DOMAINS = new Set([
  "gmial.com",
  "gmai.com",
  "gamil.com",
  "gmail.con",
  "gmail.cm",
  "gmaill.com",
  "gnail.com",
  "gmail.comm",
  "hotmial.com",
  "hotmal.com",
  "hotmail.con",
  "hotmai.com",
  "hotmaill.com",
  "outlok.com",
  "outlook.con",
  "outllok.com",
  "yaho.com",
  "yahooo.com",
  "yahoo.con",
  "yahoo.co",
  "icloud.con",
  "iclod.com",
]);

/** Pasa a minúsculas y quita espacios al principio y al final. */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

// Proveedores conocidos: no hace falta consultar su DNS.
const TRUSTED_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "hotmail.com.ar",
  "hotmail.es",
  "outlook.com",
  "outlook.com.ar",
  "outlook.es",
  "live.com",
  "msn.com",
  "yahoo.com",
  "yahoo.com.ar",
  "yahoo.es",
  "ymail.com",
  "icloud.com",
  "me.com",
  "proton.me",
  "protonmail.com",
  "aol.com",
]);

// Dominio de control: si ni siquiera este se puede resolver, el problema es del DNS del
// servidor y no del correo de la persona.
const CONTROL_DOMAIN = "gmail.com";

/** true = tiene registros para recibir correo; false = el dominio no existe o no recibe correo. */
async function hasMailRecords(domain: string): Promise<boolean> {
  try {
    const mx = await dns.resolveMx(domain);
    if (mx.length > 0) return true;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENODATA" && code !== "ENOTFOUND") throw error;
  }
  // Sin registro MX, el correo se entrega al registro A del dominio (si existe).
  try {
    const a = await dns.resolve4(domain);
    return a.length > 0;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENODATA" || code === "ENOTFOUND") return false;
    throw error;
  }
}

async function domainCanReceiveMail(domain: string): Promise<boolean> {
  if (TRUSTED_DOMAINS.has(domain)) return true;

  const check = async () => {
    if (await hasMailRecords(domain)) return true;
    // El dominio parece no existir. Antes de rechazarlo comprobamos que el DNS del
    // servidor esté funcionando (con un dominio que sabemos que existe). Si no funciona,
    // no bloqueamos a nadie por un problema que no es suyo.
    const dnsWorks = await hasMailRecords(CONTROL_DOMAIN).catch(() => false);
    return dnsWorks ? false : true;
  };

  // Si la consulta de DNS tarda o falla por un problema nuestro, no bloqueamos a la persona.
  const timeout = new Promise<boolean>((resolve) => setTimeout(() => resolve(true), 3000));
  try {
    return await Promise.race([check(), timeout]);
  } catch {
    return true;
  }
}

export async function validateEmail(raw: unknown): Promise<EmailCheck> {
  if (typeof raw !== "string") return { ok: false, reason: "EmailInvalido" };

  const email = normalizeEmail(raw);
  if (email.length > MAX_EMAIL_LENGTH || email.includes("..") || !EMAIL_RE.test(email)) {
    return { ok: false, reason: "EmailInvalido" };
  }

  const domain = email.split("@")[1];

  if (DISPOSABLE_DOMAINS.has(domain)) return { ok: false, reason: "EmailTemporal" };
  if (TYPO_DOMAINS.has(domain)) return { ok: false, reason: "EmailTypo" };
  if (!(await domainCanReceiveMail(domain))) return { ok: false, reason: "EmailDominioInexistente" };

  return { ok: true, email };
}
